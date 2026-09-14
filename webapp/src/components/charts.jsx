import { color01, lerpColor, COLDGREEN, HOT } from '../lib/format.js';

// 竖向条形图 data: [{k,v}]
export function BarChart({ data, height=150, color='var(--brand)', max=null, showVal=true, onClick=null }) {
  const mx = max || Math.max(...data.map(d => d.v), 1);
  return (
    <div>
      <div className="bars" style={{height}}>
        {data.map((d,i) => (
          <div className="bar-col" key={d.k+i} style={{cursor: onClick?'pointer':'default'}} onClick={onClick?()=>onClick(d):null}>
            {showVal && <div className="v">{d.v}</div>}
            <div className="bar" style={{height: Math.max(2,(d.v/mx)*100)+'%', background:color}} />
          </div>
        ))}
      </div>
      <div className="axis-labels">
        <span>{data[0].k}</span><span>{data[Math.floor(data.length/2)].k}</span><span>{data[data.length-1].k}</span>
      </div>
    </div>
  );
}

// 频率分配热度网格（主号码）
export function HeatGrid({ R, values, labelFor, onClick=null }) {
  const mx = Math.max(...values.slice(1), 1);
  const cols = 6;
  return (
    <div className="heat" style={{gridTemplateColumns:`repeat(${cols},1fr)`}}>
      {Array.from({length:R}, (_,i)=>i+1).map(n => {
        const v = values[n];
        const t = v / mx;
        return (
          <div key={n}
            className="cell"
            title={labelFor ? labelFor(n,v) : `号码 ${n}：${v} 次`}
            onClick={onClick?()=>onClick(n):null}
            style={{background: t>0.02 ? color01(t)+'22' : 'var(--surface3)',
                    color: t>0.02 ? color01(t) : 'var(--faint)'}}>
            <span>{n}</span>
            <small>{labelFor? labelFor(n,v):v}</small>
          </div>
        );
      })}
    </div>
  );
}

// 遗漏热度（越高越冷=红）
export function OmahaGrid({ R, om, omHist, label='遗漏' }) {
  const mx = Math.max(...om.slice(1), 1);
  const pad = (n)=>String(n).padStart(2,'0');
  return (
    <div className="heat" style={{gridTemplateColumns:`repeat(5,1fr)`}}>
      {Array.from({length:R}, (_,i)=>i+1).map(n => {
        const o = om[n];
        const avg = omHist[n].avg.toFixed(0);
        const overdue = o > omHist[n].avg * 1.0;
        const t = o / mx;
        return (
          <div key={n} className="cell"
            title={`号码 ${n}：已遗漏 ${o} 期，历史均遗漏 ${avg} 期，最大遗漏 ${omHist[n].max} 期`}
            style={{background: t>0.05 ? (overdue ? lerpColor('160,22,40',HOT,t*1.2)+'aa' : color01(t)+'22') : 'var(--surface3)',
                    color: t>0.05 ? (overdue? '#ffb3c0':'inherit') : 'var(--faint)'}}>
            <span>{pad(n)}</span>
            <small>{o}</small>
          </div>
        );
      })}
    </div>
  );
}

// 形态比值分布（如奇偶比） dataEntries: ["3:3":34, ...]
export function RatioBars({ data, title }) {
  const items = Object.entries(data).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v);
  const mx = Math.max(...items.map(i=>i.v),1);
  return (
    <div>
      <div className="bars" style={{height:120}}>
        {items.map(d => (
          <div className="bar-col" key={d.k}>
            <div className="v">{d.v}</div>
            <div className="bar" style={{height:Math.max(2,(d.v/mx)*100)+'%', background:'linear-gradient(180deg,#7f9cff,#4d6bff)'}}/>
            <div className="v">{d.k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 三区横条
export function ZoneBars({ z1, z2, z3, boundary, R }) {
  const mx = Math.max(z1,z2,z3,1);
  const r = (v)=>Math.round((v/mx)*100);
  const zones=[['一区 1-'+boundary,z1,'#4dabff'],['二区 '+(boundary+1)+'-'+Math.min(boundary*2,R),z2,'#ffab2e'],['三区 '+(boundary*2+1)+'-'+R,z3,'#ff6b81']];
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {zones.map(([label,v,c])=>(
        <div key={label}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--faint)',marginBottom:5}}>
            <span>{label}</span><span style={{cursor:'pointer'}}>{((v/ (z1+z2+z3))*100).toFixed(1)}% · {v}</span>
          </div>
          <div className="rbar" style={{height:10}}><div className="rfill" style={{width:r(v)+'%',background:c}}/></div>
        </div>
      ))}
    </div>
  );
}

// 排除打分排行条
export function RankScore({ items, colorFor, onClick=null }) {
  return (
    <div className="rank">
      {items.map((it,i)=>(
        <div className="ri" key={it.n} onClick={onClick?()=>onClick(it.n):null} style={{cursor:onClick?'pointer':'default'}}>
          <span className="no">{i+1}</span>
          <span className={'ball xs '+(it.cls||'red')} style={{fontSize:11}}>{String(it.n).padStart(2,'0')}</span>
          <div className="rbar"><div className="rfill" style={{width:it.score+'%',background:(colorFor||(()=>'var(--brand)'))(it)}}/></div>
          <span className="sc" style={{color:(colorFor||(()=>'var(--text)'))(it)}}>{it.score}</span>
        </div>
      ))}
    </div>
  );
}

// 简单横条（用于某比值）
export function HBar({ v, max, color }) {
  return <div className="rbar"><div className="rfill" style={{width:Math.max(2,(v/max)*100)+'%',background:color}}/></div>;
}