import { useState, Component } from 'react';
import { DATA, META } from './data.js';
import QueryView from './components/QueryView.jsx';
import AnalysisView from './components/AnalysisView.jsx';
import PredictView from './components/PredictView.jsx';

class Boundary extends Component {
  constructor(p){ super(p); this.state={err:null}; }
  static getDerivedStateFromError(e){ return {err:e}; }
  render(){
    if(this.state.err){
      return <div className="section"><h2>渲染出错</h2><pre style={{whiteSpace:'pre-wrap',color:'#ff6b81'}}>{String(this.state.err && this.state.err.stack || this.state.err)}</pre>
        <button className="btn st" onClick={()=>this.setState({err:null})}>重试</button></div>;
    }
    return this.props.children;
  }
}

const GAMES = {
  ssq: { ...DATA.ssq, tag: 'ssq' },
  dlt: { ...DATA.dlt, tag: 'dlt' },
};
const TABS = [
  ['query','查询'],
  ['analysis','分析'],
  ['predict','预测'],
];
const WINS = [['all','全部'],['30','近30期'],['50','近50期'],['100','近100期'],['200','近200期'],['500','近500期']];

export default function App() {
  const [gameKey, setGameKey] = useState('ssq');
  const [tab, setTab] = useState('analyse');
  const [win, setWin] = useState('all');
  const game = GAMES[gameKey];
  const winNum = win==='all' ? game.draws.length : parseInt(win,10);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo"><i className="r"/><i className="b"/></span>
          <span>彩研<span style={{color:'var(--brand)'}}>·</span>规律分析<span className="dim" style={{fontWeight:400}}></span>
            <small>大乐透 & 双色球 历史开奖数据中心</small>
          </span>
        </div>
        <nav className="nav">
          {TABS.map(([id,label])=>(
            <button key={id} className={tab===id?'on':''} onClick={()=>setTab(id)}>{label}</button>
          ))}
        </nav>
        <div className="spacer"/>
        <div className="seg">
          <button className={gameKey==='ssq'?'on':''} onClick={()=>setGameKey('ssq')}>双色球</button>
          <button className={gameKey==='dlt'?'on':''} onClick={()=>setGameKey('dlt')}>大乐透</button>
        </div>
        <div className="meta">数据源 <b>datachart.500.com</b><br/>
          双色球 <b>{META.ssq_total}</b> 期 · 大乐透 <b>{META.dlt_total}</b> 期 · {META.build_date}</div>
      </header>

      {(tab==='analysis'||tab==='predict') && (
        <div className="controlbar">
          <span className="dim" style={{fontSize:12}}>统计窗口：</span>
          <div className="seg">
            {WINS.map(([v,l])=> <button key={v} className={win===v?'on':''} onClick={()=>setWin(v)}>{l}</button>)}
          </div>
          <span className="dim" style={{fontSize:12,color:'var(--faint)'}}>当前 {game.name} · 窗口 {winNum} 期</span>
        </div>
      )}

      <main className="main">
        {tab==='query' && <Boundary><QueryView game={game}/></Boundary>}
        {tab==='analysis' && <Boundary key={gameKey+win}><AnalysisView game={game} win={winNum}/></Boundary>}
        {tab==='predict' && <Boundary key={gameKey+win}><PredictView game={game} win={winNum}/></Boundary>}
      </main>
    </div>
  );
}