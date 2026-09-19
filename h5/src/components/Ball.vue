<template>
  <text
    v-if="num !== null && num !== undefined"
    class="ball"
    :class="[color, size, cand ? 'cand' : '']"
  >{{ pad2(num) }}</text>
</template>

<script>
import { pad } from '../common/lib/format.js';

export default {
  name: 'Ball',
  props: {
    num: { type: [Number, String], default: null },
    color: { type: String, default: 'red' }, // red | orange | blue | ghost
    size: { type: String, default: 'md' },   // xs | sm | md | lg | xl
    cand: { type: Boolean, default: false },
  },
  methods: {
    pad2(n) { return pad(n); },
  },
};
</script>

<style lang="scss" scoped>
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

.ball.red {
  background: radial-gradient(circle at 32% 28%, #ff8aa0, #ff3d5e 72%);
  box-shadow: 0 6rpx 16rpx -4rpx rgba(255, 77, 109, 0.5);
}

.ball.orange {
  background: radial-gradient(circle at 32% 28%, #ffd68a, #ff971e 72%);
  box-shadow: 0 6rpx 16rpx -4rpx rgba(255, 171, 46, 0.45);
}

.ball.blue {
  background: radial-gradient(circle at 32% 28%, #8fd0ff, #2f8bf0 72%);
  box-shadow: 0 6rpx 16rpx -4rpx rgba(77, 171, 255, 0.45);
}

.ball.ghost {
  background: var(--surface3);
  color: var(--faint);
  text-shadow: none;
  box-shadow: none;
  border: 1px solid var(--border2);
}

.ball.cand {
  box-shadow: inset 0 0 0 3rpx var(--teal), 0 6rpx 16rpx -4rpx rgba(55, 224, 193, 0.4);
}

.ball.xs { width: 44rpx; height: 44rpx; font-size: 22rpx; }
.ball.sm { width: 52rpx; height: 52rpx; font-size: 24rpx; }
.ball.md { width: 64rpx; height: 64rpx; font-size: 28rpx; }
.ball.lg { width: 80rpx; height: 80rpx; font-size: 34rpx; }
.ball.xl { width: 108rpx; height: 108rpx; font-size: 48rpx; }
</style>