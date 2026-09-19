<template>
  <view class="topbar">
    <view class="topbar-row">
      <view class="brand">
        <view class="logo"><i class="r" /><i class="b" /></view>
        <view style="flex:1;min-width:0">
          <view class="bt">
            彩研<span class="dot">·</span>规律分析
          </view>
          <text class="sub">{{ gameName }} {{ total }}期 · 数据截至 {{ buildDate }}</text>
        </view>
      </view>
      <view class="theme-btn" hover-class="none" @click="toggleTheme">
        <view class="tdot" />
        <text>{{ store.theme === 'dark' ? '明亮' : '暗色' }}</text>
      </view>
    </view>

    <view class="game-seg">
      <view class="item" :class="{ on: store.game === 'ssq' }" @click="pick('ssq')">双色球</view>
      <view class="item" :class="{ on: store.game === 'dlt' }" @click="pick('dlt')">大乐透</view>
    </view>

    <scroll-view v-if="showWin" class="win-bar" scroll-x :show-scrollbar="false">
      <view class="win-inner">
        <view
          v-for="w in WINS"
          :key="w[0]"
          class="chip"
          :class="{ on: store.win === w[0] }"
          @click="pickWin(w[0])"
        >{{ w[1] }}</view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { store, setGame, setWin, setTheme } from '../common/store.js';
import { META } from '../common/data.js';

const WINS = [
  ['all', '全部'], ['30', '近30期'], ['50', '近50期'],
  ['100', '近100期'], ['200', '近200期'], ['500', '近500期'],
];

export default {
  name: 'TopBar',
  props: {
    showWin: { type: Boolean, default: false },
  },
  data() {
    return { store, WINS };
  },
  computed: {
    gameName() { return store.game === 'ssq' ? '双色球' : '大乐透'; },
    total() { return store.game === 'ssq' ? META.ssq_total : META.dlt_total; },
    buildDate() { return META.build_date; },
  },
  methods: {
    pick(g) { setGame(g); },
    pickWin(w) { setWin(w); },
    toggleTheme() { setTheme(store.theme === 'dark' ? 'light' : 'dark'); },
  },
};
</script>

<style lang="scss" scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 60;
  padding: calc(var(--status-bar-height) + 12rpx) 26rpx 14rpx;
  background: var(--header-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

.topbar-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex: 1;
  min-width: 0;
}

.logo {
  width: 44rpx;
  height: 44rpx;
  position: relative;
  flex: none;
  filter: drop-shadow(0 6rpx 10rpx rgba(255, 77, 109, 0.4));
}

.logo i {
  position: absolute;
  border-radius: 50%;
  display: block;
}

.logo i.r {
  width: 30rpx;
  height: 30rpx;
  background: radial-gradient(circle at 32% 30%, #ff8aa0, #ff4d6d);
  left: 0;
  top: 7rpx;
}

.logo i.b {
  width: 26rpx;
  height: 26rpx;
  background: radial-gradient(circle at 32% 30%, #8fd0ff, #4dabff);
  right: 0;
  bottom: 3rpx;
  opacity: 0.95;
}

.bt {
  font-weight: 750;
  font-size: 30rpx;
  letter-spacing: 0.5rpx;
  line-height: 1.2;
}

.bt .dot { color: var(--brand); }

.sub {
  display: block;
  font-size: 18rpx;
  color: var(--faint);
  font-weight: 500;
  letter-spacing: 1rpx;
  margin-top: 2rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 430rpx;
}

.theme-btn {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10rpx;
  border: 1px solid var(--border2);
  background: var(--surface2);
  color: var(--muted);
  border-radius: 14rpx;
  padding: 12rpx 20rpx;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1;
}

.tdot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 0 2rpx rgba(23, 34, 64, 0.18);
}

.tdot::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffb84d, #ffab2e);
}

:root[data-theme="light"] .tdot::after {
  background: radial-gradient(circle at 35% 30%, #ffffff, #c6d2ea);
  box-shadow: inset -3rpx -3rpx 6rpx rgba(23, 34, 64, 0.22);
}

.game-seg {
  margin-top: 14rpx;
  display: flex;
  gap: 8rpx;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 6rpx;
  border-radius: 16rpx;
}

.game-seg .item {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  border-radius: 12rpx;
  font-size: 27rpx;
  font-weight: 650;
  color: var(--muted);
}

.game-seg .item.on {
  background: linear-gradient(135deg, rgba(255, 107, 129, 0.24), rgba(74, 107, 255, 0.2));
  color: var(--text);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.08);
}

.win-bar {
  margin-top: 12rpx;
  width: 100%;
}

.win-inner {
  display: flex;
  gap: 10rpx;
  width: max-content;
  padding-bottom: 4rpx;
}

.chip {
  flex: none;
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  font-size: 24rpx;
  font-weight: 600;
}

.chip.on {
  background: var(--surface3);
  color: var(--text);
  border-color: var(--border2);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.06);
}
</style>