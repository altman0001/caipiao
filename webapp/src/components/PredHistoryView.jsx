import { useMemo, useState } from 'react';
import { PRED_HISTORY } from '../predHistory.js';
import { pad } from '../lib/format.js';
import { summarizePredictionRecords } from '../lib/analysis.js';

const LIMITS = [[20,'最近 20 期'],[50,'最近 50 期'],[0,'全部']];
const FILTERS = [['all','全部'],['done','已开奖'],['zero','仅零误排']];

export default function PredHistoryView({ game }) {
  const tag = game.tag;
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(20);
  const records = useMemo(() => (PRED_HISTORY[tag] || []).slice().reverse(), [tag]);
  const drawByIssue = useMemo(() => new Map(game.draws.map(d => [d.i, d.d])), [game]);
  const stats = useMemo(() => summarizePredictionRecords(records, game), [records, game]);

  const view = records.filter(r=> filter==='all' ? true : filter==='done' ? r.status==='evaluated' : r.zeroFalseExclusion)
                      .slice(0, limit||undefined);

  const Ball = ({n,c}) => <span className={'ball xs '+c}>{pad(n)}</span>;
  const Mains = ({v}) => v && v.length ? v.map(n=> <Ball key={n} n={n} c={tag==='dlt'?'orange':'red'}/>) : <span className="dim">—</span>;
  const Extras = ({v}) => v && v.length ? v.map(n=> <Ball key={n} n={n} c="blue"/>) : <span className="dim">—</span>;
  const Verdict = ({r}) => r.status==='pending' ? <span className="badge wait">待开奖</span>
    : r.status==='unevaluable' ? <span className="badge wait">无法评估</span>
    : r.zeroFalseExclusion ? <span className="badge ok">零误排</span>
    : <span className="badge no">误排 {(r.falseExcludedMain?r.falseExcludedMain.length:0)+(r.falseExcludedExtra?r.falseExcludedExtra.length:0)} 个</span>;

  return (
    <>
      <div className="section">
        <div className="sec-head">
          <h2>预测结果 · 排除效果报表</h2>
          <span className="sub">{game.name}：正式快照 {stats.total - stats.legacy} 期 · 历史重建 {stats.legacy} 期；仅具备开奖前时间证据的正式快照纳入评估</span>
          <span className="badge">{stats.total} 期记录</span>
        </div>

        <div className="metrics" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
          <div className="metric"><div className="label">已开奖判定</div>
            <div className="value">{stats.done}<small> / {stats.total}</small></div>
            <div className="dim" style={{fontSize:12}}>待开奖 {stats.pending} 期{stats.unevaluable ? ` · 无法评估 ${stats.unevaluable} 期` : ''}</div></div>
          <div className="metric"><div className="label">单号排除准确率</div>
            <div className="value">{(stats.overall.accuracy*100).toFixed(1)}<small>%</small></div>
            <div className="dim" style={{fontSize:12}}>主号 {(stats.main.accuracy*100).toFixed(1)}% · {tag==='dlt'?'后区':'蓝球'} {(stats.extra.accuracy*100).toFixed(1)}%</div>
            <div className="dim" style={{fontSize:12}}>随机基线 {(stats.overall.baselineAccuracy*100).toFixed(1)}%</div></div>
          <div className="metric"><div className="label">整期零误排率</div>
            <div className="value">{(stats.overall.zeroRate*100).toFixed(1)}<small>%</small></div>
            <div className="dim" style={{fontSize:12}}>零误排 {stats.overall.zero} / 已开奖 {stats.done}</div>
            <div className="dim" style={{fontSize:12}}>随机基线 {(stats.overall.baselineZeroRate*100).toFixed(2)}%</div></div>
          <div className="metric"><div className="label">平均误排</div>
            <div className="value">{stats.done? stats.overall.avgFalse.toFixed(2):'—'}<small> 个/期</small></div>
            <div className="dim" style={{fontSize:12}}>主号 {stats.main.avgFalse.toFixed(2)} · {tag==='dlt'?'后区':'蓝球'} {stats.extra.avgFalse.toFixed(2)}</div></div>
        </div>

        {stats.done>0 && (
          <div className="chips" style={{marginTop:12}}>
            <span className="dim" style={{fontSize:12}}>误排分布：</span>
            {stats.dist.map(([t,c])=>(
              <span key={t} className="chip" style={{fontSize:11}}>误排 {t} 个 ×{c}</span>
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
                <th>排除主号</th><th>排除{tag==='dlt'?'后区':'蓝球'}</th>
                <th>实际主号</th><th>实际{tag==='dlt'?'后区':'蓝球'}</th>
                <th>误排号码</th><th>判定</th>
              </tr></thead>
              <tbody>
                {view.map(r=>(
                  <tr key={r.issue}>
                    <td className="issue">
                      <div>{r.issue}</div>
                      <div className="dim" style={{fontSize:11,fontWeight:400}}>{r.snapshotSource === 'generated' ? '正式快照' : '历史重建'}</div>
                    </td>
                    <td className="date">{drawByIssue.get(r.issue) || r.actualDate || <span className="dim">—</span>}</td>
                    <td><span className="balls"><Mains v={r.excludedMain}/></span></td>
                    <td><span className="balls"><Extras v={r.excludedExtra}/></span></td>
                    <td><span className="balls"><Mains v={r.actualMain}/></span></td>
                    <td><span className="balls"><Extras v={r.actualExtra}/></span></td>
                    <td>
                      {r.status!=='evaluated' ? <span className="dim">—</span> : (
                        r.falseExcludedMain.length+r.falseExcludedExtra.length===0 ? <span className="dim">无</span> : (
                          <span className="balls"><Mains v={r.falseExcludedMain}/><Extras v={r.falseExcludedExtra}/></span>
                        )
                      )}
                    </td>
                    <td><Verdict r={r}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="big-hint" style={{marginTop:12}}>正式快照须有可验证的开奖前生成时间才纳入评估；历史重建记录的排除集合由已保存保留集合取补集得到，生成时间不可考证，结果仅供参考。误排号码 = 排除集合与实际开奖集合的交集，整期零误排要求两区都没有误排。</div>
      </div>

      <div className="disclaimer" style={{marginTop:4}}>
        <b>重要提示：</b>历史排除表现仅用于检验统计方法，不构成对未来开奖的预测能力证明。随机基线按相同号码池、开奖数量和排除数量计算；开奖为随机独立事件，请理性看待。
      </div>
    </>
  );
}
