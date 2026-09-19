// 通用格式化与调色工具（H5 版）
export const pad = (n) => String(n).padStart(2, '0');

// 颜色插值：t in [0,1] -> rgb
export function lerpColor(c1, c2, t) {
  const a = c1.split(',').map(Number), b = c2.split(',').map(Number);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, Math.max(0, t))));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

export const HOT = "255,86,90";
export const COOL = "44,88,160";
export const COLDGREEN = "52,208,129";

export function color01(t) {
  // t 0=cold(blue) 1=hot(red)
  return lerpColor(COOL, HOT, t);
}

export function wanyuan(v) {
  if (v == null || v === '') return '—';
  const w = Number(v) / 10000;
  if (w >= 10000) return (w / 10000).toFixed(1) + '亿';
  if (w >= 1) return w.toFixed(1) + '万';
  return String(Math.round(w));
}