// 预测引擎：基于常见选号策略，估计每个号码"不会被开出"的概率并打分
import { winDraws, mainGapProb, extraGapProb, isPrime } from './analysis.js';

// 每期形态共用
function buildPools(game, draws) {
  return { main: mainGapProb(game, draws), extra: extraGapProb(game, draws) };
}

// 各策略对每个号码给出 p_draw（本期开出的概率估计）与可读理由
function rateNumber(n, opts) {
  const { entry, freq, nDraws, count, range, recent, bigBound, categoryStats } = opts;
  const f = {};
  const reasons = [];

  // A. 遗漏回补（经验条件概率）权重0.4
  let pdA;
  {
    const g = entry.curOm;
    const e = entry.stat.get(g) || (entry.stat.get(g - 1) || { t: 0, h: 0 });
    const e2 = entry.stat.get(Math.max(0, g - 1)) || { t: 0, h: 0 };
    const use = (e && e.t >= 15) ? e : e2;
    pdA = use.t ? use.h / use.t : 0.15;
    const up = Math.round(pdA * 100);
    reasons.push({
      k: 'gap', w: .4, val: 1 - pdA,
      label: g === 0 ? `上期已出(${up}%顺延)` : `遗漏${g}期(回补${up}%)`,
    });
  }

  // B. 近期热度（近8期）权重0.25
  let pdB;
  {
    const re = recent.draws || [];
    let c = 0; for (const d of re) if (d.m.includes(n)) c++;
    pdB = clamp(.08 + c * .15, .08, .6);
    reasons.push({
      k: 'heat', w: .25, val: 1 - pdB,
      label: c > 1 ? `近8期出${c}次(顺热)` : c === 1 ? `近8期出1次` : `近8期未出(走冷)`,
    });
  }

  // C. 整体频率与大数期望 权重0.2
  let pdC;
  {
    const expected = count * nDraws / range;
    const ratio = freq[n] / expected;
    pdC = clamp(0.10 + (ratio - 0.85) * 0.10, .04, .35);
    reasons.push({
      k: 'freq', w: .2, val: 1 - pdC,
      label: ratio >= .85 ? `历史出号达标(${freq[n]}次)` : `历史偏少(${freq[n]}次,期望${expected.toFixed(1)})`,
    });
  }

  // D. 形态均衡（奇偶/大小/区间）权重0.15
  let pdD = .15;
  {
    const odd = n % 2 === 1;
    const big = n > bigBound;
    const zone = n <= categoryStats.boundary ? 0 : n <= categoryStats.boundary * 2 ? 1 : 2;
    // 若该形态近期偏少 → 略增
    const oOdd = categoryStats.oddShare, oBig = categoryStats.bigShare;
    let tilt = 0;
    if (odd) tilt += (0.5 - oOdd) * 1.2; else tilt += (oOdd - 0.5) * 1.2;
    if (big) tilt += (0.5 - oBig) * 1.2; else tilt += (oBig - 0.5) * 1.2;
    pdD = clamp(.15 + tilt, .05, .35);
    reasons.push({
      k: 'shape', w: .15, val: 1 - pdD,
      label: `形态均衡${tilt > .02 ? '(形态偏冷' + (tilt > 0 ? '利' : '') + ')' : '(均衡调校)'}`,
    });
  }

  const pDraw = pdA * .4 + pdB * .25 + pdC * .2 + pdD * .15;
  const notProb = 1 - pDraw;
  return {
    n, pDraw, notProb,
    score: Math.round(((notProb) * 100).toFixed(2)),
    reasons: reasons.sort((a, b) => b.w - a.w),
    om: entry.curOm,
  };
}

function clamp(x, a, b) { return x < a ? a : x > b ? b : x }

export function predict(game, win, opts = {}) {
  const draws = winDraws(game, win);
  const nDraws = draws.length;
  const R = game.mainRange, C = game.mainCount;
  const XR = game.extraRange, XC = game.extraCount;

  // 全历史频率（用于整体期望）——用传入窗口其实更相关；这里用全窗口
  const freq = new Array(R + 1).fill(0);
  for (const d of draws) for (const n of d.m) freq[n]++;
  const xfreq = new Array(XR + 1).fill(0);
  for (const d of draws) for (const n of d.x) xfreq[n]++;

  const recent = draws.slice(-8);
  const pools = buildPools(game, draws);
  const bigBound = Math.floor((R + 1) / 2);
  const boundary = Math.ceil(R / 3);

  // 类别近期占比
  let oddC = 0, bigC = 0, tot = 0;
  for (const d of recent) for (const n of d.m) { oddC += n % 2; bigC += (n > bigBound ? 1 : 0); tot++; }
  const oddShare = tot ? oddC / tot : .5, bigShare = tot ? bigC / tot : .5;
  const categoryStats = { boundary, oddShare, bigShare };

  const candidates = [];
  for (let n = 1; n <= R; n++) candidates.push(rateNumber(n, {
    entry: pools.main[n], freq, nDraws, count: C, range: R, recent, bigBound, categoryStats,
  }));
  const extras = [];
  for (let n = 1; n <= XR; n++) extras.push(rateNumber(n, {
    entry: pools.extra[n], freq: xfreq, nDraws, count: XC, range: XR, recent, bigBound: Math.floor(XR / 2), categoryStats,
  }));

  // 按"不被开出概率"降序（越靠后越可能出现）；pDraw降序即最可能开出
  const mainNot = norm([...candidates].sort((a, b) => b.notProb - a.notProb));
  const extraNot = norm([...extras].sort((a, b) => b.notProb - a.notProb));
  const mainLikely = [...candidates].sort((a, b) => b.pDraw - a.pDraw).slice(0, C);
  const extraLikely = [...extras].sort((a, b) => b.pDraw - a.pDraw).slice(0, XC);

  return {
    mainNot, extraNot, mainLikely, extraLikely,
    meta: { game: game.name, win, nDraws },
  };
}

// 将 notProb 归一化为 0-100 的"排除置信分"，便于横向比较与划线
function norm(arr) {
  const vals = arr.map(x => x.notProb);
  const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
  arr.forEach((x, i) => { x.score = Math.round(((x.notProb - lo) / span) * 100); });
  return arr;
}