<template>
  <div class="table-wrap" :style="{height: tableHeight}">
    <div class="hidden-columns">
      <slot :columns="columns"></slot>
    </div>
    <div class="table-title-wrap" ref="title">
      <div class="th-row">
        <div
          class="th-cell"
          v-for="(item, index) in columns"
          :key="index"
          :style="cellStyle(item)"
          :class="item.cellClass"
        >
          <span class="label">{{ item.label }}</span>
        </div>
      </div>
    </div>
    <div class="table-content-wrap" ref="wrap">
      <div
        class="table-content"
        ref="content"
        :style="{ transform: 'translate3d(0,' + _top + ',0)' }"
        @mouseenter="showScrollBar"
        @mouseleave="hideScrollBar"
        @mousemove="showScrollBar"
        @wheel.stop="onWheel"
      >
        <div
          class="row"
          v-for="(row,  index) in renderList"
          :key="index"
          :style="{ top: row.$_top }"
          :class="{ even: (index + 1) % 2 === 0 , active: enableActive && activeLine === row.$_line }"
          @click="onClickRow(row)"
        >
          <div
            class="cell"
            v-for="(item, index) in columns"
            :key="index"
            :style="cellStyle(item)"
            :class="item.cellClass"
          >
            <column :row="row" :column="item" />
          </div>
        </div>
      </div>
      <v-scroll-bar
        :height="contentHeight"
        :scrollTop="scrollTop"
        :class="{ 'scroll-visible': scrollVisible }"
        @scroll="onVScroll"
      />
      <h-scroll-bar
        :width="contentWidth"
        :scrollLeft="scrollLeft"
        :class="{ 'scroll-visible': scrollVisible }"
        @scroll="onHScroll"
      />
    </div>
  </div>
</template>

<script>
import HScrollBar from '../HScrollBar.vue'
import VScrollBar from '../VScrollBar.vue'

const Column = {
  props: {
    row: {
      type: Object,
      default: () => ({})
    },
    column: {
      type: Object,
      default: () => ({})
    }
  },
  render(createElement) {
    return createElement('span', { class: { 'label': true } }, [this.column.renderCell(this.row)])
  }
}
export default {
  name: 'TableComponent',
  components: {
    HScrollBar,
    VScrollBar,
    Column
  },
  props: {
    height: [Number, String],
    data: {
      type: Array,
      default: () => []
    },
    enableActive: {
      type: Boolean,
      default: true
    },
    clickRow: Function,
  },
  data() {
    return {
      columns: [],
      renderList: [],
      renderedCb: [],
      wrapHeight: 0,
      wrapWidth: 0,
      contentHeight: 0,
      contentWidth: 0,
      cellheight: 22,
      scrollTop: 0,
      deltaTop: 0,
      scrollLeft: 0,
      scrollVisible: false,
      startLine: 1,
      maxLines: 10000000,
      activeLine: '',
    }
  },
  computed: {
    _top() {
      return -(this.scrollTop - this.deltaTop) + 'px'
    },
    tableHeight() {
      if (this.height) {
        if (typeof this.height === 'number') {
          return this.height + 'px'
        } else {
          return /^\d+$/.exec(this.height) ? this.height + 'px' : this.height
        }
      } else {
        return '100%'
      }
    },
    cellStyle() {
      return column => {
        let style = {}
        if (column.width) {
          let width = column.width
          if (typeof width === 'number') {
            width += 'px'
          }
          style['width'] = width
          style.flex = `1 1 ${width}`
        } else {
          style.flex = `1 1 auto`
        }
        column.cellStyle && Object.assign(style, column.cellStyle)
        return style
      }
    },
    maxVisibleLines() {
      return Math.ceil(this.wrapHeight / this.cellheight)
    }
  },
  watch: {
    'data.length'() {
      this.setContentHeight()
      this.setStartLine(this.scrollTop)
      this.render()
    },
    startLine: {
      handler() {
        this.render()
      }
    },
    scrollLeft: {
      handler() {
        if (this.$refs.content) {
          this.$refs.content.scrollLeft = this.scrollLeft
          this.$refs.title.scrollLeft = this.scrollLeft
        }
      }
    },
  },
  beforeDestroy() {
    this.resizeObserver?.unobserve(this.$refs.wrap)
  },
  created() {
  },
  mounted() {
    this.getDomSize()
    this.initResizeEvent()
    this.clearTable()
  },
  methods: {
    initResizeEvent() {
      this.resizeObserver = new ResizeObserver(entries => {
        if (this.resizeTimer) {
          return
        }
        this.resizeTimer = setTimeout(() => {
          if (this.$refs.wrap && this.$refs.wrap.clientHeight) {
            this.getDomSize()
            this.setStartLine(this.scrollTop)
            this.onHScroll(this.scrollLeft)
          }
          this.resizeTimer = null
        }, 30)
      })
      this.resizeObserver.observe(this.$refs.wrap)
    },
    getDomSize() {
      this.wrapHeight = this.$refs.wrap.clientHeight
      this.wrapWidth = this.$refs.wrap.clientWidth
      this.contentWidth = this.$refs.title.scrollWidth
    },
    setContentHeight() {
      this.contentHeight = this.data.length * this.cellheight
    },
    setStartLine(scrollTop) {
      let startLine = 1
      let maxScrollTop = this.contentHeight - this.wrapHeight
      scrollTop = Math.round(scrollTop)
      scrollTop = scrollTop < 0 ? 0 : scrollTop
      maxScrollTop = maxScrollTop < 0 ? 0 : maxScrollTop
      if (scrollTop > maxScrollTop) {
        scrollTop = maxScrollTop
      }
      startLine = Math.floor(scrollTop / this.cellheight)
      this.deltaTop = startLine * this.cellheight
      this.startLine = startLine + 1
      this.scrollTop = scrollTop
    },
    showScrollBar() {
      this.scrollVisible = true
    },
    hideScrollBar() {
      this.scrollVisible = false
    },
    // 渲染
    render() {
      if (this.renderTimer) {
        return
      }
      this.renderTimer = requestAnimationFrame(() => {
        this.renderTimer = null
        this.renderLines()
        this.renderedCb.forEach(cb => {
          cb()
        })
        this.renderedCb = []
      })
    },
    renderLines() {
      let preRenderList = this.renderList
      let toRenderLines = []
      let preRenderLineMap = {}
      let lines = 0

      this.renderList = []

      preRenderList.forEach((item, index) => {
        preRenderLineMap[item.$_line] = index
      })

      for (let i = 0, line = this.startLine; i <= this.maxVisibleLines && line <= this.data.length; i++, line++) {
        lines++
      }

      for (let i = 0, line = this.startLine; i < lines && line <= this.data.length; i++, line++) {
        let index = preRenderLineMap[line]
        if (index > -1 && index < lines) {
          // 尽量保持新的列表和旧的列表相同索引对应的行不变，减少渲染时顶部行的删除操作
          this.renderList[index] = _getRowObj.call(this, this.data[line - 1], line)
        } else {
          toRenderLines.push(line)
        }
      }

      toRenderLines.reverse()

      for (let i = 0; i < lines; i++) {
        if (!this.renderList[i]) {
          let line = toRenderLines.pop()
          this.renderList[i] = _getRowObj.call(this, this.data[line - 1], line)
        }
      }

      function _getRowObj(item, line) {
        item.$_top = (line - this.startLine) * this.cellheight + 'px'
        item.$_line = line
        return item
      }
    },
    clearTable() {
      cancelAnimationFrame(this.renderTimer)
      this.activeLine = ''
      this.renderList = []
      this.setContentHeight()
      this.setStartLine(0)
      this.render()
    },
    onVScroll(scrollTop) {
      this.scrollTop = scrollTop
      this.setStartLine(scrollTop)
    },
    onHScroll(scrollLeft) {
      let maxScrollLeft = this.contentWidth - this.wrapWidth
      scrollLeft = scrollLeft < 0 ? 0 : scrollLeft
      scrollLeft = scrollLeft > maxScrollLeft ? maxScrollLeft : scrollLeft
      this.scrollLeft = scrollLeft
    },
    // 滚动滚轮
    onWheel(e) {
      this.scrollDeltaY = e.deltaY
      this.scrollDeltaX = e.deltaX
      this.wheelTime = Date.now()
      this.onHScroll(this.scrollLeft + this.scrollDeltaX)
      this.setStartLine(this.scrollTop + this.scrollDeltaY)
      // if ((this.scrollDeltaY || this.scrollDeltaX) && !this.wheelTask) {
      //   // 滑轮事件太密集，影响渲染性能，使用UI事件列表来控制
      //   this.wheelTask = globalData.scheduler.addUiTask(() => {
      //     if (this.scrollDeltaY) {
      //       this.setStartLine(this.scrollTop + this.scrollDeltaY)
      //       this.scrollDeltaY = 0
      //     } else if (this.scrollDeltaX) {
      //       this.onHScroll(this.scrollLeft + this.scrollDeltaX)
      //       this.scrollDeltaX = 0
      //     } else if (Date.now() - this.wheelTime > 2000) {
      //       globalData.scheduler.removeUiTask(this.wheelTask)
      //       this.wheelTask = null
      //     }
      //   })
      // }
    },
    onClickRow(row) {
      this.activeLine = row.$_line
      this.clickRow?.(row)
    },
  }
};
</script>

<style lang="scss">
.table-wrap {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  overflow: hidden;

  .hidden-columns {
    display: none;
  }

  .row,
  .th-row {
    display: flex;
    position: absolute;
    min-width: 100%;

    .cell,
    .th-cell {
      height: 22px;
      display: flex;
      align-items: center;
      overflow: hidden;
      border-right: 1px solid transparent;
      user-select: none;
      cursor: pointer;

      .label {
        padding: 0 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-grow: 1;
      }

      &:last-child {
        border-right: none;
      }
    }

    .th-cell {
      height: 30px;
      border-right-color: #464646;
    }
  }

  .row {
    &.even {
      .cell {
        background-color: rgba(255, 255, 255, 0.03);
      }
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    &:active,
    &.active {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  .th-row {
    overflow: hidden;
    border-top: 1px solid #464646;
    border-bottom: 1px solid #464646;
  }

  .table-title-wrap {
    position: relative;
    height: 32px;
    overflow: hidden;
  }

  .table-content-wrap {
    flex-grow: 1;
    position: relative;
    overflow: hidden;
  }

  .table-content {
    position: absolute;
    height: 200%;
    width: 100%;
    overflow: hidden;
  }
}
</style>