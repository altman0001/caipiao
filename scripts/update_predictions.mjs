// CI 步骤：基于最新开奖数据重跑预测并落盘历史，同时对历史记录做命中判定
// 用法：node scripts/update_predictions.mjs（需先由 export.py 生成 webapp/src/data.js）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA } from '../webapp/src/data.js';
import { predict } from '../webapp/src/lib/predict.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const PRED_DIR = path.join(ROOT, 'predictions');
const OUT_JS = path.join(ROOT, 'webapp', 'src', 'predHistory.js');

const pad5 = (n) => String(n).padStart(5, '0');

function loadHistory(key) {
  const f = path.join(PRED_DIR, key + '.json');
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch { return { records: [] }; }
}

function saveHistory(key, hist) {
  fs.writeFileSync(path.join(PRED_DIR, key + '.json'), JSON.stringify(hist, null, 2) + '\n');
}

function processGame(key) {
  const game = { ...DATA[key], tag: key };
  const draws = game.draws;
  const hist = loadHistory(key);
  const latest = draws[draws.length - 1];
  const latestIssue = latest ? latest.i : null;
  const nextIssue = latestIssue ? pad5(parseInt(latestIssue, 10) + 1) : null;
  const drawOf = new Map(draws.map((d) => [d.i, d]));
  const today = new Date().toISOString().slice(0, 10);

  // 1) 命中判定：目标期已开奖的待定记录
  for (const rec of hist.records) {
    if (rec.status !== 'pending') continue;
    const dr = drawOf.get(rec.issue);
    if (!dr) continue;
    rec.actualMain = [...dr.m];
    rec.actualExtra = [...dr.x];
    rec.hitMain = rec.keptMain.filter((n) => dr.m.includes(n));
    rec.hitExtra = rec.keptExtra.filter((n) => dr.x.includes(n));
    rec.status = rec.hitMain.length + rec.hitExtra.length > 0 ? 'hit' : 'miss';
    rec.evaluated = today;
  }

  // 2) 丢弃无法判定的陈旧待定记录（如跨年占位期号）
  hist.records = hist.records.filter((r) => r.status !== 'pending' || r.issue === nextIssue);

  // 3) 为下一期生成预测（幂等：同一目标期只保留一份）
  if (nextIssue && !hist.records.some((r) => r.issue === nextIssue)) {
    const p = predict(game, 'all');
    hist.records.push({
      issue: nextIssue,
      generated: today,
      nDraws: p.meta.nDraws,
      keptMain: p.mainLikely.map((x) => x.n),
      keptExtra: p.extraLikely.map((x) => x.n),
      actualMain: null,
      actualExtra: null,
      hitMain: null,
      hitExtra: null,
      status: 'pending',
    });
  }

  hist.records.sort((a, b) => a.issue.localeCompare(b.issue));
  saveHistory(key, hist);

  const pending = hist.records.filter((r) => r.status === 'pending').length;
  const hit = hist.records.filter((r) => r.status === 'hit').length;
  const miss = hist.records.filter((r) => r.status === 'miss').length;
  console.log(`[${key}] latest=${latestIssue} next=${nextIssue} records=${hist.records.length} pending=${pending} hit=${hit} miss=${miss}`);
  return hist.records;
}

fs.mkdirSync(PRED_DIR, { recursive: true });
const out = { ssq: processGame('ssq'), dlt: processGame('dlt') };
fs.writeFileSync(OUT_JS, 'export const PRED_HISTORY = ' + JSON.stringify(out) + ';\n');
console.log('wrote', OUT_JS);
