<template>
  <view class="zone">
    <view v-for="z in zones" :key="z.label" class="row">
      <view class="bar-head">
        <text class="zl">{{ z.label }}</text>
        <text class="zv">{{ z.pct }}% · {{ z.v }}</text>
      </view>
      <view class="rbar">
        <view class="rfill" :style="{ width: rw(z.v) + '%', background: z.c }" />
      </view>
    </view>
  </view>
</template>

<script>
// 三区分布横条
export default {
  name: 'ZoneBars',
  props: {
    z1: { type: Number, default: 0 },
    z2: { type: Number, default: 0 },
    z3: { type: Number, default: 0 },
    boundary: { type: Number, default: 11 },
    R: { type: Number, default: 33 },
  },
  computed: {
    total() { return this.z1 + this.z2 + this.z3; },
    mx() { return Math.max(this.z1, this.z2, this.z3, 1); },
    zones() {
      const b = this.boundary;
      const lines = [
        ['一区 1-' + b, this.z1, '#4dabff'],
        ['二区 ' + (b + 1) + '-' + Math.min(b * 2, this.R), this.z2, '#ffab2e'],
        ['三区 ' + (b * 2 + 1) + '-' + this.R, this.z3, '#ff6b81'],
      ];
      return lines.map(([label, v, c]) => ({
        label, v, c,
        pct: this.total ? ((v / this.total) * 100).toFixed(1) : '0.0',
      }));
    },
  },
  methods: {
    rw(v) { return Math.round((v / this.mx) * 100); },
  },
};
</script>

<style lang="scss" scoped>
.zone { display: flex; flex-direction: column; gap: 18rpx; margin-top: 8rpx; }

.bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 20rpx;
  color: var(--faint);
  margin-bottom: 8rpx;
}

.zv { font-variant-numeric: tabular-nums; }

.rbar {
  background: var(--surface3);
  border-radius: 999rpx;
  height: 16rpx;
  overflow: hidden;
}

.rfill { height: 100%; border-radius: 999rpx; }
</style>