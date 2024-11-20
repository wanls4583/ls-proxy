<template>
  <div class="empty-wrap">
    <div>
      <div class="center">
        <i class="icon icon-empty" style="font-size:50px"></i>
      </div>
      <div class="center" style="margin-top:15px">{{title}}</div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    title: {
      type: String,
      default: '暂无数据'
    }
  }
}
</script>
<style lang="scss" scoped>
.empty-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  color: #999;
  .center {
    display: flex;
    justify-content: center;
  }
}
</style>