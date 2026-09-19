<script>
import { store, setTheme } from './common/store.js';

export default {
  onLaunch() {
    try { document.documentElement.setAttribute('data-theme', store.theme); } catch (e) { /* ignore */ }
  },
  created() {
    // 主题切换入口（供 TopBar 使用）
    this.store = store;
    this.setTheme = setTheme;
  },
};
</script>

<style lang="scss">
/* ============ 主题变量（暗色默认 / 亮色） ============ */
:root {
  --bg: #0b0f1c;
  --bg2: #0f1526;
  --surface: #141b30;
  --surface2: #1a2340;
  --surface3: #202a4d;
  --border: rgba(148, 163, 190, 0.15);
  --border2: rgba(148, 163, 190, 0.26);
  --text: #e8eefb;
  --muted: #93a0bf;
  --faint: #5d6a8c;
  --red: #ff4d6d;
  --orange: #ffab2e;
  --blue: #4dabff;
  --teal: #37e0c0;
  --green: #34d081;
  --brand: #ff6b81;
  --brand-deep: #ff2d52;
  --radius: 14px;
  --radius-sm: 9px;
  --shadow: 0 10rpx 30rpx -12rpx rgba(0, 0, 0, 0.55);
  --shadow-sm: 0 4rpx 16rpx -10rpx rgba(0, 0, 0, 0.5);
  --header-bg: rgba(11, 15, 28, 0.78);
  --blue-text: #4dabff;
  --blue-strong: #4dabff;
  --teal-text: #37e0c0;
  --teal-soft: rgba(55, 224, 193, 0.2);
  --overdue: #ffb3c0;
  --red-bg: rgba(255, 77, 109, 0.14);
  --cell-bg: #1a2340;
  --input-bg: #1a2340;
  color-scheme: dark;
}

:root[data-theme="light"] {
  --bg: #eef1f7;
  --bg2: #e7ebf4;
  --surface: #ffffff;
  --surface2: #f4f6fb;
  --surface3: #e2e8f2;
  --border: rgba(23, 34, 64, 0.12);
  --border2: rgba(23, 34, 64, 0.22);
  --text: #182138;
  --muted: #55658a;
  --faint: #7c89a7;
  --shadow: 0 10rpx 30rpx -14rpx rgba(30, 45, 90, 0.22);
  --shadow-sm: 0 6rpx 20rpx -12rpx rgba(30, 45, 90, 0.22);
  --brand-deep: #e02755;
  --header-bg: rgba(255, 255, 255, 0.86);
  --blue-text: #1f66c9;
  --blue-strong: #2b6fe0;
  --teal-text: #0d9b83;
  --teal-soft: rgba(13, 155, 131, 0.16);
  --overdue: #c92f4e;
  --red-bg: rgba(224, 39, 85, 0.1);
  --cell-bg: #e9eef6;
  --input-bg: #ffffff;
  color-scheme: light;
}

/* ============ 全局基础 ============ */
page {
  background:
    radial-gradient(900rpx 420rpx at 85% -6%, rgba(74, 107, 255, 0.12), transparent 60%),
    radial-gradient(700rpx 360rpx at -14% 4%, rgba(255, 77, 109, 0.09), transparent 55%),
    var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", Roboto, Helvetica, Arial, sans-serif;
  font-size: 28rpx;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

view, text { box-sizing: border-box; }

.num {
  font-variant-numeric: tabular-nums;
  font-family: "DIN Alternate", "SF Mono", ui-monospace, Consolas, "Roboto Mono", monospace;
}

/* ============ 顶部（自定义导航，见 components/TopBar.vue） ============ */

/* ============ 内容区 ============ */
.page-body {
  padding: 20rpx 24rpx 40rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 40rpx);
}

.section {
  background: linear-gradient(180deg, var(--surface), var(--bg2));
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24rpx 26rpx;
  box-shadow: var(--shadow);
}

.sec-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 12rpx;
  flex-wrap: wrap;
}

.sec-head .h2 {
  font-size: 32rpx;
  font-weight: 750;
  letter-spacing: 0.4rpx;
}

.sec-head .sub {
  color: var(--faint);
  font-size: 22rpx;
  flex: 1;
  min-width: 0;
}

.sec-head .badge {
  font-size: 20rpx;
  color: var(--muted);
  background: var(--surface3);
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  border: 1px solid var(--border2);
  white-space: nowrap;
}

.hint {
  color: var(--faint);
  font-size: 22rpx;
  margin-bottom: 16rpx;
}

.big-hint {
  color: var(--muted);
  font-size: 24rpx;
  line-height: 1.7;
  margin-top: 16rpx;
}

.tagline {
  font-size: 24rpx;
  color: var(--muted);
  line-height: 1.8;
}

/* ============ 指标卡 ============ */
.metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
  margin-top: 14rpx;
}

.metrics.col3 { grid-template-columns: repeat(3, 1fr); }

.m-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 18rpx 20rpx;
}

.m-card .label {
  font-size: 20rpx;
  color: var(--faint);
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

.m-card .value {
  font-size: 40rpx;
  font-weight: 800;
  margin-top: 4rpx;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  font-family: "DIN Alternate", ui-monospace, Consolas, monospace;
}

.m-card .value small {
  font-size: 22rpx;
  font-weight: 600;
  color: var(--muted);
}

.m-card .dim { font-size: 20rpx; color: var(--faint); margin-top: 4rpx; }

/* ============ 号码球 ============ */
.balls { display: flex; gap: 10rpx; flex-wrap: wrap; align-items: center; }
.balls.nowrap { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4rpx; }

.ball {
  position: relative;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex: none;
  font-variant-numeric: tabular-nums;
  color: #fff;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.35);
}

.ball.red { background: radial-gradient(circle at 32% 28%, #ff8aa0, #ff3d5e 72%); box-shadow: 0 6rpx 16rpx -4rpx rgba(255, 77, 109, 0.5); }
.ball.orange { background: radial-gradient(circle at 32% 28%, #ffd68a, #ff971e 72%); box-shadow: 0 6rpx 16rpx -4rpx rgba(255, 171, 46, 0.45); }
.ball.blue { background: radial-gradient(circle at 32% 28%, #8fd0ff, #2f8bf0 72%); box-shadow: 0 6rpx 16rpx -4rpx rgba(77, 171, 255, 0.45); }
.ball.ghost { background: var(--surface3); color: var(--faint); text-shadow: none; box-shadow: none; border: 1px solid var(--border2); }

.ball.cand {
  box-shadow: inset 0 0 0 3rpx var(--teal), 0 6rpx 16rpx -4rpx rgba(55, 224, 193, 0.4);
}

.ball.xs { width: 44rpx; height: 44rpx; font-size: 22rpx; }
.ball.sm { width: 52rpx; height: 52rpx; font-size: 24rpx; }
.ball.md { width: 64rpx; height: 64rpx; font-size: 28rpx; }
.ball.lg { width: 80rpx; height: 80rpx; font-size: 34rpx; }
.ball.xl { width: 108rpx; height: 108rpx; font-size: 48rpx; }

/* ============ 热力网格 ============ */
.heat {
  display: grid;
  gap: 8rpx;
  margin-top: 10rpx;
}

.heat .cell {
  border-radius: 12rpx;
  padding: 10rpx 0 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.15;
  transition: transform 0.15s;
}

.heat .cell:active { transform: scale(0.92); }
.heat .cell span { font-size: 26rpx; font-weight: 700; font-variant-numeric: tabular-nums; }
.heat .cell small { font-size: 18rpx; opacity: 0.9; margin-top: 2rpx; font-variant-numeric: tabular-nums; }

/* ============ 条形图 ============ */
.chart-box { margin-top: 6rpx; }

.bars {
  display: flex;
  align-items: flex-end;
  gap: 6rpx;
  padding: 0 4rpx;
}

.bar-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6rpx;
  height: 100%;
}

.bar-col .v {
  font-size: 18rpx;
  color: var(--muted);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.bar-col .bar {
  width: 100%;
  border-radius: 6rpx 6rpx 3rpx 3rpx;
  min-height: 4rpx;
}

.axis-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
  font-size: 18rpx;
  color: var(--faint);
}

/* ============ 三区横条 ============ */
.rbar {
  background: var(--surface3);
  border-radius: 999rpx;
  height: 14rpx;
  overflow: hidden;
}

.rfill { height: 100%; border-radius: 999rpx; }

/* ============ 排行 ============ */
.rank { display: flex; flex-direction: column; gap: 10rpx; margin-top: 12rpx; }

.rank .ri {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.rank .no {
  width: 34rpx;
  color: var(--faint);
  font-size: 22rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex: none;
}

.rank .rbar { flex: 1; height: 18rpx; }
.rank .sc {
  width: 64rpx;
  text-align: right;
  font-size: 22rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex: none;
}

/* ============ 输入 / 搜索 ============ */
.field {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 14rpx;
  padding: 0 20rpx;
  min-width: 0;
}

.field input {
  flex: 1;
  height: 72rpx;
  font-size: 26rpx;
  color: var(--text);
  min-width: 0;
}

.field .ph { color: var(--faint); font-size: 20rpx; flex: none; }

.search-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.search-grid .field.wide { grid-column: 1 / -1; }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border: 1px solid var(--border2);
  background: var(--surface2);
  color: var(--muted);
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 600;
  padding: 14rpx 24rpx;
}

.btn.primary {
  background: linear-gradient(135deg, rgba(255, 107, 129, 0.85), rgba(255, 45, 82, 0.85));
  color: #fff;
  border: 0;
}

.btn:active { opacity: 0.85; }
.btn[disabled] { opacity: 0.4; }

/* 分页 */
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18rpx;
  margin-top: 20rpx;
}

.pager .pg-btn {
  border: 1px solid var(--border2);
  background: var(--surface2);
  color: var(--muted);
  border-radius: 12rpx;
  padding: 12rpx 26rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.pager .pg-btn.on { color: var(--text); }
.pager .pg-btn[disabled] { opacity: 0.35; }

.pager .pg-info { color: var(--faint); font-size: 24rpx; font-variant-numeric: tabular-nums; }

/* ============ 记录卡片（查询/明细） ============ */
.rec {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 20rpx;
  margin-top: 14rpx;
}

.rec-top {
  display: flex;
  align-items: baseline;
  gap: 14rpx;
  margin-bottom: 14rpx;
}

.rec-top .issue {
  font-weight: 800;
  font-size: 30rpx;
  font-variant-numeric: tabular-nums;
  color: var(--brand);
}

.rec-top .date { font-size: 22rpx; color: var(--faint); flex: 1; }

.rec-stats {
  display: flex;
  gap: 10rpx;
  margin-top: 14rpx;
  flex-wrap: wrap;
}

.stat-chip {
  background: var(--surface3);
  border-radius: 8rpx;
  padding: 4rpx 14rpx;
  font-size: 20rpx;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.stat-chip b { color: var(--text); font-weight: 650; }

/* ============ 空态 ============ */
.empty {
  text-align: center;
  color: var(--faint);
  font-size: 26rpx;
  padding: 60rpx 0;
}

/* ============ 免责声明 ============ */
.disclaimer {
  font-size: 22rpx;
  color: var(--faint);
  line-height: 1.8;
  border-left: 6rpx solid var(--border2);
  padding-left: 18rpx;
}

.disclaimer b { color: var(--muted); }

/* ============ 弹层 ============ */
.tip-panel {
  padding: 20rpx 30rpx 36rpx;
}

.tip-head {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.tip-head .t { font-size: 30rpx; font-weight: 750; }

.tip-rows { display: flex; flex-direction: column; gap: 12rpx; margin-top: 18rpx; }

.tip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
  color: var(--text);
}

.tip-row small { color: var(--faint); font-size: 20rpx; font-variant-numeric: tabular-nums; }

.pop-title {
  font-size: 28rpx;
  font-weight: 700;
  text-align: center;
  padding: 8rpx 0 20rpx;
}

/* ============ uni-ui 微调 ============ */
.popup-slot { background: var(--surface); border-radius: 20rpx 20rpx 0 0; }

/* uni-collapse：uni-ui 内部硬编码白色背景/字体，改为跟随主题变量（需 !important 盖过组件内部规则） */
.uni-collapse {
  background-color: transparent !important;
  border-radius: var(--radius);
  overflow: hidden;
}

.uni-collapse-item__title-box {
  background-color: var(--surface) !important;
  color: var(--text) !important;
}

.uni-collapse-item__title.uni-collapse-item-border {
  border-bottom: 1px solid var(--border) !important;
}

.uni-collapse-item__wrap {
  background-color: var(--bg2) !important;
}

.uni-collapse-item__wrap-content {
  color: var(--text) !important;
}

/* ============ 动画 ============ */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-up { animation: fadeUp 0.35s ease both; }
</style>