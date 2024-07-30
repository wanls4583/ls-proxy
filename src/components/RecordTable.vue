<template>
  <div class="record-table-wrap">
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
          <div
            class="cell"
            v-for="(item, index) in columns"
            :key="index"
            :style="cellStyle(item)"
            :class="item.cellClass"
          >
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
import { getStringFromU8Array, u8To64Uint, u8To32Uint, u8To16Uint } from '../common/utils'
import HScrollBar from './HScrollBar.vue'
import VScrollBar from './VScrollBar.vue'

const [MSG_REQ, MSG_RES, MSG_DNS, MSG_STATUS, MSG_TIME, MSG_CIPHER, MSG_CERT, MSG_PORT] = [1, 2, 3, 4, 5, 6, 7, 8]
const [STATUS_FAIL_CONNECT, STATUS_FAIL_SSL_CONNECT] = [1, 2]
const [
  TIME_DNS_START,
  TIME_DNS_END,
  TIME_CONNECT_START,
  TIME_CONNECT_END,
  TIME_CONNECT_SSL_START,
  TIME_CONNECT_SSL_END,
  TIME_REQ_START,
  TIME_REQ_END,
  TIME_RES_START,
  TIME_RES_END
] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

let dataList = []
let dataIdMap = {}
let dataPortMap = {}
let dataPortingMap = {}
export default {
  components: {
    HScrollBar,
    VScrollBar
  },
  data() {
    return {
      columns: [
        {
          label: 'ID',
          width: '60px',
          prop: 'id',
          cellClass: ['aequilate-font']
        },
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
          label: '应用程序',
          width: '140px',
          prop: 'processName'
        },
        {
          label: '服务器IP',
          width: '140px',
          prop: 'ip',
          cellClass: ['aequilate-font']
        },
        {
          label: '时长',
          width: '80px',
          prop: 'duration',
          style: { 'text-align': 'right' },
          cellClass: ['aequilate-font']
        },
        {
          label: '大小',
          width: '80px',
          prop: 'size',
          style: { 'text-align': 'right' }
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
      processing: false
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
        column.style && Object.assign(style, column.style)
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
  },
  mounted() {
    this.getDomSize()
    this.initResizeEvent()
    this.render()
  },
  beforeDestroy() {
    this.resizeObserver?.unobserve(this.$refs.wrap)
    clearTimeout(this.initSocketTimer)
  },
  methods: {
    init() {
      this.initDB()
      this.initEvent()
      this.clearTable()
    },
    initDB() {
      if (window.require) {
        const Nedb = window.require('nedb')
        const path = window.require('path')
        const { app } = window.require('@electron/remote')
        const filename = path.join(app.getAppPath(), 'electron/nedb.db')
        this.nedb = new Nedb({ filename: filename })
        this.nedb.loadDatabase()
      }
    },
    initEvent() {
      this.eventBus.$on('start-listen', (val) => {
        this.startSocket(val)
      })
      this.eventBus.$on('clear-table', () => {
        this.clearTable()
      })
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
      clearTimeout(this.initSocketTimer)
      clearTimeout(this.pingTimer)
      this.socket = new WebSocket('ws://localhost:8000')
      this.socket.addEventListener('open', event => {
        this.socketState = 'open'
        this.socket.send('start')
      })
      this.socket.addEventListener('close', event => {
        this.socketState = 'close'
        clearTimeout(this.pingTimer)
        console.log('scoket close:', event)
        if (this.processing) {
          clearTimeout(this.initSocketTimer)
          this.initSocketTimer = setTimeout(() => {
            this.initSocket()
          }, 1000)
        }
      })
      this.socket.addEventListener('error', event => {
        this.socketState = 'close'
        this.startSocket(false)
        this.eventBus.$emit('socket-close')
        console.log('scoket err:', event)
      })
      this.socket.addEventListener('message', event => {
        const data = event.data
        if (data instanceof Blob) {
          data.arrayBuffer().then(buffer => {
            let dataObj = this.getDataObj(new Uint8Array(buffer))
            if (!dataObj) {
              return
            }
            if (!dataObj.url) {
              console.log('eror data:', dataObj)
            }
            if (!dataIdMap[dataObj.id]) {
              dataIdMap[dataObj.id] = dataObj
              dataObj.lineId = dataObj.id
              dataList.push(dataObj)
              this.setContentHeight()
            }
            this.render()
          })
        }

        clearTimeout(this.pingTimer)
        this.pingTimer = setTimeout(() => {
          if (this.processing && this.socketState == 'open') {
            this.socket.send('ping')
          }
        }, 5000) // 5秒检测一次心跳
      })
    },
    getDataObj(u8Array) {
      let dataObj = {}
      let msgType = u8Array[0]

      if (msgType > MSG_PORT) {
        return
      }

      dataObj.u8Array = u8Array
      dataObj.id = u8To64Uint(u8Array.slice(1)) + ''
      dataObj.sockId = u8To64Uint(u8Array.slice(9)) + ''

      let index = 17
      if (msgType == MSG_REQ) {
        switch (u8Array[index++]) {
          case 1:
            dataObj.protocol = 'http:'
            break
          case 2:
            dataObj.protocol = 'https:'
            break
          case 3:
            dataObj.protocol = 'ws:'
            break
          case 4:
            dataObj.protocol = 'wss:'
            break
        }
        dataObj.pid = u8To32Uint(u8Array.slice(index, index + 4)) // 代理服务器进程号
        index += 4
        dataObj.port = u8To16Uint(u8Array.slice(index, index + 2)) // 客户端端口号
        index += 2
        this.getClientPath(dataObj)
      }
      u8Array = u8Array.slice(index)

      if (msgType == MSG_REQ) {
        // req
        this.getReqDataObj(dataObj, u8Array)
      } else if (msgType == MSG_RES) {
        // res
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        dataObj = dataIdMap[dataObj.id]
        this.getResDataObj(dataObj, u8Array)
      } else if (msgType == MSG_DNS) {
        // ip
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        dataObj = dataIdMap[dataObj.id]
        this.getIpDataObj(dataObj, u8Array)
      } else if (msgType == MSG_STATUS) {
        // status
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        dataObj = dataIdMap[dataObj.id]
        this.getStatusDataObj(dataObj, u8Array)
      } else if (msgType == MSG_TIME) {
        // duration
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        dataObj = dataIdMap[dataObj.id]
        this.getTimeDataObj(dataObj, u8Array)
      } else if (msgType == MSG_CIPHER) {
        // cipher
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        dataObj = dataIdMap[dataObj.id]
        this.getCipherDataObj(dataObj, u8Array)
      } else if (msgType == MSG_CERT) {
        // cert
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        dataObj = dataIdMap[dataObj.id]
        this.getCertDataObj(dataObj, u8Array)
      } else if (msgType == MSG_PORT) {
        this.getPortDataObj(dataObj, u8Array)
        return null
      }

      return dataObj
    },
    getReqDataObj(dataObj, u8Array) {
      let index = u8Array.search([13, 10, 13, 10]) // \r\n\r\n
      let head, body, spaceIndex, lineIndex

      head = u8Array.slice(0, index)
      body = u8Array.slice(index + 4)
      if (this.nedb) {
        this.nedb.insert({ id: dataObj.id, reqHead: Array.from(head), reqBody: Array.from(body) }, (err, doc) => {
          // console.log(err, doc)
        })
      }
      dataObj.size = '0 B'

      spaceIndex = u8Array.search(32)
      dataObj.method = getStringFromU8Array(head.slice(0, spaceIndex))

      head = head.slice(spaceIndex + 1)
      spaceIndex = head.search(32)
      dataObj.path = getStringFromU8Array(head.slice(0, spaceIndex))

      head = head.slice(spaceIndex + 1)
      lineIndex = head.search([13, 10]) // \r\n
      dataObj.version = getStringFromU8Array(head.slice(0, lineIndex))

      head = head.slice(lineIndex + 2)
      dataObj.reqHeader = {}
      this.getHttpHeader(dataObj.reqHeader, head)

      dataObj.status = 'Pending'

      if (dataObj.reqHeader.Host) {
        dataObj.url = dataObj.protocol + '//' + dataObj.reqHeader.Host + dataObj.path
      }
    },
    getResDataObj(dataObj, u8Array) {
      let index = u8Array.search([13, 10, 13, 10]) // \r\n\r\n
      let head, body, spaceIndex, lineIndex

      head = u8Array.slice(0, index)
      body = u8Array.slice(index + 4)
      if (this.nedb) {
        this.nedb.update({ id: dataObj.id }, { $set: { resHead: Array.from(head), resBody: Array.from(body) } }, {}, (err, doc) => {
          // console.log(err, doc)
        })
      }
      dataObj.size = this.getSize(u8Array.length)

      spaceIndex = u8Array.search(32)
      head = head.slice(spaceIndex + 1)
      spaceIndex = head.search(32)
      dataObj.status = getStringFromU8Array(head.slice(0, spaceIndex))

      lineIndex = head.search([13, 10])
      head = head.slice(lineIndex + 2)

      dataObj.resHeader = {}
      this.getHttpHeader(dataObj.resHeader, head)
    },
    getIpDataObj(dataObj, u8Array) {
      dataObj.ip = getStringFromU8Array(u8Array)
    },
    getStatusDataObj(dataObj, u8Array) {
      if (u8Array[0] == STATUS_FAIL_CONNECT || u8Array[0] == STATUS_FAIL_SSL_CONNECT) {
        dataObj.status = 'fail'
      }
    },
    getTimeDataObj(dataObj, u8Array) {
      let timeType = u8Array[0]
      let time = u8To64Uint(u8Array.slice(1))
      dataObj.times = dataObj.times || {}
      dataObj.times[timeType] = time
      // console.log(dataObj.id + ':', timeType, time, u8Array.slice(1).toString())

      if (timeType === TIME_RES_END) {
        let startTime = 0n
        if (dataObj.times[TIME_DNS_START]) {
          startTime = dataObj.times[TIME_DNS_START]
        } else if (dataObj.times[TIME_CONNECT_START]) {
          startTime = dataObj.times[TIME_CONNECT_START]
        } else if (dataObj.times[TIME_REQ_START]) {
          startTime = dataObj.times[TIME_REQ_START]
        } else {
          console.log('time fail:', dataObj.id, dataObj)
        }
        if (startTime && time - startTime > 0) {
          dataObj.duration = this.getTImeDisplay(time - startTime)
        } else {
          console.log('time fail:', dataObj.id, dataObj)
        }
      }
    },
    getCipherDataObj(dataObj, u8Array) {
      let list = getStringFromU8Array(u8Array)
      if (list.length) {
        list = list.split(';')
        dataObj.tlsVersion = list[0]
        dataObj.cipher = list[1]
        dataObj.cipherList = list.slice(2)
      }
    },
    getCertDataObj(dataObj, u8Array) {
      if (window.require) {
        // const { X509Certificate } = window.require('node:crypto')
        // const pem = getStringFromU8Array(u8Array)
        // try {
        //   const x509 = new X509Certificate(pem)
        //   console.log(x509)
        // } catch (e) {
        //   console.err(e)
        // }
      }
      if (this.nedb) {
        this.nedb.update({ id: dataObj.id }, { $set: { cert: Array.from(u8Array) } }, {})
      }
    },
    getPortDataObj(dataObj, u8Array) {
      dataObj.port = u8To16Uint(u8Array) // 客户端端口号
      this.getClientPath(dataObj)
    },
    getTImeDisplay(duration) {
      const H = 60 * 60 * 1000
      const M = 60 * 1000
      const S = 1000
      let result = '',
        unit = ''
      duration = duration + '' // BigInt转换成字符串
      duration = Math.floor(duration / 1000) // 毫秒
      if (duration >= H) {
        result = (duration / H).toFixed(2)
        unit = 'h'
      } else if (duration > M) {
        result = (duration / M).toFixed(2)
        unit = 'min'
      } else if (duration > S) {
        result = (duration / S).toFixed(2)
        unit = 's'
      } else {
        result = duration + ''
        unit = 'ms'
      }
      result = result.replace(/\.00$/, '') + ' ' + unit
      return result
    },
    getHttpHeader(reqHeader, head) {
      let lineIndex = -1,
        colonIndex = -1,
        line,
        prop,
        value

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
    getClientPath(dataObj) {
      // 获取客户端程路径
      let cacheObj = dataPortMap[dataObj.sockId]
      if (cacheObj) {
        dataObj.processName = cacheObj.processName
        dataObj.processPath = cacheObj.processPath
        return
      }
      if (dataPortingMap[dataObj.sockId]) {
        dataPortingMap[dataObj.sockId].push(dataObj)
        return
      }
      if (window.require) {
        const findProcess = window.require('find-process')
        dataPortingMap[dataObj.sockId] = [dataObj]
        // console.log('port:', dataObj.port)
        findProcess(dataObj.pid ? 'pid' : 'port', dataObj.pid || dataObj.port).then(
          function (list) {
            if (list.length) {
              dataPortingMap[dataObj.sockId].forEach(obj => {
                obj.processName = list[0].name
                obj.processPath = list[0].bin
              })
              delete dataPortingMap[dataObj.sockId]

              dataPortMap[dataObj.sockId] = { processName: dataObj.processName, processPath: dataObj.processPath }
              setTimeout(() => {
                delete dataPortMap[dataObj.sockId]
              }, 5000)
            } else {
              // console.log('port-result:null:', dataObj.pid, dataObj.port)
            }
          },
          function (err) {
            console.log('find-process-err:', err.stack || err, ':', dataObj.pid, dataObj.port)
          }
        )
      }
    },
    getSize(size) {
      const G = 1024 * 1024 * 1024
      const M = 1024 * 1024
      const K = 1024
      let result = '',
        unit = ''
      if (size >= G) {
        result = (size / G).toFixed(1)
        unit = 'GB'
      } else if (size > M) {
        result = (size / M).toFixed(1)
        unit = 'MB'
      } else if (size > K) {
        result = (size / K).toFixed(1)
        unit = 'KB'
      } else {
        result = size + ''
        unit = 'B'
      }
      result = result.replace(/\.0$/, '') + ' ' + unit
      return result
    },
    getDomSize() {
      this.wrapHeight = this.$refs.wrap.clientHeight
      this.wrapWidth = this.$refs.wrap.clientWidth
      this.contentWidth = this.$refs.title.scrollWidth
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
        return obj
      }
    },
    clearTable() {
      dataList = []
      dataIdMap = {}
      this.renderList = []
      this.nedb && this.nedb.remove({}, { multi: true })
      this.setContentHeight()
      this.setStartLine(0)
      this.render()
    },
    startSocket(flag) {
      this.processing = flag
      if (flag) {
        this.initSocket()
      } else if (this.socketState == 'open') {
        clearTimeout(this.initSocketTimer)
        clearTimeout(this.pingTimer)
        this.socket.close()
      }
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
    }
  }
}
</script>