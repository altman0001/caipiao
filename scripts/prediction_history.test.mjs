import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as pcAnalysis from '../webapp/src/lib/analysis.js';
import * as h5Analysis from '../h5/src/common/lib/analysis.js';
import * as pcPredict from '../webapp/src/lib/predict.js';
import * as h5Predict from '../h5/src/common/lib/predict.js';

const GAME = { mainRange: 4, mainCount: 2, extraRange: 3, extraCount: 1 };
const NOW = new Date('2026-10-26T01:02:03.000Z');

function makeGame({ mainRange, mainCount, extraRange, extraCount }, n = 80) {
  const draws = [];
  for (let t = 0; t < n; t++) {
    const m = [];
    for (let i = 0; i < mainCount; i++) m.push(((t + i * 3) % mainRange) + 1);
    const x = [];
    for (let i = 0; i < extraCount; i++) x.push(((t + i * 2) % extraRange) + 1);
    draws.push({ i: String(t + 1).padStart(5, '0'), d: '2026-01-01', m, x });
  }
  return { name: 'test', mainRange, mainCount, extraRange, extraCount, draws };
}

function zeroFalseProbability(range, count, excluded) {
  let p = 1;
  for (let i = 0; i < count; i++) p *= (range - excluded - i) / (range - i);
  return p;
}

for (const [name, analysis] of [['PC', pcAnalysis], ['H5', h5Analysis]]) {
  test(`${name} 计算保留集合的补集`, () => {
    assert.deepEqual(analysis.complementNumbers(5, [1, 3, 5]), [2, 4]);
  });

  test(`${name} 误排是排除集合与实际开奖集合的交集`, () => {
    const result = analysis.evaluateExclusion(
      { excludedMain: [1, 2], excludedExtra: [5] },
      { m: [2, 3], x: [6] },
    );
    assert.deepEqual(result, {
      falseExcludedMain: [2],
      falseExcludedExtra: [],
      mainZeroFalseExclusion: false,
      extraZeroFalseExclusion: true,
      zeroFalseExclusion: false,
    });
  });

  test(`${name} 汇总单号准确率、整期零误排率和随机基线`, () => {
    const records = [
      {
        status: 'evaluated', snapshotSource: 'legacy-kept-complement',
        excludedMain: [1, 2], excludedExtra: [5],
        falseExcludedMain: [2], falseExcludedExtra: [],
      },
      {
        status: 'evaluated', snapshotSource: 'generated',
        excludedMain: [1, 2], excludedExtra: [5],
        falseExcludedMain: [], falseExcludedExtra: [5],
      },
      { status: 'pending', snapshotSource: 'generated' },
      { status: 'unevaluable' },
    ];
    const stats = analysis.summarizePredictionRecords(records, GAME);
    assert.equal(stats.total, 4);
    assert.equal(stats.done, 2);
    assert.equal(stats.pending, 1);
    assert.equal(stats.unevaluable, 1);
    assert.equal(stats.legacy, 1);
    assert.equal(stats.main.excluded, 4);
    assert.equal(stats.main.false, 1);
    assert.equal(stats.main.correct, 3);
    assert.equal(stats.main.accuracy, 0.75);
    assert.equal(stats.main.zeroRate, 0.5);
    assert.equal(stats.main.avgFalse, 0.5);
    assert.equal(stats.main.avgExcluded, 2);
    assert.equal(stats.extra.avgFalse, 0.5);
    assert.equal(stats.extra.avgExcluded, 1);
    assert.equal(stats.extra.accuracy, 0.5);
    assert.equal(stats.overall.excluded, 6);
    assert.equal(stats.overall.false, 2);
    assert.equal(stats.overall.correct, 4);
    assert.equal(stats.overall.accuracy, 2 / 3);
    assert.equal(stats.overall.zero, 0);
    assert.equal(stats.overall.zeroRate, 0);
    assert.equal(stats.overall.avgFalse, 1);
    assert.equal(stats.overall.avgExcluded, 3);
    assert.deepEqual(stats.dist, [[1, 2]]);
    assert.equal(stats.main.baselineAccuracy, 0.5);
    assert.equal(stats.extra.baselineAccuracy, 2 / 3);
    assert.ok(Math.abs(stats.overall.baselineAccuracy - 5 / 9) < 1e-12);
    assert.ok(Math.abs(stats.main.baselineZeroRate - 1 / 6) < 1e-12);
    assert.ok(Math.abs(stats.extra.baselineZeroRate - 2 / 3) < 1e-12);
    assert.ok(Math.abs(stats.overall.baselineZeroRate - 1 / 9) < 1e-12);
  });
}

for (const [name, predict] of [['PC', pcPredict.predict], ['H5', h5Predict.predict]]) {
  test(`${name} 风险预算：SSQ 主号排 3 个、蓝球排 1 个，整期零误排概率不低于 50%`, () => {
    const game = makeGame({ mainRange: 33, mainCount: 6, extraRange: 16, extraCount: 1 });
    const p = predict(game, 'all');
    assert.equal(p.meta.excludeTarget, 0.5);
    assert.equal(p.budget.main, 3);
    assert.equal(p.budget.extra, 1);
    assert.equal(p.excludedMain.length, 3);
    assert.equal(p.excludedExtra.length, 1);
    assert.ok(p.budget.zeroFalseProbability >= 0.5);
    assert.ok(zeroFalseProbability(33, 6, 4) * zeroFalseProbability(16, 1, 1) < 0.5);
    assert.ok(zeroFalseProbability(33, 6, 3) * zeroFalseProbability(16, 1, 2) < 0.5);
  });

  test(`${name} 风险预算：DLT 主号排 3 个、后区排 1 个`, () => {
    const game = makeGame({ mainRange: 35, mainCount: 5, extraRange: 12, extraCount: 2 });
    const p = predict(game, 'all');
    assert.equal(p.budget.main, 3);
    assert.equal(p.budget.extra, 1);
    assert.ok(p.budget.zeroFalseProbability >= 0.5);
    assert.ok(zeroFalseProbability(35, 5, 4) * zeroFalseProbability(12, 2, 1) < 0.5);
    assert.ok(zeroFalseProbability(35, 5, 3) * zeroFalseProbability(12, 2, 2) < 0.5);
  });

  test(`${name} 排除集合取排除置信最高的号码，保留集合为其余全部号码`, () => {
    const game = makeGame({ mainRange: 33, mainCount: 6, extraRange: 16, extraCount: 1 });
    const p = predict(game, 'all');
    const topMain = p.mainNot.slice(0, p.budget.main).map(x => x.n).sort((a, b) => a - b);
    assert.deepEqual(p.excludedMain, topMain);
    assert.equal(p.keptMain.length, 30);
    assert.deepEqual(p.keptMain, pcAnalysis.complementNumbers(33, p.excludedMain));
    assert.deepEqual(p.keptExtra, pcAnalysis.complementNumbers(16, p.excludedExtra));
  });
}

test('正式预测快照显式保存排除集合与生成依据', async () => {
  const { createPredictionRecord } = await import('./prediction_history.mjs');
  const rec = createPredictionRecord({
    issue: '00003', sourceLatestIssue: '00002', game: { ...GAME, mainRange: 5, mainCount: 2 },
    prediction: {
      excludedMain: [2, 4, 5], excludedExtra: [1, 3],
      meta: { nDraws: 20, win: 'all', excludeTarget: 0.5 },
    },
    now: NOW,
  });
  assert.equal(rec.issue, '00003');
  assert.equal(rec.generated, '2026-10-26');
  assert.equal(rec.generatedAt, '2026-10-26T01:02:03.000Z');
  assert.equal(rec.sourceLatestIssue, '00002');
  assert.equal(rec.strategyId, 'risk-budget-exclude');
  assert.equal(rec.algorithmVersion, 'predict-v2');
  assert.equal(rec.window, 'all');
  assert.equal(rec.excludeRatio, null);
  assert.equal(rec.excludeTarget, 0.5);
  assert.equal(rec.snapshotSource, 'generated');
  assert.equal(rec.nDraws, 20);
  assert.deepEqual(rec.keptMain, [1, 3]);
  assert.deepEqual(rec.keptExtra, [2]);
  assert.deepEqual(rec.excludedMain, [2, 4, 5]);
  assert.deepEqual(rec.excludedExtra, [1, 3]);
  assert.equal(rec.status, 'pending');
  assert.equal(rec.actualDate, null);
  assert.equal(rec.actualMain, null);
});

test('旧记录只重建可证明的补集信息，不虚构生成时间或算法版本', async () => {
  const { migratePredictionRecord } = await import('./prediction_history.mjs');
  const old = {
    issue: '00002', generated: '2026-10-25', nDraws: 19,
    keptMain: [1, 3], keptExtra: [2], actualMain: [2, 3], actualExtra: [2],
    hitMain: [3], hitExtra: [2], status: 'hit', evaluated: '2026-10-26',
  };
  const rec = migratePredictionRecord(old, GAME);
  assert.deepEqual(rec.excludedMain, [2, 4]);
  assert.deepEqual(rec.excludedExtra, [1, 3]);
  assert.equal(rec.strategyId, 'likely-complement');
  assert.equal(rec.algorithmVersion, 'legacy-unknown');
  assert.equal(rec.generatedAt, null);
  assert.equal(rec.sourceLatestIssue, null);
  assert.equal(rec.excludeRatio, null);
  assert.equal(rec.snapshotSource, 'legacy-kept-complement');
  assert.equal(rec.status, 'evaluated');
  assert.equal(rec.generated, '2026-10-25');
});

test('迁移时按保留集合重算补集，不沿用与保留集合不一致的排除集合', async () => {
  const { migratePredictionRecord } = await import('./prediction_history.mjs');
  const rec = migratePredictionRecord({
    issue: '00002', generated: '2026-10-25', nDraws: 19,
    keptMain: [1, 3], keptExtra: [2], actualMain: [2, 3], actualExtra: [2],
    hitMain: [3], hitExtra: [2], status: 'hit', evaluated: '2026-10-26',
    excludedMain: [3], excludedExtra: [2],
  }, GAME);
  assert.deepEqual(rec.excludedMain, [2, 4]);
  assert.deepEqual(rec.excludedExtra, [1, 3]);
});

test('已存在的目标期不再新建快照，即使策略不同', async () => {
  const { needsNewSnapshot } = await import('./prediction_history.mjs');
  const records = [{ issue: '26124', strategyId: 'likely-complement' }];
  assert.equal(needsNewSnapshot(records, '26124'), false);
  assert.equal(needsNewSnapshot(records, '26125'), true);
  assert.equal(needsNewSnapshot(records, null), false);
});

test('风险预算策略的排除集合在迁移时保留，不扩成补集', async () => {
  const { migratePredictionRecord } = await import('./prediction_history.mjs');
  const rec = migratePredictionRecord({
    issue: '00002', generated: '2026-10-25', nDraws: 19,
    strategyId: 'risk-budget-exclude', algorithmVersion: 'predict-v2', excludeTarget: 0.5,
    keptMain: [1, 3], keptExtra: [2], excludedMain: [2], excludedExtra: [3],
    status: 'pending',
  }, GAME);
  assert.deepEqual(rec.excludedMain, [2]);
  assert.deepEqual(rec.excludedExtra, [3]);
  assert.deepEqual(rec.keptMain, [1, 3]);
  assert.deepEqual(rec.keptExtra, [2]);
  assert.equal(rec.strategyId, 'risk-budget-exclude');
  assert.equal(rec.algorithmVersion, 'predict-v2');
  assert.equal(rec.snapshotSource, 'legacy-kept-complement');
  assert.equal(rec.status, 'pending');
});

test('开奖评估只追加结果，不改变预测快照', async () => {
  const { createPredictionRecord, reconcilePredictionRecord } = await import('./prediction_history.mjs');
  const rec = createPredictionRecord({
    issue: '00003', sourceLatestIssue: '00002', game: GAME,
    prediction: {
      excludedMain: [2, 4], excludedExtra: [1, 3],
      meta: { nDraws: 20, win: 'all', excludeTarget: 0.5 },
    },
    now: NOW,
  });
  const before = structuredClone(rec);
  const evaluated = reconcilePredictionRecord(rec, { d: '2026-10-27', m: [2, 3], x: [1] }, '00003', NOW);
  assert.deepEqual(rec, before);
  assert.deepEqual(evaluated.keptMain, before.keptMain);
  assert.deepEqual(evaluated.excludedMain, before.excludedMain);
  assert.equal(evaluated.generatedAt, before.generatedAt);
  assert.equal(evaluated.status, 'evaluated');
  assert.deepEqual(evaluated.actualMain, [2, 3]);
  assert.deepEqual(evaluated.actualExtra, [1]);
  assert.deepEqual(evaluated.hitMain, [3]);
  assert.deepEqual(evaluated.hitExtra, []);
  assert.deepEqual(evaluated.falseExcludedMain, [2]);
  assert.deepEqual(evaluated.falseExcludedExtra, [1]);
  assert.equal(evaluated.zeroFalseExclusion, false);
  assert.equal(evaluated.evaluatedAt, NOW.toISOString());
  assert.equal(evaluated.actualDate, '2026-10-27');
});

test('同日生成且无法证明开奖前生成的正式快照不得纳入评估', async () => {
  const { createPredictionRecord, reconcilePredictionRecord } = await import('./prediction_history.mjs');
  const rec = createPredictionRecord({
    issue: '00003', sourceLatestIssue: '00002', game: GAME,
    prediction: {
      excludedMain: [2, 4], excludedExtra: [1, 3],
      meta: { nDraws: 20, win: 'all', excludeTarget: 0.5 },
    },
    now: NOW,
  });
  const result = reconcilePredictionRecord(rec, { d: '2026-10-26', m: [2, 3], x: [1] }, '00003', NOW);
  assert.equal(result.status, 'unevaluable');
  assert.equal(result.unevaluableReason, 'snapshot-not-provably-pre-draw');
  assert.equal(result.actualDate, '2026-10-26');
  assert.deepEqual(result.actualMain, [2, 3]);
  assert.equal(result.falseExcludedMain, null);
  assert.equal(result.zeroFalseExclusion, null);
});

test('相同开奖结果的重复评估保持幂等', async () => {
  const { reconcilePredictionRecord } = await import('./prediction_history.mjs');
  const rec = {
    issue: '00003', status: 'evaluated', keptMain: [1, 3], keptExtra: [2],
    excludedMain: [2, 4], excludedExtra: [1, 3], actualMain: [2, 3], actualExtra: [2],
    hitMain: [3], hitExtra: [2], falseExcludedMain: [2], falseExcludedExtra: [],
    mainZeroFalseExclusion: false, extraZeroFalseExclusion: true, zeroFalseExclusion: false,
    evaluated: '2026-10-26', evaluatedAt: NOW.toISOString(),
  };
  const later = new Date('2026-10-27T01:02:03.000Z');
  assert.deepEqual(reconcilePredictionRecord(rec, { m: [2, 3], x: [2] }, '00004', later), rec);
});

test('补齐开奖日期时只回填 actualDate，不改变原有评估日期', async () => {
  const { reconcilePredictionRecord } = await import('./prediction_history.mjs');
  const rec = {
    issue: '00003', status: 'evaluated', keptMain: [1, 3], keptExtra: [2],
    excludedMain: [2, 4], excludedExtra: [1, 3], actualMain: [2, 3], actualExtra: [2],
    hitMain: [3], hitExtra: [2], falseExcludedMain: [2], falseExcludedExtra: [],
    mainZeroFalseExclusion: false, extraZeroFalseExclusion: true, zeroFalseExclusion: false,
    evaluated: '2026-09-16', evaluatedAt: null, actualDate: null,
  };
  const filled = reconcilePredictionRecord(rec, { d: '2026-09-16', m: [2, 3], x: [2] }, '00004', NOW);
  assert.equal(filled.actualDate, '2026-09-16');
  assert.equal(filled.evaluated, '2026-09-16');
  assert.equal(filled.evaluatedAt, null);
  assert.equal(filled.status, 'evaluated');
});

test('开奖结果更正后重新计算命中和误排', async () => {
  const { reconcilePredictionRecord } = await import('./prediction_history.mjs');
  const rec = {
    issue: '00003', status: 'evaluated', keptMain: [1, 3], keptExtra: [2],
    excludedMain: [2, 4], excludedExtra: [1, 3], actualMain: [2, 3], actualExtra: [2],
    hitMain: [3], hitExtra: [2], falseExcludedMain: [2], falseExcludedExtra: [],
    evaluated: '2026-10-26', evaluatedAt: NOW.toISOString(),
  };
  const later = new Date('2026-10-27T01:02:03.000Z');
  const corrected = reconcilePredictionRecord(rec, { m: [1, 4], x: [3] }, '00004', later);
  assert.deepEqual(corrected.actualMain, [1, 4]);
  assert.deepEqual(corrected.hitMain, [1]);
  assert.deepEqual(corrected.falseExcludedMain, [4]);
  assert.deepEqual(corrected.falseExcludedExtra, [3]);
  assert.equal(corrected.zeroFalseExclusion, false);
  assert.equal(corrected.evaluatedAt, later.toISOString());
});

test('陈旧待开奖记录保留并标记，恢复为目标期后可回到待开奖', async () => {
  const { reconcilePredictionRecord } = await import('./prediction_history.mjs');
  const pending = { issue: '00002', status: 'pending' };
  const stale = reconcilePredictionRecord(pending, null, '00003', NOW);
  assert.equal(stale.status, 'unevaluable');
  assert.equal(stale.unevaluableReason, 'draw-not-found');
  const restored = reconcilePredictionRecord(stale, null, '00002', NOW);
  assert.equal(restored.status, 'pending');
  assert.equal('unevaluableReason' in restored, false);
});

test('开奖数据落后时未来期预测保持或恢复为待开奖', async () => {
  const { reconcilePredictionRecord } = await import('./prediction_history.mjs');
  const future = { issue: '00004', status: 'pending' };
  assert.equal(reconcilePredictionRecord(future, null, '00003', NOW).status, 'pending');
  const marked = { ...future, status: 'unevaluable', unevaluableReason: 'draw-not-found' };
  const restored = reconcilePredictionRecord(marked, null, '00003', NOW);
  assert.equal(restored.status, 'pending');
  assert.equal('unevaluableReason' in restored, false);
});

test('开奖数据落后时使用记录内已保存结果补齐误排评估', async () => {
  const { reconcilePredictionRecord } = await import('./prediction_history.mjs');
  const rec = {
    issue: '00003', status: 'evaluated', keptMain: [1, 3], keptExtra: [2],
    excludedMain: [2, 4], excludedExtra: [1, 3], actualMain: [2, 3], actualExtra: [2],
    hitMain: [3], hitExtra: [2], evaluated: '2026-10-26', evaluatedAt: null,
  };
  const evaluated = reconcilePredictionRecord(rec, null, '00004', NOW);
  assert.deepEqual(evaluated.falseExcludedMain, [2]);
  assert.deepEqual(evaluated.falseExcludedExtra, []);
  assert.equal(evaluated.zeroFalseExclusion, false);
  assert.equal(evaluated.evaluated, '2026-10-26');
  assert.equal(evaluated.evaluatedAt, null);
});

test('历史文件损坏时抛错且不以空历史覆盖', async () => {
  const { loadHistory } = await import('./prediction_history.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caipiao-history-'));
  const file = path.join(dir, 'ssq.json');
  fs.writeFileSync(file, '{broken', 'utf8');
  assert.throws(() => loadHistory(file));
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
  const invalid = JSON.stringify({ records: [{}] });
  fs.writeFileSync(file, invalid, 'utf8');
  assert.throws(() => loadHistory(file));
  assert.equal(fs.readFileSync(file, 'utf8'), invalid);
  assert.deepEqual(loadHistory(path.join(dir, 'missing.json')), { schemaVersion: 2, records: [] });
});

test('历史保存保留模式版本且不留临时文件', async () => {
  const { loadHistory, saveHistory } = await import('./prediction_history.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caipiao-history-'));
  const file = path.join(dir, 'ssq.json');
  const hist = { schemaVersion: 2, records: [{
    issue: '00003', generated: '2026-10-26', generatedAt: NOW.toISOString(), nDraws: 20,
    status: 'pending', keptMain: [1, 3], keptExtra: [2], excludedMain: [2, 4], excludedExtra: [1, 3],
    actualMain: null, actualExtra: null, hitMain: null, hitExtra: null,
    falseExcludedMain: null, falseExcludedExtra: null,
    mainZeroFalseExclusion: null, extraZeroFalseExclusion: null, zeroFalseExclusion: null,
  }] };
  saveHistory(file, hist);
  assert.deepEqual(loadHistory(file), hist);
  assert.deepEqual(fs.readdirSync(dir), ['ssq.json']);
  const before = fs.readFileSync(file, 'utf8');
  assert.throws(() => saveHistory(file, { schemaVersion: 2, records: [{}] }));
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});
