import { pad } from '../lib/format.js';

// 一组号码球（可混主/区）
export default function Balls({ nums=[], extras=[], tag, className='', size='', legend=null, extraHover=[] }) {
  const extraSet = new Set(extras);
  const cls = (n) => tag === 'dlt' ? (extraSet.has(n) ? 'blue' : 'orange') : (extraSet.has(n) ? 'blue' : 'red');
  return (
    <div className={'balls '+className}>
      {nums.map(n => <span key={n} className={'ball '+cls(n)+' '+size} title={cls(n)}>{pad(n)}</span>)}
      {legend && <span className="ball tag ghost">{legend}</span>}
    </div>
  );
}