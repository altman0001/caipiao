import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as pcAnalysis from '../webapp/src/lib/analysis.js';
import * as h5Analysis from '../h5/src/common/lib/analysis.js';

const GAME = { mainRange: 4, mainCount: 2, extraRange: 3, extraCount: 1 };
const NOW = new Date('2026-10-26T01:02:03.000Z');

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
    assert.equal(stats.extra.accuracy, 0.5);
    assert.equal(stats.overall.excluded, 6);
    assert.equal(stats.overall.false, 2);
    assert.equal(stats.overall.correct, 4);
    assert.equal(stats.overall.accuracy, 2 / 3);
    assert.equal(stats.overall.zero, 0);
    assert.equal(stats.overall.zeroRate, 0);
    assert.equal(stats.overall.avgFalse, 1);
    assert.deepEqual(stats.dist, [[1, 2]]);
    assert.equal(stats.main.baselineAccuracy, 0.5);
    assert.equal(stats.extra.baselineAccuracy, 2 / 3);
    assert.ok(Math.abs(stats.overall.baselineAccuracy - 5 / 9) < 1e-12);
    assert.ok(Math.abs(stats.main.baselineZeroRate - 1 / 6) < 1e-12);
    assert.ok(Math.abs(stats.extra.baselineZeroRate - 2 / 3) < 1e-12);
    assert.ok(Math.abs(stats.overall.baselineZeroRate - 1 / 9) < 1e-12);
  });
}

test('正式预测快照显式保存排除集合与生成依据', async () => {
  const { createPredictionRecord } = await import('./prediction_history.mjs');
  const rec = createPredictionRecord({
    issue: '00003', sourceLatestIssue: '00002', game: { ...GAME, mainRange: 5, mainCount: 2 },
    prediction: {
      mainLikely: [{ n: 1 }, { n: 3 }], extraLikely: [{ n: 2 }], meta: { nDraws: 20, win: 'all' },
    },
    now: NOW,
  });
  assert.equal(rec.issue, '00003');
  assert.equal(rec.generated, '2026-10-26');
  assert.equal(rec.generatedAt, '2026-10-26T01:02:03.000Z');
  assert.equal(rec.sourceLatestIssue, '00002');
  assert.equal(rec.strategyId, 'likely-complement');
  assert.equal(rec.algorithmVersion, 'predict-v1');
  assert.equal(rec.window, 'all');
  assert.equal(rec.excludeRatio, null);
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

test('开奖评估只追加结果，不改变预测快照', async () => {
  const { createPredictionRecord, reconcilePredictionRecord } = await import('./prediction_history.mjs');
  const rec = createPredictionRecord({
    issue: '00003', sourceLatestIssue: '00002', game: GAME,
    prediction: {
      mainLikely: [{ n: 1 }, { n: 3 }], extraLikely: [{ n: 2 }], meta: { nDraws: 20, win: 'all' },
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
      mainLikely: [{ n: 1 }, { n: 3 }], extraLikely: [{ n: 2 }], meta: { nDraws: 20, win: 'all' },
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
