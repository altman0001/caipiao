<template>
  <view class="rank">
    <view
      v-for="(it, i) in items"
      :key="it.n"
      class="ri"
      @click="onPick(it.n)"
    >
      <text class="no">{{ i + 1 }}</text>
      <text class="ball-xs" :class="ballCls(it)">{{ pad2(it.n) }}</text>
      <view class="rbar">
        <view class="rfill" :style="{ width: it.score + '%', background: colorFor && colorFor(it) || 'var(--brand)' }" />
      </view>
      <text class="sc" :style="{ color: colorFor && colorFor(it) || 'var(--text)' }">{{ it.score }}</text>
    </view>
  </view>
</template>

<script>
import { pad } from '../common/lib/format.js';

// 排除打分排行条 items: [{n, score, cls?}]
export default {
  name: 'RankScore',
  props: {
    items: { type: Array, default: () => [] },
    colorFor: { type: Function, default: null },
  },
  methods: {
    pad2(n) { return pad(n); },
    ballCls(it) { return it.cls || 'red'; },
    onPick(n) { this.$emit('pick', n); },
  },
};
</script>

<style lang="scss" scoped>
.rank { display: flex; flex-direction: column; gap: 12rpx; margin-top: 12rpx; }

.ri {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.no {
  width: 34rpx;
  color: var(--faint);
  font-size: 22rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex: none;
}

.ball-xs {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 700;
  color: #fff;
  flex: none;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.35);
}

.ball-xs.red { background: radial-gradient(circle at 32% 28%, #ff8aa0, #ff3d5e 72%); }
.ball-xs.orange { background: radial-gradient(circle at 32% 28%, #ffd68a, #ff971e 72%); }
.ball-xs.blue { background: radial-gradient(circle at 32% 28%, #8fd0ff, #2f8bf0 72%); }

.rbar {
  flex: 1;
  background: var(--surface3);
  border-radius: 999rpx;
  height: 18rpx;
  overflow: hidden;
}

.rfill { height: 100%; border-radius: 999rpx; }

.sc {
  width: 64rpx;
  text-align: right;
  font-size: 22rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex: none;
}
</style>