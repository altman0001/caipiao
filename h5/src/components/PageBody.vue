<template>
  <view class="page-body fade-up">
    <slot />
  </view>
</template>

<script>
export default {
  name: 'PageBody',
};
</script>

<style lang="scss" scoped>
.page-body {
  padding: 20rpx 24rpx 60rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
</style>