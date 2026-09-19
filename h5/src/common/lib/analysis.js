// 统计引擎：为双色球/大乐透计算各分析维度
// game.draws: [{i,d,m:[main],x:[extra],p:[...]}]

export function winDraws(game, win) {
  const d = game.draws;
  return win && win < d.length ? d.slice(-win) : d.slice();
}
export const mean = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const PRIMES = new Set([2,3,5,7,11,13,17,19,23,29,31]);
export const isPrime = (n) => PRIMES.has(n);

function bump(map, k) { map[k] = (map[k] || 0) + 1 }
function toObj(arr) { return arr.map((v, i) => ({ n: i, v })).slice(1) }

// 主号码历史条件概率：P(出现 | 当期遗漏g期)
export function mainGapProb(game, draws) {
  const R = game.mainRange, cnt = game.mainCount;
  const out = {}; // n -> {map: Map(g->{t,h}), curOm}
  for (let n = 1; n <= R; n++) {
    const appear = new Set();
    draws.forEach((d, i) => { if (d.m.includes(n)) appear.add(i); });
    const stat = new Map(); let last = -1;
    for (let t = 0; t < draws.length; t++) {
      const g = t - last - 1;
      if (g >= 0) {
        const e = stat.get(g) || { t: 0, h: 0 };
        e.t++; if (appear.has(t + 1)) e.h++;
        stat.set(g, e);
      }
      if (appear.has(t)) last = t;
    }
    if (!stat.has(n)) stat.set(n, { t: 0, h: 0 });
    out[n] = { stat, curOm: draws.length - 1 - last };
  }
  return out;
}
export function extraGapProb(game, draws) {
  const R = game.extraRange, cnt = game.extraCount, K = "x";
  const out = {};
  for (let n = 1; n <= R; n++) {
    const appear = new Set();
    draws.forEach((d, i) => { if (d.x.includes(n)) appear.add(i); });
    const stat = new Map(); let last = -1;
    for (let t = 0; t < draws.length; t++) {
      const g = t - last - 1;
      if (g >= 0) { const e = stat.get(g) || { t: 0, h: 0 }; e.t++; if (appear.has(t + 1)) e.h++; stat.set(g, e); }
      if (appear.has(t)) last = t;
    }
    out[n] = { stat, curOm: draws.length - 1 - last };
  }
  return out;
}
export function empDrawP(entry) {
  // 给定当前遗漏下，下一期开出的经验概率（平滑）
  const g = entry.curOm;
  for (let k = 0; k <= 5; k++) {
    const e = entry.stat.get(g - k);
    if (e && e.t >= 20) return e.h / e.t;
  }
  // 回退到总平均
  let t = 0, h = 0;
  for (const e of entry.stat.values()) { t += e.t; h += e.h; }
  return t ? h / t : 0;
}

export function computeAnalysis(game, win) {
  const draws = winDraws(game, win);
  const R = game.mainRange, C = game.mainCount;
  const nDraws = draws.length;
  // 频率
  const freq = new Array(R + 1).fill(0);
  const om = new Array(R + 1).fill(0);
  const last = new Array(R + 1).fill(-1);
  for (let t = 0; t < draws.length; t++) for (const n of draws[t].m) { freq[n]++; last[n] = t; }
  for (let n = 1; n <= R; n++) om[n] = last[n] === -1 ? draws.length : draws.length - 1 - last[n];
  const gap = mainGapProb(game, draws);

  // 形态分布
  const bigBound = Math.floor((R + 1) / 2);
  const oddEven = {}, bigSmall = {}, primeComp = {}, zones = { z1: 0, z2: 0, z3: 0 };
  const sumHist = {}, spanHist = {}, tailBar = {}, repeatHist = {};
  const boundary = Math.ceil(R / 3);
  let consecDraws = 0, consecPairs = 0, repeatDraws = 0, totalRepeats = 0;
  for (let t = 0; t < draws.length; t++) {
    const row = [...draws[t].m].sort((a, b) => a - b);
    const odd = row.filter(x => x % 2).length;
    bump(oddEven, `${odd}:${C - odd}`);
    bump(bigSmall, `${row.filter(x => x > bigBound).length}:${row.filter(x => x <= bigBound).length}`);
    bump(primeComp, `${row.filter(x => isPrime(x)).length}`);
    let zc = { z1: 0, z2: 0, z3: 0 };
    for (const n of row) { if (n <= boundary) zc.z1++; else if (n <= boundary * 2) zc.z2++; else zc.z3++; }
    zones.z1 += zc.z1; zones.z2 += zc.z2; zones.z3 += zc.z3;
    bump(sumHist, row.reduce((a, b) => a + b, 0));
    bump(spanHist, row[row.length - 1] - row[0]);
    { const seen = new Set(); for (const n of row) { const tb = n % 10; if (!seen.has(tb)) { seen.add(tb); bump(tailBar, tb); } } }
    let hasConsec = false;
    for (let i = 1; i < row.length; i++) if (row[i] === row[i - 1] + 1) { hasConsec = true; consecPairs++; }
    if (hasConsec) consecDraws++;
    if (t > 0) {
      const prev = new Set(draws[t - 1].m);
      let rc = 0; for (const n of row) if (prev.has(n)) rc++;
      if (rc > 0) repeatDraws++;
      totalRepeats += rc; bump(repeatHist, rc);
    }
  }
  // 遗漏历史聚合
  const omHist = {};
  for (let n = 1; n <= R; n++) {
    const gaps = []; let last2 = -1;
    for (let t = 0; t < draws.length; t++) if (draws[t].m.includes(n)) { if (last2 >= 0) gaps.push(t - last2 - 1); last2 = t; }
    const hist = gaps.length ? gaps : [om[n]];
    const freq2 = freq[n];
    omHist[n] = { cur: om[n], avg: mean(hist), max: Math.max(...hist), n: freq2 > 0 ? (nDraws / freq2) : 0 };
  }
  // 尾数
  const tailDist = new Array(10).fill(0); for (let n = 1; n <= R; n++) tailDist[n % 10] += freq[n];

  // 后区/蓝球
  const XR = game.extraRange;
  const xfreq = new Array(XR + 1).fill(0); const xlast = new Array(XR + 1).fill(-1);
  for (let t = 0; t < draws.length; t++) for (const n of draws[t].x) { xfreq[n]++; xlast[n] = t; }
  const xomArr = new Array(XR + 1).fill(0);
  for (let n = 1; n <= XR; n++) xomArr[n] = xlast[n] === -1 ? draws.length : draws.length - 1 - xlast[n];
  const xgap = extraGapProb(game, draws);

  return {
    draws, R, C, bigBound, nDraws,
    freq: toObj(freq), freqArr: freq, om, omHist, gap,
    oddEven, bigSmall, primeComp, zones: { boundary, z1: zones.z1, z2: zones.z2, z3: zones.z3 },
    sumHist: entries(sumHist), spanHist: entries(spanHist), tailDist, tailBar: entries(tailBar),
    consecDraws, consecPairs, repeatDraws, totalRepeats, repeatHist: entries(repeatHist),
    extra: { R: XR, freq: xfreq, om: xomArr, gap: xgap },
    hot: toObj(freq).sort((a, b) => b.v - a.v).slice(0, 10),
    cold: toObj(freq).sort((a, b) => a.v - b.v).slice(0, 10),
  };
}
function entries(o) { return Object.entries(o).map(([k, v]) => ({ k, v })).sort((a, b) => Number(a.k) - Number(b.k)) }