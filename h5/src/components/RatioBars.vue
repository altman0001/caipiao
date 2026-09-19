<template>
  <view class="ratio">
    <view class="bars" style="height: 190rpx">
      <view v-for="it in items" :key="it.k" class="bar-col">
        <text class="v">{{ it.v }}</text>
        <view class="bar" :style="{ height: h(it) + '%' }" />
        <text class="bk">{{ it.k }}</text>
      </view>
    </view>
  </view>
</template>

<script>
// 形态比值分布（奇偶比 / 大小比） data: {"3:3": 34, ...}
export default {
  name: 'RatioBars',
  props: {
    data: { type: Object, default: () => ({}) },
  },
  computed: {
    items() {
      return Object.entries(this.data)
        .map(([k, v]) => ({ k, v }))
        .sort((a, b) => b.v - a.v);
    },
  },
  methods: {
    h(it) {
      const mx = Math.max(...this.items.map((i) => i.v), 1);
      return Math.max(2, Math.round((it.v / mx) * 100));
    },
  },
};
</script>

<style lang="scss" scoped>
.ratio { margin-top: 6rpx; }

.bars {
  display: flex;
  align-items: flex-end;
  gap: 8rpx;
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
  background: linear-gradient(180deg, #7f9cff, #4d6bff);
  min-height: 4rpx;
}

.bar-col .bk {
  font-size: 18rpx;
  color: var(--faint);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>