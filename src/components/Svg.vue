<template>
  <svg class="svg-icon" aria-hidden="true">
    <use :xlink:href="'#' + icon" />
  </svg>
</template>

<script>
export default {
  props: {
    icon: String
  }
}
</script>
<style lang="scss" scoped>
.svg-icon {
  width: 16px;
  height: 16px;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>