<template>
  <div
    :class="{'scroll-clicked': hSliderClicked, hide: !_hScrollAble}"
    @mousedown="onHBarDown"
    class="scroll-bar-h"
    ref="bar"
  >
    <div
      :style="{width: _hSliderWidth + 'px', left: _vSliderLeft + 'px'}"
      @mousedown="onHsliderDown"
      class="scroll-slider"
      :class="{ active: this.hSliderClicked }"
    ></div>
  </div>
</template>
<script>
export default {
  name: 'HScrollBar',
  props: {
    width: {
      type: Number,
      default: 0,
    },
    scrollLeft: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      barWidth: 0,
      hSliderClicked: false,
    };
  },
  computed: {
    _hSliderWidth() {
      let width = (this.barWidth / this.width) * this.barWidth;
      return width > 20 ? width : 20;
    },
    _vSliderLeft() {
      let maxScrollLeft1 = this.barWidth - this._hSliderWidth;
      let maxScrollLeft2 = this.width - this.barWidth;
      return (this.scrollLeft * maxScrollLeft1) / maxScrollLeft2;
    },
    _hScrollAble() {
      return this.width > this.barWidth;
    },
  },
  created() { },
  mounted() {
    this.barWidth = this.$refs.bar.clientWidth;
    this.initResizeEvent();
    this.initEvent();
  },
  beforeDestroy() {
    this.resizeObserver.unobserve(this.$refs.bar);
  },
  destroyed() {
    this.unbindEvent();
    globalData.scheduler.removeUiTask(this.moveHsliderTask);
  },
  methods: {
    initResizeEvent() {
      this.resizeObserver = new ResizeObserver((entries) => {
        if (this.$refs.bar && this.$refs.bar.clientWidth) {
          this.barWidth = this.$refs.bar.clientWidth;
        }
      });
      this.resizeObserver.observe(this.$refs.bar);
    },
    initEvent() {
      this.initEventFn1 = (e) => {
        this.onDocumentMouseMove(e);
      };
      this.initEventFn2 = (e) => {
        this.onDocumentMouseUp(e);
      };
      document.addEventListener('mousemove', this.initEventFn1);
      document.addEventListener('mouseup', this.initEventFn2);
    },
    unbindEvent() {
      document.removeEventListener('mousemove', this.initEventFn1);
      document.removeEventListener('mouseup', this.initEventFn2);
    },
    getScrollLeft(sliderLeft) {
      let maxScrollLeft1 = this.barWidth - this._hSliderWidth;
      let maxScrollLeft2 = this.width - this.barWidth;
      return sliderLeft * (maxScrollLeft2 / maxScrollLeft1);
    },
    onHBarDown(e) {
      if (!this.hSliderClicked) {
        let scrollLeft = e.offsetX - this._hSliderWidth / 2;
        if (scrollLeft > this.barWidth - this._hSliderWidth) {
          scrollLeft = this.barWidth - this._hSliderWidth;
        }
        scrollLeft = scrollLeft < 0 ? 0 : scrollLeft;
        this.$emit('scroll', this.getScrollLeft(scrollLeft));
        this.$nextTick(() => {
          this.onHsliderDown(e);
        });
      }
    },
    onHsliderDown(e) {
      this.hSliderMouseObj = e;
      this.startVSliderLeft = this._vSliderLeft;
      this.hSliderClicked = true;
    },
    onDocumentMouseMove(e) {
      // 之前按住了滚动条，在未松手的情况，此时即使鼠标移出滚动条范围进行滑动，滚动条也应该滚动
      if (this.hSliderMouseObj) {
        let maxScrollLeft1 = this.barWidth - this._hSliderWidth;
        let delta = e.clientX - this.hSliderMouseObj.clientX;
        let left = this.startVSliderLeft;
        left += delta;
        left = left < 0 ? 0 : left;
        left = left > maxScrollLeft1 ? maxScrollLeft1 : left;
        this.startVSliderLeft += delta;
        this.hSliderMouseObj = e;
        this.moveScrollLeft = this.getScrollLeft(left);
        if (this.moveScrollLeft && !this.moveHsliderTask) {
          this.moveHsliderTask = globalData.scheduler.addUiTask(() => {
            if (this.moveScrollLeft >= 0 && this.moveScrollLeft !== this.scrollLeft) {
              this.$emit('scroll', this.moveScrollLeft);
              this.moveScrollLeft = -1;
            } else {
              globalData.scheduler.removeUiTask(this.moveHsliderTask);
              this.moveHsliderTask = null;
            }
          });
        }
      }
    },
    onDocumentMouseUp(e) {
      globalData.scheduler.removeUiTask(this.moveHsliderTask);
      this.hSliderClicked = false;
      this.hSliderMouseObj = null;
      this.moveHsliderTask = null;
    },
  },
};
</script>