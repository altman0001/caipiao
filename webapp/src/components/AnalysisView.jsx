import { useMemo } from 'react';
import { computeAnalysis } from '../lib/analysis.js';
import { BarChart, HeatGrid, OmahaGrid, RatioBars, ZoneBars } from './charts.jsx';
import { wanyuan } from '../lib/format.js';

function Dim({ n, title, note, insight, children }) {
  return (
    <div className="panel" style={{gridColumn:''}}>
      <div className="sec-head"><h3 style={{fontSize:14}}>{n}. {title}</h3></div>
      <div className="hint">{note}</div>
      <div style={{marginTop:6}}>{children}</div>
      {insight && <div className="big-hint" style={{marginTop:12,color:'var(--muted)',lineHeight:1.6}}>{insight}</div>}
    </div>
  );
}

export default function AnalysisView({ game, win }) {
  const a = useMemo(()=>computeAnalysis(game, win), [game, win]);
  const n = a.nDraws;
  const avgSum = n && a.sumHist.length ? a.sumHist.reduce((s, it)=>s+Number(it.k)*it.v, 0)/n : 0;
  const avgSpan = n && a.spanHist.length ? a.spanHist.reduce((s, it)=>s+Number(it.k)*it.v, 0)/n : 0;
  const extAvg = a.extra.freq.slice(1).reduce((s,v)=>s+v,0)/a.extra.R;
  const tag = game.tag;

  const m = {
    avgSum, avgSpan,
    consec: a.consecDraws/n,
    repeatPer: a.totalRepeats/n,
    repeatDraw: a.repeatDraws/n,
    sumHist: a.sumHist,
  };

  const Insights = useMemo(()=>{
    const hot = [...a.hot].slice(0,3).map(x=>x.n).join(',');
    const cold = [...a.cold].slice(0,3).map(x=>x.n).join(',');
    const topOdd = Object.entries(a.oddEven).sort((x,y)=>y[1]-x[1])[0] || ['—',0];
    const topBig = Object.entries(a.bigSmall).sort((x,y)=>y[1]-x[1])[0] || ['—',0];
    return { hot, cold, topOdd, topBig };
  },[game, a]);

  // 当前最长遗漏主号（快出候选）
  const due = [...Array(a.R+1).keys()].slice(1).map(x=>({n:x, o:a.om[x], a:a.omHist[x].avg}))
    .filter(x=>x.o>0).sort((x,y)=>y.o-x.o).slice(0,5);

  return (
    <>
      {/* 概览指标 */}
      <div className="section">
        <div className="sec-head">
          <h2>分析概览</h2><span className="sub">近 {n} 期统计 · 开奖主号 {game.mainCount} 选 {game.mainRange}</span>
        </div>
        <div className="metrics">
          <div className="metric"><div className="label">平均和值</div><div className="value">{avgSum.toFixed(1)}</div></div>
          <div className="metric"><div className="label">平均跨度</div><div className="value">{avgSpan.toFixed(1)}</div></div>
          <div className="metric"><div className="label">{tag==='dlt'?'含连号期占比':'含连号期占比'}</div><div className="value">{(a.consecDraws/n*100).toFixed(0)}<small>%</small></div></div>
          <div className="metric"><div className="label">平均重号数</div><div className="value">{m.repeatPer.toFixed(2)}</div></div>
          <div className="metric"><div className="label">重号期占比</div><div className="value">{(a.repeatDraws/(n)*100).toFixed(0)}<small>%</small></div></div>
          <div className="metric"><div className="label">{tag==='dlt'?'后区':'蓝球'}均出频</div><div className="value">{extAvg.toFixed(1)}<small>次</small></div></div>
        </div>
        <div className="tagline" style={{marginTop:12}}>
          近 {n} 期最热主号 <b style={{color:'#ff6b81'}}>{Insights.hot}</b>，最冷主号 <b style={{color:'#4dabff'}}>{Insights.cold}</b>；
          最常见的奇偶形态为 <b>{Insights.topOdd[0]}</b>（{Insights.topOdd[1]} 期），大小形态 <b>{Insights.topBig[0]}</b>（{Insights.topBig[1]} 期）。
        </div>
      </div>

      {/* 维度网格 */}
      <div className="grid2">
        <Dim n="1" title="号码冷热频率" note="统计每个主号在该窗口内开出的总次数，红=热号，蓝=冷号，是大众最基础的参考。"
          insight={<span>最热：<b style={{color:'#ff6b81'}}>{Insights.hot}</b> · 最冷：<b style={{color:'#4dabff'}}>{Insights.cold}</b>。热号受跟号青睐，冷号则被视为"待回补"。</span>}>
          <HeatGrid R={a.R} values={a.freqArr} onClick={null}/>
        </Dim>

        <Dim n="2" title="遗漏走势" note="每个主号距上次开出的期数（遗漏值）。值越大越久未开，被视为深冷，深红高危、浅红接近历史均遗漏(可能回补)。"
          insight={<div>当前遗漏最深的 5 个主号：{due.map(d=>`${d.n}号${d.o}期`).join('、')}。「遗漏+均值回补」是最流行的守号策略。</div>}>
          <OmahaGrid R={a.R} om={a.om} omHist={a.omHist}/>
        </Dim>

        <Dim n="3" title="奇偶比分布" note="每期主号的 奇数:偶数 比值出现频率。多数期次集中在 2:4 / 3:3 / 4:2。">
          <RatioBars data={a.oddEven}/>
        </Dim>

        <Dim n="4" title="大小比分布" note={`按 ${a.bigBound} 为界分大小（≤${a.bigBound} 小 >${a.bigBound} 大），统计各大小比的出现次数。均衡形态更常见。`}>
          <RatioBars data={a.bigSmall}/>
        </Dim>

        <Dim n="5" title="质数个数分布" note="统计每期主号中质数(2/3/5/7/11/13/17/19/23/29/31…)的个数分布，帮助判断民间常用的质数配比仓位。">
          <BarChart data={Object.entries(a.primeComp).map(([k,v])=>({k, v}))} color="linear-gradient(180deg,#b497ff,#8b5ff5)"/>
        </Dim>

        <Dim n="6" title="区间分布（三区）" note={`主号 ${a.R} 个号码等分三区，观察出号在两端的偏移，判断"断区/守区"。`}>
          <ZoneBars z1={a.zones.z1} z2={a.zones.z2} z3={a.zones.z3} boundary={a.zones.boundary} R={a.R}/>
        </Dim>

        <Dim n="7" title="和值分布" note={`主号和值在 ${Math.min(...a.sumHist.map(it=>+it.k))}~${Math.max(...a.sumHist.map(it=>+it.k))} 之间。平均和值 ${avgSum.toFixed(1)} 附近期数最多，是评断偏大/偏小形态的标尺。`}>
          <BarChart data={a.sumHist} height={130} color="linear-gradient(180deg,#37e0c0,#17b8a0)"/>
        </Dim>

        <Dim n="8" title="跨度分布" note="跨度 = 最大主号 − 最小主号，反映号码分散度。跨度过大过小都是相对少见形态。">
          <BarChart data={a.spanHist} height={130} color="linear-gradient(180deg,#ffab2e,#ff7b1c)"/>
        </Dim>

        <Dim n="9" title="连号统计" note="统计每期是否出现相邻连号(如 12·13)，以及连号对数。">
          <div className="metrics" style={{gridTemplateColumns:'1fr 1fr'}}>
            <div className="metric"><div className="label">含连号期占比</div><div className="value">{(a.consecDraws/n*100).toFixed(0)}<small>%</small></div></div>
            <div className="metric"><div className="label">平均连号对数/期</div><div className="value">{a.consecPairs/n.toFixed(2)}</div></div>
          </div>
          <div className="big-hint" style={{marginTop:10}}>超过一半的期次都开了连号，说明"相邻号码对"确实频繁——这是大众会主动编织连号的原因。</div>
        </Dim>

        <Dim n="10" title="重号统计" note="统计与上一期重复出现主号的个数（重号）。观察每期重号个数的分布。">
          <BarChart data={a.repeatHist} height={120} color="linear-gradient(180deg,#ff6b81,#e04463)"/>
          <div className="big-hint" style={{marginTop:10}}>平均每期重上期 <b>{m.repeatPer.toFixed(2)}</b> 个，约 <b>{(m.repeatDraw*100).toFixed(0)}%</b> 的期次至少重 1 个。跟"上期号"有统计依据但非必然。</div>
        </Dim>

        <Dim n="11" title="尾数分布" note="所有主号码个位尾数(0-9)的累计出现次数，了解同尾号的冷热尾。">
          <BarChart data={a.tailBar} height={120} color="linear-gradient(180deg,#52d6ff,#2b8bff)"/>
        </Dim>

        <Dim n="12" title={tag==='dlt' ? '后区号码分析' : '蓝球号码分析'} note={`${tag==='dlt'?'后区':'蓝球'} ${game.extraCount} 中 ${game.extraRange}，与主号独立选号，单独看频率与遗漏。`}>
          <HeatGrid R={a.extra.R} values={a.extra.freq} labelFor={(n,v)=>Math.round(v/(n)*100)+'%'}/>
          <div className="big-hint" style={{marginTop:10}}>当前遗漏：{a.extra.om.slice(1).map((v,i)=>[i+1,v]).filter(x=>x[1]>=5).map(x=>`${x[0]}号${x[1]}期`).join(' · ') || '全部近期有出'}</div>
        </Dim>
      </div>
    </>
  );
}