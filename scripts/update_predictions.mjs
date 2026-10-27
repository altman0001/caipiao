// CI 步骤：基于最新开奖数据重跑预测并落盘历史，同时对历史记录做命中与误排判定
// 用法：node scripts/update_predictions.mjs（需先由 export.py 生成 webapp/src/data.js）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA } from '../webapp/src/data.js';
import { predict } from '../webapp/src/lib/predict.js';
import {
  PREDICTION_STRATEGY,
  loadHistory,
  saveHistory,
  writeTextAtomic,
  createPredictionRecord,
  migratePredictionRecord,
  reconcilePredictionRecord,
} from './prediction_history.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const PRED_DIR = path.join(ROOT, 'predictions');
const OUT_JS_LIST = [
  path.join(ROOT, 'webapp', 'src', 'predHistory.js'),
  path.join(ROOT, 'h5', 'src', 'common', 'predHistory.js'),
];

const pad5 = (n) => String(n).padStart(5, '0');

function processGame(key) {
  const game = { ...DATA[key], tag: key };
  const draws = game.draws;
  const historyFile = path.join(PRED_DIR, key + '.json');
  const loaded = loadHistory(historyFile);
  const hist = {
    ...loaded,
    schemaVersion: 2,
    records: loaded.records.map(rec => migratePredictionRecord(rec, game)),
  };
  const latest = draws[draws.length - 1];
  const latestIssue = latest ? latest.i : null;
  const nextIssue = latestIssue ? pad5(parseInt(latestIssue, 10) + 1) : null;
  const drawOf = new Map(draws.map((d) => [d.i, d]));
  const now = new Date();

  // 已开奖的记录可幂等重算；未找到目标期开奖的旧预测保留并标记。
  hist.records = hist.records.map(rec => reconcilePredictionRecord(rec, drawOf.get(rec.issue), nextIssue, now));

  // 同一目标期、同一正式策略只保存一份开奖前快照。
  if (nextIssue && !hist.records.some(r => r.issue === nextIssue && r.strategyId === PREDICTION_STRATEGY)) {
    const prediction = predict(game, 'all');
    hist.records.push(createPredictionRecord({
      issue: nextIssue,
      sourceLatestIssue: latestIssue,
      game,
      prediction,
      now,
    }));
  }

  hist.records.sort((a, b) => a.issue.localeCompare(b.issue));
  saveHistory(historyFile, hist);

  const pending = hist.records.filter(r => r.status === 'pending').length;
  const unevaluable = hist.records.filter(r => r.status === 'unevaluable').length;
  const evaluated = hist.records.filter(r => r.status === 'evaluated');
  const zeroFalse = evaluated.filter(r => r.zeroFalseExclusion).length;
  console.log(`[${key}] latest=${latestIssue} next=${nextIssue} records=${hist.records.length} pending=${pending} unevaluable=${unevaluable} evaluated=${evaluated.length} zeroFalse=${zeroFalse}`);
  return hist.records;
}

fs.mkdirSync(PRED_DIR, { recursive: true });
const out = { ssq: processGame('ssq'), dlt: processGame('dlt') };
for (const f of OUT_JS_LIST) {
  writeTextAtomic(f, 'export const PRED_HISTORY = ' + JSON.stringify(out) + ';\n');
  console.log('wrote', f);
}
