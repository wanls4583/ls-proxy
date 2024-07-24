<template>
  <div class="record-table-wrap">
    <div class="th-row" ref="title">
      <div class="th-cell" v-for="(item, index) in columns" :key="index" :style="cellStyle(item)">
        <span class="label">{{ item.label }}</span>
      </div>
    </div>
    <div
      class="table-content-wrap"
      ref="wrap"
      @mouseenter="showScrollBar"
      @mouseleave="hideScrollBar"
      @mousemove="showScrollBar"
      @wheel.stop="onWheel"
    >
      <div
        class="table-content"
        ref="content"
        :style="{ transform: 'translate3d(0,' + _top + ',0)' }"
      >
        <div
          class="row"
          v-for="row in renderList"
          :key="row.lineId"
          :style="{ top: row.top }"
          :class="{ even: row.line % 2 === 0 }"
        >
          <div class="cell" v-for="(item, index) in columns" :key="index" :style="cellStyle(item)">
            <span class="label">{{ row[item.prop] }}</span>
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
import { h } from 'vue'
import { getStringFromU8Array } from '../common/utils'
import HScrollBar from './HScrollBar.vue'
import VScrollBar from './VScrollBar.vue'

const dataList = []
const dataIdMap = {}
export default {
  components: {
    HScrollBar,
    VScrollBar
  },
  data() {
    return {
      columns: [
        {
          label: '类型',
          width: '60px',
          prop: 'type'
        },
        {
          label: 'URL',
          width: '300px',
          prop: 'url'
        },
        {
          label: '方法',
          width: '60px',
          prop: 'method'
        },
        {
          label: '状态码',
          width: '60px',
          prop: 'status'
        },
        {
          label: '服务器IP',
          width: '140px',
          prop: 'ip'
        },
        {
          label: '时长',
          width: '60px',
          prop: 'duration'
        },
        {
          label: '大小',
          width: '60px',
          prop: 'size'
        }
      ],
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
      lineId: 0
    }
  },
  computed: {
    cellStyle() {
      return column => {
        let style = {}
        if (column.width) {
          style['width'] = column.width
          style.flex = `1 1 ${column.width}`
        } else {
          style.flex = `1 1 auto`
        }
        return style
      }
    },
    maxVisibleLines() {
      return Math.ceil(this.wrapHeight / this.cellheight) + 2
    },
    _top() {
      return -(this.scrollTop - this.deltaTop) + 'px'
    }
  },
  watch: {
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
    }
  },
  created() {
    this.init()
    this.initSocket()
  },
  mounted() {
    this.getDomSize()
    this.initResizeEvent()
    this.render()
  },
  beforeDestroy() {
    this.resizeObserver?.unobserve(this.$refs.wrap)
  },
  methods: {
    init() {
      // for (let i = 1; i <= 1000; i++) {
      //   dataList.push({
      //     url: 'https://www.baidu.com/' + i
      //   })
      // }
      this.setContentHeight()
    },
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
    initSocket() {
      this.socket = new WebSocket("ws://localhost:8000");
      this.socket.addEventListener("open", (event) => {
        this.socket.send("Hello Server!");
      });
      this.socket.addEventListener("close", (event) => {
        this.initSocket();
      });
      this.socket.addEventListener("message", (event) => {
        const data = event.data
        if (data instanceof Blob) {
          data.arrayBuffer().then(buffer => {
            let dataObj = this.getDataObj(new Uint8Array(buffer))
            if (!dataIdMap[dataObj.id]) {
              dataIdMap[dataObj.id] = dataObj
              dataList.push(dataObj)
              this.setContentHeight()
            }
            this.render()
          })
        }
      });
    },
    getDataObj(u8Array) {
      let dataObj = {}
      let reqOrRes = u8Array[0] //1:req, 2:res
      dataObj.id = u8Array[8]
      dataObj.id |= u8Array[7] << 1 * 8
      dataObj.id |= u8Array[6] << 2 * 8
      dataObj.id |= u8Array[5] << 3 * 8
      dataObj.id |= u8Array[4] << 4 * 8
      dataObj.id |= u8Array[3] << 5 * 8
      dataObj.id |= u8Array[2] << 6 * 8
      dataObj.id |= u8Array[1] << 7 * 8
      u8Array = u8Array.slice(9)

      if (reqOrRes == 1) {
        this.getReqDataObj(dataObj, u8Array)
      } else {
        if (dataIdMap[dataObj.id]) {
          dataObj = dataIdMap[dataObj.id]
          this.getResDataObj(dataObj, u8Array)
        }
      }

      return dataObj
    },
    getReqDataObj(dataObj, u8Array) {
      let index = u8Array.search([13, 10, 13, 10]) // \r\n\r\n
      let head, body, spaceIndex, lineIndex

      head = u8Array.slice(0, index)
      body = u8Array.slice(index + 4)

      spaceIndex = u8Array.search(32)
      dataObj.method = getStringFromU8Array(head.slice(0, spaceIndex))

      head = head.slice(spaceIndex + 1)
      spaceIndex = head.search(32)
      dataObj.path = getStringFromU8Array(head.slice(0, spaceIndex))

      head = head.slice(spaceIndex + 1)
      lineIndex = head.search([13, 10]) // \r\n
      dataObj.protocol = getStringFromU8Array(head.slice(0, lineIndex))

      head = head.slice(lineIndex + 2)
      dataObj.reqHeader = {}
      this.getHttpHeader(dataObj.reqHeader, head)

      dataObj.status = 'Pending'

      if (dataObj.reqHeader.Host) {
        dataObj.url = dataObj.reqHeader.Host + dataObj.path
      }
    },
    getResDataObj(dataObj, u8Array) {
      let index = u8Array.search([13, 10, 13, 10]) // \r\n\r\n
      let head, body, spaceIndex, lineIndex

      head = u8Array.slice(0, index)
      body = u8Array.slice(index + 4)

      spaceIndex = u8Array.search(32)
      head = head.slice(spaceIndex + 1)
      spaceIndex = head.search(32)
      dataObj.status = getStringFromU8Array(head.slice(0, spaceIndex))

      lineIndex = head.search([13, 10])
      head = head.slice(lineIndex + 2)

      dataObj.resHeader = {}
      this.getHttpHeader(dataObj.resHeader, head)
    },
    getHttpHeader(reqHeader, head) {
      let lineIndex = -1, colonIndex = -1, line, prop, value

      while (head.length) {
        lineIndex = head.search([13, 10])
        if (lineIndex < 0) {
          break
        }
        line = head.slice(0, lineIndex)
        colonIndex = line.search([58, 32]) //': '
        prop = getStringFromU8Array(line.slice(0, colonIndex))
        value = getStringFromU8Array(line.slice(colonIndex + 2))
        reqHeader[prop] = value
        head = head.slice(lineIndex + 2)
      }
    },
    getDomSize() {
      this.wrapHeight = this.$refs.wrap.clientHeight
      this.wrapWidth = this.$refs.wrap.clientWidth
      this.contentWidth = this.$refs.content.scrollWidth
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
        preRenderLineMap[item.line] = index
      })

      for (let i = 0, line = this.startLine; i <= this.maxVisibleLines && line <= dataList.length; i++, line++) {
        lines++
      }

      for (let i = 0, line = this.startLine; i < lines && line <= dataList.length; i++, line++) {
        let index = preRenderLineMap[line]
        if (index > -1 && index < lines) {
          // 尽量保持新的列表和旧的列表相同索引对应的行不变，减少渲染时顶部行的删除操作
          this.renderList[index] = _getRowObj.call(this, dataList[line - 1], line)
        } else {
          toRenderLines.push(line)
        }
      }

      toRenderLines.reverse()

      for (let i = 0; i < lines; i++) {
        if (!this.renderList[i]) {
          let line = toRenderLines.pop()
          this.renderList[i] = _getRowObj.call(this, dataList[line - 1], line)
        }
      }

      function _getRowObj(item, line) {
        let obj = Object.assign({}, item)
        obj.top = (line - this.startLine) * this.cellheight + 'px'
        obj.line = line
        obj.lineId = this.lineId++
        return obj
      }
    },
    setContentHeight() {
      this.contentHeight = dataList.length * this.cellheight
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
      this.wheelEvent = e
      if ((this.scrollDeltaY || this.scrollDeltaX) && !this.wheelTask) {
        // 滑轮事件太密集，影响渲染性能，使用UI事件列表来控制
        this.wheelTask = globalData.scheduler.addUiTask(() => {
          if (this.scrollDeltaY) {
            this.setStartLine(this.scrollTop + this.scrollDeltaY)
            this.scrollDeltaY = 0
          } else if (this.scrollDeltaX) {
            this.onHScroll(this.scrollLeft + this.scrollDeltaX)
            this.scrollDeltaX = 0
          } else if (Date.now() - this.wheelTime > 2000) {
            globalData.scheduler.removeUiTask(this.wheelTask)
            this.wheelTask = null
          }
        })
      }
    }
  }
}
</script>