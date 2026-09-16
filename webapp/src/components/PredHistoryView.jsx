import { useMemo, useState } from 'react';
import { PRED_HISTORY } from '../predHistory.js';
import { pad } from '../lib/format.js';

const LIMITS = [[20,'最近 20 期'],[50,'最近 50 期'],[0,'全部']];
const FILTERS = [['all','全部'],['done','已开奖'],['hit','仅命中']];

export default function PredHistoryView({ game }) {
  const tag = game.tag;
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(20);
  const records = useMemo(() => (PRED_HISTORY[tag] || []).slice().reverse(), [tag]);
  const drawByIssue = useMemo(() => new Map(game.draws.map(d => [d.i, d.d])), [game]);

  const stats = useMemo(() => {
    const done = records.filter(r=>r.status!=='pending');
    const hit = done.filter(r=>r.status==='hit');
    const totMain = done.reduce((s,r)=>s+(r.hitMain?r.hitMain.length:0),0);
    const totExtra = done.reduce((s,r)=>s+(r.hitExtra?r.hitExtra.length:0),0);
    const dist = new Map();
    for (const r of done) {
      const t = (r.hitMain?r.hitMain.length:0) + (r.hitExtra?r.hitExtra.length:0);
      dist.set(t, (dist.get(t)||0)+1);
    }
    let best = { t:-1, issue:null };
    for (const r of done) {
      const t = (r.hitMain?r.hitMain.length:0) + (r.hitExtra?r.hitExtra.length:0);
      if (t>best.t) best = { t, issue:r.issue };
    }
    return {
      total: records.length,
      done: done.length, pending: records.length-done.length,
      hit: hit.length, hitRate: done.length? hit.length/done.length : 0,
      avgMain: done.length? totMain/done.length : 0,
      avgExtra: done.length? totExtra/done.length : 0,
      dist: [...dist.entries()].sort((a,b)=>a[0]-b[0]),
      best,
    };
  }, [records]);

  const view = records.filter(r=> filter==='all' ? true : filter==='done' ? r.status!=='pending' : r.status==='hit')
                      .slice(0, limit||undefined);

  const Ball = ({n,c}) => <span className={'ball xs '+c}>{pad(n)}</span>;
  const Mains = ({v}) => v && v.length ? v.map(n=> <Ball key={n} n={n} c={tag==='dlt'?'orange':'red'}/>) : <span className="dim">—</span>;
  const Extras = ({v}) => v && v.length ? v.map(n=> <Ball key={n} n={n} c="blue"/>) : <span className="dim">—</span>;
  const Verdict = ({r}) => r.status==='pending' ? <span className="badge wait">待开奖</span>
    : r.status==='hit' ? <span className="badge ok">命中 {(r.hitMain?r.hitMain.length:0)+(r.hitExtra?r.hitExtra.length:0)} 个</span>
    : <span className="badge no">未命中</span>;

  return (
    <>
      <div className="section">
        <div className="sec-head">
          <h2>预测结果 · 命中报表</h2>
          <span className="sub">{game.name}：自动刷新抓取最新开奖后重跑预测并保存保留号码，开奖后自动判定命中</span>
          <span className="badge">{stats.total} 期记录</span>
        </div>

        <div className="metrics" style={{gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'}}>
          <div className="metric"><div className="label">已开奖判定</div>
            <div className="value">{stats.done}<small> / {stats.total}</small></div>
            <div className="dim" style={{fontSize:12}}>待开奖 {stats.pending} 期</div></div>
          <div className="metric"><div className="label">保留号命中率</div>
            <div className="value">{Math.round(stats.hitRate*100)}<small>%</small></div>
            <div className="dim" style={{fontSize:12}}>命中 {stats.hit} / 已开奖 {stats.done}</div></div>
          <div className="metric"><div className="label">平均命中</div>
            <div className="value">{stats.done? (stats.avgMain+stats.avgExtra).toFixed(2):'—'}<small> 个/期</small></div>
            <div className="dim" style={{fontSize:12}}>主号 {stats.avgMain.toFixed(2)} · {tag==='dlt'?'后区':'蓝球'} {stats.avgExtra.toFixed(2)}</div></div>
          <div className="metric"><div className="label">单期最佳</div>
            <div className="value">{stats.best.t>0? stats.best.t:'—'}</div>
            <div className="dim" style={{fontSize:12}}>{stats.best.issue || '尚无命中记录'}</div></div>
        </div>

        {stats.done>0 && (
          <div className="chips" style={{marginTop:12}}>
            <span className="dim" style={{fontSize:12}}>命中分布：</span>
            {stats.dist.map(([t,c])=>(
              <span key={t} className="chip" style={{fontSize:11}}>命中 {t} 个 ×{c}</span>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="sec-head">
          <h2>逐期明细</h2>
          <div className="seg">
            {FILTERS.map(([v,l])=> <button key={v} className={filter===v?'on':''} onClick={()=>setFilter(v)}>{l}</button>)}
          </div>
          <div className="seg">
            {LIMITS.map(([v,l])=> <button key={l} className={limit===v?'on':''} onClick={()=>setLimit(v)}>{l}</button>)}
          </div>
        </div>

        {view.length===0 && <div className="empty">暂无记录</div>}
        {view.length>0 && (
          <div className="tablewrap">
            <table className="lt">
              <thead><tr>
                <th>期号</th><th>开奖日期</th>
                <th>保留主号</th><th>保留{tag==='dlt'?'后区':'蓝球'}</th>
                <th>实际主号</th><th>实际{tag==='dlt'?'后区':'蓝球'}</th>
                <th>命中主/后</th><th>判定</th>
              </tr></thead>
              <tbody>
                {view.map(r=>(
                  <tr key={r.issue}>
                    <td className="issue">{r.issue}</td>
                    <td className="date">{drawByIssue.get(r.issue) || <span className="dim">—</span>}</td>
                    <td><span className="sum-cell"><Mains v={r.keptMain}/></span></td>
                    <td><span className="sum-cell"><Extras v={r.keptExtra}/></span></td>
                    <td><span className="sum-cell"><Mains v={r.actualMain}/></span></td>
                    <td><span className="sum-cell"><Extras v={r.actualExtra}/></span></td>
                    <td>
                      {r.status==='pending' ? <span className="dim">—</span> : (
                        <span><b style={{color:'var(--teal-text)'}}>{r.hitMain.length}</b> / <b style={{color:'var(--blue-text)'}}>{r.hitExtra.length}</b></span>
                      )}
                    </td>
                    <td><Verdict r={r}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="big-hint" style={{marginTop:12}}>保留号码 = 「预测」页绿色描边的候选开出集合；主号与{tag==='dlt'?'后区':'蓝球'}分别计数，任一命中即判定"命中"。</div>
      </div>

      <div className="disclaimer" style={{marginTop:4}}>
        <b>重要提示：</b>历史预测命中率仅用于检验统计方法，不构成对未来开奖的预测能力证明。开奖为随机独立事件，请理性看待。
      </div>
    </>
  );
}
