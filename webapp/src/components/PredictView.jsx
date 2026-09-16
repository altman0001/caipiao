import { useMemo, useState } from 'react';
import { predict } from '../lib/predict.js';
import { lerpColor, pad } from '../lib/format.js';

const GR2 = '34,208,129'; // 绿=希望开出低排除
const RD2 = '255,77,109'; // 红=高排除

export default function PredictView({ game, win }) {
  const p = useMemo(()=>predict(game, win), [game, win]);
  const [excludeRatio, setExcludeRatio] = useState(0.72);
  const [sel, setSel] = useState(null); // 选中号码看理由
  const [tip, setTip] = useState(null); // 悬停浮层 {x,y,above,it}
  const tag = game.tag;

  const mainExclCount = Math.round(game.mainRange * excludeRatio);
  const candSet = new Set(p.mainLikely.map(x=>x.n));
  const extraCand = new Set(p.extraLikely.map(x=>x.n));

  const scoreColor = (s)=>lerpColor(GR2, RD2, s/100);
  const mainCls = (n)=> tag==='dlt' ? 'orange' : 'red';

  const selRec = sel && p.mainNot.concat(p.extraNot).find(x=>x.n===sel);

  const showTip = (e, it) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width/2, 96), window.innerWidth - 96);
    const above = r.top > 240;
    setTip({ x, y: above ? r.top - 10 : r.bottom + 10, above, it });
  };

  return (
    <>
      {/* 方法说明 */}
      <div className="section">
        <div className="sec-head"><h2>预测逻辑说明</h2><span className="sub">基于大众常用选号策略，估计每个号码"本期不被开出"的概率</span></div>
        <div className="method grid2" style={{gap:22}}>
          <div>
            <b>策略组合与权重</b>
            <ul style={{margin:'10px 0 0',paddingLeft:18,display:'grid',gap:6}}>
              <li><b style={{color:'#ff6b81'}}>遗漏回补 40%</b> — 依据该号码历史条件概率 P(下期开出 | 当期遗漏g期)，深冷到均值时被视为"待回补"。</li>
              <li><b style={{color:'#ffab2e'}}>近期热度 25%</b> — 近 8 期出现频次，热号有顺延惯性、冬眠号被视作走冷。</li>
              <li><b style={{color:'#7f9cff'}}>大数频率 20%</b> — 与理论期望出现次数比对，识别"历史欠账"或"透支"。</li>
              <li><b style={{color:'#37e0c0'}}>形态均衡 15%</b> — 奇偶/大小近期占比的均衡调校。</li>
            </ul>
          </div>
          <div>
            <b>打分含义</b>
            <p style={{margin:'10px 0 0',lineHeight:1.8,color:'var(--muted)'}}>
              每个号码得到一个 <b style={{color:'var(--text)'}}>0–100 的"排除置信分"</b>（在各自号码池内归一化）：
              分数越高 = 按本策略越有把握认为它本期不会开出、建议排除；
              分数越低 = 相对更可能出现，需保留关注。
            </p>
            <div className="pred-legend" style={{marginTop:14}}>
              <span><span className="flag" style={{background:lerpColor(GR2,RD2,0.05)}}/>可能出现（低排除）</span>
              <span><span className="flag" style={{background:lerpColor(GR2,RD2,0.9)}}/>建议排除（高置信）</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主号码预测 */}
      <div className="section">
        <div className="sec-head">
          <h2>{tag==='dlt'?'前区':'主号'} 排除预测</h2>
          <span className="sub">下一期 {game.mainCount} 个主号较难开出 Top 候选</span>
          <span className="badge">{game.mainCount} 选 {game.mainRange}</span>
        </div>

        <div className="metrics" style={{gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))'}}>
          <div className="metric"><div className="label">推荐保留(候选开出)</div>
            <div className="balls" style={{marginTop:8}}>{p.mainLikely.map(x=> <span key={x.n} className={'ball xs '+mainCls(x.n)+' cand'}>{pad(x.n)}</span>)}</div>
          </div>
          <div className="metric"><div className="label">建议排除</div><div className="value" style={{fontSize:20}}>{game.mainRange-game.mainCount} <small>个</small></div>
            <div className="dim" style={{fontSize:12}}>剩余号码按排除置信分排列</div></div>
        </div>

        <div className="sw-2">
          <label className="sw">排除划线（按分数取最高的 {Math.round(excludeRatio*100)}%）：
            <input type="range" min="45" max="90" value={Math.round(excludeRatio*100)} onChange={e=>setExcludeRatio(e.target.value/100)}/></label>
          <span className="dim">{mainExclCount} 个标红排除</span>
        </div>

        <div className="heat" style={{gridTemplateColumns:'repeat(8,1fr)',marginTop:14}}>
          {p.mainNot.map((it,i)=> {
            const isCand = candSet.has(it.n);
            const excluded = i < mainExclCount;
            return (
              <div key={it.n} className="cell" onClick={()=>setSel(it.n)}
                onMouseEnter={e=>showTip(e,it)} onMouseLeave={()=>setTip(null)}
                style={{background: isCand ? 'var(--surface3)' : lerpColor(GR2,RD2,it.score/100)+(excluded?'':'22'),
                        color: isCand ? 'var(--teal-text)' : (excluded?'#fff':'inherit'),
                        boxShadow: isCand? 'inset 0 0 0 2px var(--teal-text)':'none',
                        cursor:'pointer'}}>
                <span>{pad(it.n)}</span><small>{excluded? '排除':'保留'}</small>
              </div>
            );
          })}
        </div>
        <div className="big-hint" style={{marginTop:12}}>悬停任一号码查看其排除置信分与判定理由；点击可固定在下方查看。绿色描边 = 预测较可能开出。</div>
      </div>

      {/* 打分明细与理由 */}
      <div className="section">
        <div className="sec-head"><h2>排除置信排名</h2><span className="sub">按分数从高到底（高=越有把握不会开出）</span></div>
        {selRec && (
          <div className="panel" style={{background:'var(--surface3)',borderColor:'var(--brand)',marginBottom:14}}>
            <div className="sec-head">
              <h3>号码 {pad(sel)} 的判定</h3>
              <span className="badge" style={{background:'var(--brand)',color:'#fff',border:0}}>排除置信 {selRec.score}</span>
              {candSet.has(sel) && <span className="badge" style={{background:'var(--teal-soft)',color:'var(--teal-text)'}}>预测可能开出</span>}
            </div>
            <div className="chips" style={{marginTop:10}}>
              {selRec.reasons.map(r=> <span key={r.k} className="chip" style={{fontSize:11}}>{r.label}</span>)}
            </div>
          </div>
        )}
        <div className="rank">
          {p.mainNot.slice(0,15).map((it,i)=>(
            <div key={it.n} className="ri" onClick={()=>setSel(it.n)} style={{cursor:'pointer'}}>
              <span className="no">{i+1}</span>
              <span className={'ball xs '+mainCls(it.n)}>{pad(it.n)}</span>
              <div className="rbar"><div className="rfill" style={{width:it.score+'%',background:scoreColor(it.score)}}/></div>
              <span className="sc" style={{color:scoreColor(it.score)}}>{it.score}</span>
            </div>
          ))}
        </div>

        <div className="sec-head" style={{marginTop:22}}>
          <h3 style={{fontSize:14}}>{tag==='dlt'?'后区':'蓝球'} 排除预测</h3><span className="badge">{game.extraCount} 中 {game.extraRange}</span>
        </div>
        <div className="metrics" style={{gridTemplateColumns:'1fr 1fr'}}>
          <div className="metric"><div className="label">候选开出</div>
            <div className="balls" style={{marginTop:8}}>{p.extraLikely.map(x=> <span key={x.n} className={'ball xs blue cand'}>{pad(x.n)}</span>)}</div></div>
        </div>
        <div className="heat" style={{gridTemplateColumns:'repeat(8,1fr)',marginTop:12}}>
          {p.extraNot.map(it=> {
            const isCand = extraCand.has(it.n);
            return (
              <div key={it.n} className="cell" onClick={()=>setSel(it.n)}
                onMouseEnter={e=>showTip(e,it)} onMouseLeave={()=>setTip(null)}
                style={{background:isCand?'var(--surface3)':'var(--bg2)', color:isCand?'var(--blue-text)':'var(--muted)', boxShadow:isCand?'inset 0 0 0 2px var(--blue-strong)':'none', cursor:'pointer'}}>
                <span>{pad(it.n)}</span><small>{isCand?'保留':'排除'}</small>
              </div>
            );
          })}
        </div>
      </div>

      {tip && (
        <div className={'tip'+(tip.above?' up':'')} style={{left:tip.x, top:tip.y}}>
          <div className="tip-head">号码 {pad(tip.it.n)} · 排除置信 <b style={{color:scoreColor(tip.it.score)}}>{tip.it.score}</b></div>
          <div className="tip-reasons">
            {tip.it.reasons.map(r=>(
              <div key={r.k} className="tip-row">
                <span>{r.label}</span>
                <small>权重 {Math.round(r.w*100)}%</small>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="disclaimer" style={{marginTop:4}}>
        <b>重要提示：</b>体彩/福彩开奖均为随机独立事件，历史数据不构成对未来结果的确定性依据。本页"排除打分"仅是统计学上对"较不容易开出"的相对排序，用于研究开奖数据的分布规律，不能保证命中，亦不构成任何投注建议。请理性看待、量力而行。
      </div>
    </>
  );
}