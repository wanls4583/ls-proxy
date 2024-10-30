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
          v-for="row in renderList"
          :key="row.lineId"
          :style="{ top: row.top }"
          :class="{ even: row.line % 2 === 0 , active: activeId === row.id}"
          @click="onClickRow(row)"
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
      <DialogDetail ref="detail" v-if="detailVisible" :visible="detailVisible" :data="detailData" />
    </div>
  </div>
</template>

<script>
import { getStringFromU8Array, u8To64Uint, u8To32Uint, getUUID } from '../common/utils'
import { getDataInfo, getReqDataObj, getResDataObj } from '../common/data-utils'
import Socket from '../common/socket'
import HScrollBar from './HScrollBar.vue'
import VScrollBar from './VScrollBar.vue'
import SvgIcon from './Svg.vue'
import DialogDetail from './detail/DialogDetail.vue'
import { STATUS_FAIL_CONNECT, STATUS_FAIL_SSL_CONNECT } from '../common/utils'
import { TIME_DNS_START, TIME_CONNECT_START, TIME_REQ_START, TIME_RES_END } from '../common/utils'
import { MSG_REQ_HEAD, MSG_REQ_BODY, MSG_REQ_BODY_END, MSG_RES_HEAD, MSG_RES_BODY, MSG_RES_BODY_END, MSG_DNS, MSG_STATUS, MSG_TIME, MSG_CIPHER, MSG_CERT } from '../common/utils'
import { getReqHead, getResHead, getReqBody, getResBody, getCert, clearData } from '../common/http'

let dataList = []
let dataIdMap = {}
let rawData = {}
export default {
  components: {
    HScrollBar,
    VScrollBar,
    SvgIcon,
    DialogDetail
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
      dbChunkSize: 200000,
      maxBodySize: 200000 * 5,
      detailData: {},
      activeId: '',
      detailVisible: false
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
  },
  methods: {
    init() {
      this.initEvent()
      this.initSocket()
      this.clearTable()
    },
    initDB() {
    },
    initEvent() {
      this.eventBus.$on('start-listen', (val) => {
        this.socket.startSocket(val)
      })
      this.eventBus.$on('clear-table', () => {
        this.clearTable()
        this.eventBus.$emit('close-detail')
      })
      this.eventBus.$on('close-detail', () => {
        this.detailData.cert = null
        this.detailData = {}
        this.activeId = ''
        this.detailVisible = false
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
      this.socket = new Socket({
        url: 'ws://localhost:8000/proxy',
        closeCb: event => {
          this.eventBus.$emit('socket-close')
        },
        messageCb: (event) => {
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
        }
      })
    },
    getDataObj(data) {
      let dataObj = {}
      let { msgType, u8Array } = getDataInfo(dataObj, data)

      if (msgType == MSG_REQ_HEAD) {
        // req
        getReqDataObj({ dataObj, u8Array })
      } else if (msgType == MSG_REQ_BODY) {
        // req-body
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        dataObj = dataIdMap[dataObj.id]
        this.getReqBodyDataObj(dataObj, u8Array)
      } else if (msgType == MSG_REQ_BODY_END) {
        // req-body-end
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        dataObj = dataIdMap[dataObj.id]
        this.getReqBodyEndDataObj(dataObj, u8Array)
      } else if (msgType == MSG_RES_HEAD) {
        // res
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        dataObj = dataIdMap[dataObj.id]
        getResDataObj({ dataObj, u8Array })
      } else if (msgType == MSG_RES_BODY) {
        // res-body
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        dataObj = dataIdMap[dataObj.id]
        this.getResBodyDataObj(dataObj, u8Array)
      } else if (msgType == MSG_RES_BODY_END) {
        // res-body-end
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        dataObj = dataIdMap[dataObj.id]
        this.getResBodyEndDataObj(dataObj, u8Array)
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
      } else {
        return null
      }

      if (this.detailVisible && dataObj.id === this.activeId) {
        this.onClickRow(dataObj, true)
      }

      return dataObj
    },
    getReqBodyDataObj(dataObj, u8Array) {
      let sizeBytes = u8Array[0]
      dataObj.reqBodySize = dataObj.reqBodySize || 0
      if (sizeBytes === 8) {
        dataObj.reqBodySize += Number(u8To64Uint(u8Array, 1) + '')
      } else {
        dataObj.reqBodySize += u8To32Uint(u8Array, 1)
      }
    },
    getReqBodyEndDataObj(dataObj) {
    },
    getResBodyDataObj(dataObj, u8Array) {
      let sizeBytes = u8Array[0]
      dataObj.reqBodySize = dataObj.reqBodySize || 0
      if (sizeBytes === 8) {
        dataObj.reqBodySize += Number(u8To64Uint(u8Array, 1) + '')
      } else {
        dataObj.reqBodySize += u8To32Uint(u8Array, 1)
      }
      dataObj.size = this.getSize(dataObj.reqBodySize + '')
    },
    getResBodyEndDataObj(dataObj) {
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
      let time = u8To64Uint(u8Array.slice(1)) + ''
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
    async getReqHeadFromDb(dataObj) {
      let res = await getReqHead(dataObj.id)
      let obj = {}
      if (res.status === 200) {
        obj.reqHead = Array.from(new Uint8Array(res.data))
      }
      if (dataObj.id === this.activeId) {
        rawData.reqHead = obj.reqHead
      }
    },
    async getReqBodyFromDb(dataObj) {
      let res = await getReqBody(dataObj.id)
      let obj = {}
      if (res.status === 200) {
        obj.reqBody = Array.from(new Uint8Array(res.data))
      }
      if (dataObj.id === this.activeId) {
        rawData.reqBody = obj.reqBody
      }
    },
    async getResHeadFromDb(dataObj) {
      let res = await getResHead(dataObj.id)
      let obj = {}
      if (res.status === 200) {
        obj.resHead = Array.from(new Uint8Array(res.data))
      }
      if (dataObj.id === this.activeId) {
        rawData.resHead = obj.resHead
      }
    },
    async getResBodyFromDb(dataObj) {
      let res = await getResBody(dataObj.id)
      let obj = {}
      if (res.status === 200) {
        obj.resBody = Array.from(new Uint8Array(res.data))
      }
      if (dataObj.id === this.activeId) {
        rawData.resBody = obj.resBody
      }
    },
    async getCertFromDb(dataObj) {
      if (dataObj.cert) {
        return
      }
      let res = await getCert(dataObj.id)
      let obj = {}
      if (res.status === 200) {
        obj.pem = getStringFromU8Array(new Uint8Array(res.data))
      }
      if (obj.pem) {
        let index = obj.pem.indexOf('@@@@')
        let infos = obj.pem.slice(index + 4).split('\n');
        let cert = {}
        obj.pem = obj.pem.slice(0, index)
        cert.subject = infos[0]?.replace(/\/([a-zA-Z\d]+\=)/g, '\n$1').slice(1)
        cert.issuer = infos[1]?.replace(/\/([a-zA-Z\d]+\=)/g, '\n$1').slice(1)
        cert.version = infos[2]
        cert.serialNumber = infos[3]
        cert.fingerprint = infos[4]
        cert.validFrom = infos[5]
        cert.validTo = infos[6]
        cert.altName = infos[7]
        dataObj.pem = obj.pem
        dataObj.cert = cert
      }
      // if (obj.pem && window.require) {
      //   const { X509Certificate } = window.require('node:crypto')
      //   const x509 = new X509Certificate(obj.pem)
      //   dataObj.cert = x509
      //   dataObj.pem = obj.pem
      // }
    },
    async getDataInfo(dataObj) {
      rawData = { id: dataObj.id }
      await Promise.all([
        this.getReqHeadFromDb(dataObj),
        this.getReqBodyFromDb(dataObj),
        this.getResHeadFromDb(dataObj),
        this.getResBodyFromDb(dataObj),
        this.getCertFromDb(dataObj)
      ])
      Object.freeze(rawData)
      return rawData
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
        let obj = {}
        this.columns.forEach(propObj => {
          obj[propObj.prop] = item[propObj.prop]
        })
        obj.sockId = item.sockId
        obj.top = (line - this.startLine) * this.cellheight + 'px'
        obj.line = line
        return obj
      }
    },
    clearTable() {
      dataList = []
      dataIdMap = {}
      this.activeId = ''
      this.renderList = []
      this.setContentHeight()
      this.setStartLine(0)
      this.render()
      this.initDB()
      clearData()
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
    async onClickRow(row, refresh) {
      if (this.detailVisible && this.activeId === row.id && !refresh) {
        return
      }
      let infoReqId = getUUID()
      let dataObj = dataList.find(item => item.id === row.id)
      this.infoReqId = infoReqId
      if (!refresh) {
        rawData = { id: row.id }
      }
      this.activeId = row.id
      rawData = await this.getDataInfo(dataObj)
      if (infoReqId !== this.infoReqId || this.activeId !== row.id) {
        return
      }
      if (this.detailData) { // 清除之前数据
        delete this.detailData.pem
        delete this.detailData.cert
      }
      this.detailData = dataObj
      this.detailVisible = true
      this.$nextTick(() => {
        this.eventBus.$emit('refresh-detail-data')
        this.$refs.detail.initData(rawData)
      })
    },
  }
}
</script>