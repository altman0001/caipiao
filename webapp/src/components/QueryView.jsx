import { useMemo, useState } from 'react';
import { pad } from '../lib/format.js';
import { ballClass } from '../lib/format.js';

export default function QueryView({ game }) {
  const [q, setQ] = useState('');
  const [include, setInclude] = useState('');
  const [xinclude, setXinclude] = useState('');
  const [page, setPage] = useState(0);
  const PAGE = 50;
  const tag = game.tag;

  const rows = useMemo(() => {
    const inc = parseNums(include), xinc = parseNums(xinclude);
    const kw = q.trim().toLowerCase();
    return game.draws.map((d, idx) => {
      const m = [...d.m], x=[...d.x];
      const row = {
        issue:d.i, date:d.d, m, x,
        sum:m.reduce((a,b)=>a+b,0),
        span:Math.max(...m)-Math.min(...m),
        odd:m.filter(n=>n%2).length,
        idx,
      };
      if (kw && !(d.i.includes(kw) || d.d.includes(kw))) return null;
      if (inc.length && !inc.every(n=>m.includes(n))) return null;
      if (xinc.length && !xinc.every(n=>x.includes(n))) return null;
      return row;
    }).filter(Boolean).reverse();
  }, [game, q, include, xinclude]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const safe = Math.min(page, pages-1);
  const view = rows.slice(safe*PAGE, safe*PAGE+PAGE);

  const Ball = ({n, c}) => <span className={'ball xs '+c}>{pad(n)}</span>;

  return (
    <div className="section">
      <div className="sec-head">
        <h2>开奖记录查询</h2>
        <span className="sub">按期号/日期检索，或指定包含的主号 / 后区号筛选</span>
        <span className="badge">{rows.length} 条匹配</span>
      </div>

      <div className="searchbar">
        <div className="field"><input placeholder="期号 或 日期，如 24001 / 2026-09" value={q} onChange={e=>{setQ(e.target.value);setPage(0)}}/></div>
        <div className="field"><input placeholder="必含主号，如 06,23" value={include} onChange={e=>{setInclude(e.target.value);setPage(0)}} style={{maxWidth:150}}/></div>
        <div className="field"><input placeholder={'必含'+(tag==='dlt'?'后区 / 蓝球':'蓝球')+', 如 14'} value={xinclude} onChange={e=>{setXinclude(e.target.value);setPage(0)}} style={{maxWidth:150}}/></div>
        <div className="spacer"/>
        <div className="seg">
          <button onClick={()=>setPage(Math.max(0,safe-1))} disabled={safe===0} style={{opacity:safe===0?.4:1}}>上一页</button>
          <button disabled style={{opacity:.7,cursor:'default'}}>{safe+1} / {pages}</button>
          <button onClick={()=>setPage(Math.min(pages-1,safe+1))} disabled={safe>=pages-1} style={{opacity:safe>=pages-1?.4:1}}>下一页</button>
        </div>
      </div>

      {view.length===0 && <div className="empty">没有匹配的记录</div>}
      {view.length>0 && (
        <div className="tablewrap">
          <table className="lt">
            <thead><tr>
              <th>期号</th><th>期次</th><th>开奖日期</th><th>主号码</th><th>{tag==='dlt'?'前区':'红球'}和值</th><th>跨度</th><th>奇比</th>
              {tag==='dlt' && <th>后区</th>}
              {tag==='ssq' && <th>蓝球</th>}
            </tr></thead>
            <tbody>
              {view.map(r=>(
                <tr key={r.issue}>
                  <td className="issue">{r.issue}</td>
                  <td>{r.date.slice(0,4)}</td>
                  <td className="date">{r.date}</td>
                  <td>
                    <span className="sum-cell">
                      {r.m.map(n=> <Ball key={n} n={n} c={tag==='dlt'?'orange':'red'}/>)}
                      {tag==='dlt'
                        ? r.x.map(n=> <Ball key={n} n={n} c="blue"/>)
                        : r.x.map(n=> <Ball key={n} n={n} c="blue"/>)}
                    </span>
                  </td>
                  <td>{r.sum}</td>
                  <td>{r.span}</td>
                  <td>{r.odd}:{r.m.length-r.odd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
function parseNums(s){ return (s||'').split(/[,，\s]+/).map(x=>parseInt(x,10)).filter(x=>!isNaN(x) && x>0); }