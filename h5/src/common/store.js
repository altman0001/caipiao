// 全局响应式状态：彩种 / 统计窗口 / 主题（跨 tab 共享，持久化到本地）
import { reactive } from 'vue';

function load(key, def) {
  try {
    const v = uni.getStorageSync(key);
    return v === '' || v == null ? def : v;
  } catch (e) {
    return def;
  }
}
function save(key, v) {
  try { uni.setStorageSync(key, v); } catch (e) { /* ignore */ }
}

export const store = reactive({
  game: load('cp-game', 'ssq'),
  win: load('cp-win', 'all'),
  theme: load('cp-theme', 'dark'),
});

export function setGame(g) { store.game = g; save('cp-game', g); }
export function setWin(w) { store.win = w; save('cp-win', w); }
export function setTheme(t) {
  store.theme = t;
  save('cp-theme', t);
  try { document.documentElement.setAttribute('data-theme', t); } catch (e) { /* ignore */ }
}