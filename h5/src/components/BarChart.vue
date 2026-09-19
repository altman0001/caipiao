<template>
  <view class="chart-box">
    <view class="bars" :style="{ height: (height - 30) + 'rpx' }">
      <view v-for="(d, i) in data" :key="i" class="bar-col">
        <text v-if="showVal" class="v">{{ d.v }}</text>
        <view class="bar" :style="{ height: h(d) + '%', background: color }" />
      </view>
    </view>
    <view class="axis-labels" v-if="data.length">
      <text>{{ data[0].k }}</text>
      <text>{{ data[Math.floor((data.length - 1) / 2)].k }}</text>
      <text>{{ data[data.length - 1].k }}</text>
    </view>
  </view>
</template>

<script>
// 竖向条形图 data: [{k, v}]
export default {
  name: 'BarChart',
  props: {
    data: { type: Array, default: () => [] },
    color: { type: String, default: 'var(--brand)' },
    height: { type: Number, default: 230 }, // rpx
    showVal: { type: Boolean, default: true },
    max: { type: Number, default: null },
  },
  methods: {
    h(d) {
      const mx = this.max || Math.max(...this.data.map((x) => x.v), 1);
      return Math.max(2, Math.round((d.v / mx) * 100));
    },
  },
};
</script>

<style lang="scss" scoped>
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
  font-variant-numeric: tabular-nums;
}
</style>