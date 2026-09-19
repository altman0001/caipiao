<template>
  <view class="heat" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }">
    <view
      v-for="n in R"
      :key="n"
      class="cell"
      :style="cellStyle(n)"
      @click="onTap(n)"
    >
      <text>{{ pad2(n) }}</text>
      <text class="sub">{{ subFor(n) }}</text>
    </view>
  </view>
</template>

<script>
import { pad, color01, lerpColor, HOT } from '../common/lib/format.js';

// 热力网格：mode='freq' 频率(冷蓝→热红) / mode='omaha' 遗漏(越深越红，超均值为高危) / mode='extra' 后区或蓝球
export default {
  name: 'HeatGrid',
  props: {
    R: { type: Number, required: true },
    values: { type: Array, default: () => [] }, // 索引0占位，1..R
    omHist: { type: Object, default: () => ({}) }, // { n: { avg, max, cur } }
    cols: { type: Number, default: 6 },
    mode: { type: String, default: 'freq' },
    labelFor: { type: Function, default: null },
  },
  methods: {
    pad2(n) { return pad(n); },
    subFor(n) {
      if (this.labelFor) return this.labelFor(n, this.values[n]);
      return this.values[n] == null ? '' : this.values[n];
    },
    cellStyle(n) {
      const v = this.values[n] || 0;
      if (this.mode === 'omaha') {
        const o = v;
        const avg = this.omHist[n] ? this.omHist[n].avg : 0;
        const overdue = o > avg;
        const mx = Math.max(...this.values.slice(1), 1);
        const t = o / mx;
        if (t > 0.05) {
          const bg = overdue ? lerpColor('160,22,40', HOT, Math.min(1, t * 1.2)) + 'aa' : color01(t) + '22';
          const color = overdue ? 'var(--overdue)' : 'inherit';
          return { background: bg, color };
        }
        return { background: 'var(--cell-bg)', color: 'var(--faint)' };
      }
      // freq / extra
      const mx = Math.max(...this.values.slice(1), 1);
      const t = v / mx;
      if (t > 0.02) {
        return { background: color01(t) + '22', color: color01(t) };
      }
      return { background: 'var(--cell-bg)', color: 'var(--faint)' };
    },
    onTap(n) {
      this.$emit('pick', n);
    },
  },
};
</script>

<style lang="scss" scoped>
.heat {
  display: grid;
  gap: 8rpx;
  margin-top: 10rpx;
}

.cell {
  border-radius: 12rpx;
  padding: 10rpx 0 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.15;
}

.cell:active { transform: scale(0.92); }
.cell text { font-size: 26rpx; font-weight: 700; font-variant-numeric: tabular-nums; }
.cell .sub { font-size: 18rpx; opacity: 0.9; margin-top: 2rpx; font-variant-numeric: tabular-nums; }
</style>