<template>
  <div :class="{ 'scroll-clicked': vSliderClicked, hide: !_vScrollAble}" @mousedown="onVBarDown" class="scroll-bar-v" ref="bar">
    <div :style="{ height: _vSliderHeight + 'px', top: _vSliderTop + 'px' }" @mousedown="onVsliderDown" class="scroll-slider" :class="{ active: this.vSliderClicked }"></div>
  </div>
</template>
<script>
export default {
  name: 'VScrollBar',
  props: {
    height: {
      type: Number,
      default: 0
    },
    scrollTop: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      barHeight: 0,
      vSliderClicked: false
    }
  },
  computed: {
    _vSliderHeight() {
      let height = (this.barHeight / this.height) * this.barHeight
      return height > 20 ? height : 20
    },
    _vSliderTop() {
      let maxScrollTop1 = this.barHeight - this._vSliderHeight
      let maxScrollTop2 = this.height - this.barHeight
      return (this.scrollTop * maxScrollTop1) / maxScrollTop2
    },
    _vScrollAble() {
      return this.height > this.barHeight
    }
  },
  created() {},
  mounted() {
    this.barHeight = this.$refs.bar.clientHeight
    this.initResizeEvent()
    this.initEvent()
  },
  beforeDestroy() {
    this.resizeObserver.unobserve(this.$refs.bar)
  },
  destroyed() {
    this.unbindEvent()
    globalData.scheduler.removeUiTask(this.moveVsliderTask)
  },
  methods: {
    initResizeEvent() {
      this.resizeObserver = new ResizeObserver(entries => {
        if (this.$refs.bar && this.$refs.bar.clientHeight) {
          this.barHeight = this.$refs.bar.clientHeight
        }
      })
      this.resizeObserver.observe(this.$refs.bar)
    },
    initEvent() {
      this.initEventFn1 = e => {
        this.onDocumentMouseMove(e)
      }
      this.initEventFn2 = e => {
        this.onDocumentMouseUp(e)
      }
      document.addEventListener('mousemove', this.initEventFn1)
      document.addEventListener('mouseup', this.initEventFn2)
    },
    unbindEvent() {
      document.removeEventListener('mousemove', this.initEventFn1)
      document.removeEventListener('mouseup', this.initEventFn2)
    },
    getScrollTop(sliderTop) {
      let maxScrollTop1 = this.barHeight - this._vSliderHeight
      let maxScrollTop2 = this.height - this.barHeight
      return sliderTop * (maxScrollTop2 / maxScrollTop1)
    },
    onVBarDown(e) {
      if (!this.vSliderClicked) {
        let scrollTop = e.offsetY - this._vSliderHeight / 2
        if (scrollTop > this.barHeight - this._vSliderHeight) {
          scrollTop = this.barHeight - this._vSliderHeight
        }
        scrollTop = scrollTop < 0 ? 0 : scrollTop
        this.$emit('scroll', this.getScrollTop(scrollTop))
        this.$nextTick(() => {
          this.onVsliderDown(e)
        })
      }
    },
    onVsliderDown(e) {
      this.vSliderMouseObj = e
      this.startVSliderTop = this._vSliderTop
      this.vSliderClicked = true
    },
    onDocumentMouseMove(e) {
      // 之前按住了滚动条，在未松手的情况，此时即使鼠标移出滚动条范围进行滑动，滚动条也应该滚动
      if (this.vSliderMouseObj) {
        let maxScrollTop1 = this.barHeight - this._vSliderHeight
        let delta = e.clientY - this.vSliderMouseObj.clientY
        let top = this.startVSliderTop
        top += delta
        top = top < 0 ? 0 : top
        top = top > maxScrollTop1 ? maxScrollTop1 : top
        this.startVSliderTop += delta
        this.vSliderMouseObj = e
        this.moveScrollTop = this.getScrollTop(top)
        if (this.moveScrollTop && !this.moveVsliderTask) {
          this.moveVsliderTask = globalData.scheduler.addUiTask(() => {
            if (this.moveScrollTop >= 0 && this.moveScrollTop !== this.scrollTop) {
              this.$emit('scroll', this.moveScrollTop)
              this.moveScrollTop = -1
            } else {
              globalData.scheduler.removeUiTask(this.moveVsliderTask)
              this.moveVsliderTask = null
            }
          })
        }
      }
    },
    onDocumentMouseUp(e) {
      globalData.scheduler.removeUiTask(this.moveVsliderTask)
      this.vSliderClicked = false
      this.vSliderMouseObj = null
      this.moveVsliderTask = null
    }
  }
}
</script>