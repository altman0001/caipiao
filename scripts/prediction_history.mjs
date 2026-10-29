import fs from 'node:fs';
import { complementNumbers, evaluateExclusion } from '../webapp/src/lib/analysis.js';

export const PREDICTION_STRATEGY = 'risk-budget-exclude';
export const PREDICTION_ALGORITHM_VERSION = 'predict-v2';
const COMPLEMENT_STRATEGY = 'likely-complement';

const RECORD_STATUSES = new Set(['pending', 'evaluated', 'unevaluable', 'hit', 'miss']);
const OPTIONAL_NUMBER_ARRAYS = [
  'excludedMain', 'excludedExtra', 'actualMain', 'actualExtra',
  'hitMain', 'hitExtra', 'falseExcludedMain', 'falseExcludedExtra',
];

function isNumberArray(value) {
  return Array.isArray(value) && value.every(n => Number.isInteger(n) && n > 0);
}

function validateHistory(hist, file) {
  if (!hist || typeof hist !== 'object' || Array.isArray(hist) || !Array.isArray(hist.records)) {
    throw new Error(`预测历史格式无效: ${file}`);
  }
  hist.records.forEach((rec, index) => {
    const invalid = (reason) => { throw new Error(`预测历史记录无效: ${file}#${index} (${reason})`); };
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) invalid('记录必须是对象');
    if (typeof rec.issue !== 'string' || !rec.issue) invalid('缺少期号');
    if (!RECORD_STATUSES.has(rec.status)) invalid('状态无效');
    if (!isNumberArray(rec.keptMain) || !isNumberArray(rec.keptExtra)) invalid('保留号码必须是正整数数组');
    for (const field of OPTIONAL_NUMBER_ARRAYS) {
      if (rec[field] != null && !isNumberArray(rec[field])) invalid(`${field} 必须是正整数数组或 null`);
    }
    if (['evaluated', 'hit', 'miss'].includes(rec.status)
      && (!isNumberArray(rec.actualMain) || !isNumberArray(rec.actualExtra))) {
      invalid('已开奖记录缺少实际号码');
    }
    if (rec.generatedAt != null
      && (typeof rec.generatedAt !== 'string' || !Number.isFinite(Date.parse(rec.generatedAt)))) {
      invalid('generatedAt 必须是有效时间或 null');
    }
    if (rec.actualDate != null
      && (typeof rec.actualDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rec.actualDate))) {
      invalid('actualDate 必须是 YYYY-MM-DD 或 null');
    }
  });
  return hist;
}

export function loadHistory(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return { schemaVersion: 2, records: [] };
    throw error;
  }
  return validateHistory(JSON.parse(text), file);
}

export function writeTextAtomic(file, text) {
  const tmp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, text, 'utf8');
    fs.renameSync(tmp, file);
  } catch (error) {
    try { fs.unlinkSync(tmp); } catch { /* 临时文件不存在时无需处理 */ }
    throw error;
  }
}

export function saveHistory(file, hist) {
  validateHistory(hist, file);
  writeTextAtomic(file, JSON.stringify(hist, null, 2) + '\n');
}

export function needsNewSnapshot(records, nextIssue) {
  return Boolean(nextIssue) && !records.some(r => r.issue === nextIssue);
}

export function createPredictionRecord({ issue, sourceLatestIssue, game, prediction, now }) {
  const excludedMain = [...prediction.excludedMain].sort((a, b) => a - b);
  const excludedExtra = [...prediction.excludedExtra].sort((a, b) => a - b);
  const keptMain = complementNumbers(game.mainRange, excludedMain);
  const keptExtra = complementNumbers(game.extraRange, excludedExtra);
  return {
    issue,
    generated: now.toISOString().slice(0, 10),
    generatedAt: now.toISOString(),
    sourceLatestIssue,
    strategyId: PREDICTION_STRATEGY,
    algorithmVersion: PREDICTION_ALGORITHM_VERSION,
    window: prediction.meta.win,
    excludeRatio: null,
    excludeTarget: prediction.meta.excludeTarget ?? null,
    snapshotSource: 'generated',
    nDraws: prediction.meta.nDraws,
    keptMain,
    keptExtra,
    excludedMain,
    excludedExtra,
    actualDate: null,
    actualMain: null,
    actualExtra: null,
    hitMain: null,
    hitExtra: null,
    falseExcludedMain: null,
    falseExcludedExtra: null,
    mainZeroFalseExclusion: null,
    extraZeroFalseExclusion: null,
    zeroFalseExclusion: null,
    status: 'pending',
  };
}

export function migratePredictionRecord(rec, game) {
  // 旧记录未声明策略时按补集策略处理；补集策略的排除集合始终由保留集合重算
  const strategyId = rec.strategyId || COMPLEMENT_STRATEGY;
  const isComplement = strategyId === COMPLEMENT_STRATEGY;
  const migrated = {
    ...rec,
    generatedAt: rec.generatedAt ?? null,
    sourceLatestIssue: rec.sourceLatestIssue ?? null,
    strategyId,
    algorithmVersion: rec.algorithmVersion || 'legacy-unknown',
    window: rec.window || 'all',
    excludeRatio: rec.excludeRatio ?? null,
    excludeTarget: rec.excludeTarget ?? null,
    snapshotSource: rec.snapshotSource || 'legacy-kept-complement',
    actualDate: rec.actualDate ?? null,
    // 补集是派生数据，按保留集合重算；风险预算策略的排除集合是原始快照，须保留
    excludedMain: isComplement
      ? complementNumbers(game.mainRange, rec.keptMain)
      : (rec.excludedMain || []),
    excludedExtra: isComplement
      ? complementNumbers(game.extraRange, rec.keptExtra)
      : (rec.excludedExtra || []),
  };
  if (migrated.status === 'hit' || migrated.status === 'miss') migrated.status = 'evaluated';
  return migrated;
}

function sameNumbers(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every(n => b.includes(n));
}

export function reconcilePredictionRecord(rec, draw, nextIssue, now) {
  const resultDraw = draw || (Array.isArray(rec.actualMain) && Array.isArray(rec.actualExtra)
    ? { d: rec.actualDate ?? null, m: rec.actualMain, x: rec.actualExtra }
    : null);
  if (resultDraw) {
    const actualDate = resultDraw.d ?? rec.actualDate ?? null;
    const numbersSame = sameNumbers(rec.actualMain, resultDraw.m)
      && sameNumbers(rec.actualExtra, resultDraw.x);
    const hasEvaluation = Array.isArray(rec.falseExcludedMain) && Array.isArray(rec.falseExcludedExtra)
      && typeof rec.zeroFalseExclusion === 'boolean';
    const provablyPreDraw = rec.snapshotSource !== 'generated' || (
      typeof rec.generatedAt === 'string'
      && rec.generatedAt.includes('T')
      && Number.isFinite(Date.parse(rec.generatedAt))
      && typeof actualDate === 'string'
      && rec.generatedAt.slice(0, 10) < actualDate
    );

    if (!provablyPreDraw) {
      return {
        ...rec,
        actualDate,
        actualMain: [...resultDraw.m],
        actualExtra: [...resultDraw.x],
        hitMain: null,
        hitExtra: null,
        falseExcludedMain: null,
        falseExcludedExtra: null,
        mainZeroFalseExclusion: null,
        extraZeroFalseExclusion: null,
        zeroFalseExclusion: null,
        status: 'unevaluable',
        unevaluableReason: 'snapshot-not-provably-pre-draw',
        evaluated: null,
        evaluatedAt: null,
      };
    }

    if (rec.status === 'evaluated' && hasEvaluation && numbersSame) {
      // 结果未变：只补写缺失的开奖日期，保留原评估日期与评估时间
      return (rec.actualDate ?? null) === actualDate ? rec : { ...rec, actualDate };
    }

    const { unevaluableReason, ...withoutReason } = rec;
    return {
      ...withoutReason,
      actualDate,
      actualMain: [...resultDraw.m],
      actualExtra: [...resultDraw.x],
      hitMain: rec.keptMain.filter(n => resultDraw.m.includes(n)),
      hitExtra: rec.keptExtra.filter(n => resultDraw.x.includes(n)),
      ...evaluateExclusion(rec, resultDraw),
      status: 'evaluated',
      evaluated: numbersSame && rec.evaluated ? rec.evaluated : now.toISOString().slice(0, 10),
      evaluatedAt: numbersSame ? (rec.evaluatedAt ?? null) : now.toISOString(),
    };
  }

  if (rec.status === 'pending' && nextIssue && rec.issue.localeCompare(nextIssue) < 0) {
    return { ...rec, status: 'unevaluable', unevaluableReason: 'draw-not-found' };
  }
  if (rec.status === 'unevaluable' && rec.unevaluableReason === 'draw-not-found'
    && nextIssue && rec.issue.localeCompare(nextIssue) >= 0) {
    const { unevaluableReason, ...restored } = rec;
    return { ...restored, status: 'pending' };
  }
  return rec;
}
