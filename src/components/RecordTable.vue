<template>
  <div class="record-table-wrap" style="position: relative; flex-grow: 1">
    <ls-table :data="filterList" :click-row="onClickRow">
      <template v-for="(item, index) in columns">
        <ls-table-column
          :key="index"
          :label="item.label"
          :width="item.width"
          :prop="item.prop"
          :show-prop="item.showProp"
          :cell-style="item.cellStyle"
          :cell-class="item.cellClass"
        ></ls-table-column>
      </template>
    </ls-table>
    <DialogDetail ref="detail" v-if="detailVisible" :visible="detailVisible" :data="detailData" />
  </div>
</template>

<script>
import DialogDetail from './detail/DialogDetail.vue'
import Socket from '../common/socket'
import { mapState } from 'vuex'
import { getDataInfo, getReqDataObj, getResDataObj, getWsDataObj } from '../common/data-utils'
import { getStringFromU8Array, u8To64Uint, u8To32Uint, getUUID } from '../common/utils'
import { getReqHead, getResHead, getReqBody, getResBody, getCert, getWebsocket, clearData } from '../common/http'
import { RULE_TYPE } from '../common/const'
import { STATUS_FAIL_CONNECT, STATUS_FAIL_SSL_CONNECT } from '../common/const'
import { TIME_DNS_START, TIME_CONNECT_START, TIME_REQ_START, TIME_RES_END } from '../common/const'
import {
  MSG_REQ_HEAD,
  MSG_REQ_BODY,
  MSG_RES_HEAD,
  MSG_RES_BODY,
  MSG_WEB_SOCKET,
  MSG_DNS,
  MSG_STATUS,
  MSG_TIME,
  MSG_CIPHER,
  MSG_RULE_BREAK_REQ,
  MSG_RULE_BREAK_RES,
  MSG_RULE_SCRIPT_REQ,
  MSG_RULE_SCRIPT_RES
} from '../common/const'

let dataList = []
let dataIdMap = {}
let rawData = {}
export default {
  components: {
    DialogDetail
  },
  data() {
    return {
      filterList: [],
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
          prop: 'type',
          showProp(dataObj) {
            return dataObj.ext || dataObj.type
          }
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
          label: '大小',
          width: '80px',
          prop: 'size',
          cellStyle: { 'text-align': 'right' }
        },
        {
          label: '时长',
          width: '80px',
          prop: 'duration',
          cellStyle: { 'text-align': 'right' },
          cellClass: ['aequilate-font']
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
      ],
      detailData: {},
      activeId: '',
      detailVisible: false,
    }
  },
  computed: {
    ...mapState(['resType']),
  },
  watch: {
    resType() {
      this.filterList = dataList.filter(item => this.typeFilter(item))
    }
  },
  created() {
    this.init()
  },
  mounted() {
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
              // if (!dataObj.url) {
              //   console.log('eror data:', dataObj)
              // }
              if (!dataIdMap[dataObj.id]) {
                dataIdMap[dataObj.id] = dataObj
                dataObj.lineId = dataObj.id
                dataList.push(dataObj)
                if (this.typeFilter(dataObj)) {
                  this.filterList.push(dataObj)
                }
              }
            })
          }
        }
      })
    },
    typeFilter(dataObj) {
      switch (this.resType) {
        case 'all':
          return true;
        case 'http':
          return dataObj.protocol === 'http:'
        case 'https':
          return dataObj.protocol === 'https:'
        case 'ws':
          return dataObj.protocol === 'ws:'
        case 'wss':
          return dataObj.protocol === 'wss:'
        case 'json':
          return dataObj.type === 'JSON'
        case 'js':
          return dataObj.type === 'JS'
        case 'html':
          return dataObj.type === 'HTML'
        case 'xml':
          return dataObj.type === 'XML'
        case 'txt':
          return dataObj.type === 'TXT'
        case 'image':
          return dataObj.type === 'IMAGE'
        case 'media':
          return ['AUDIO', 'VIDEO'].includes(dataObj.type)
      }
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
      } else if (msgType === MSG_WEB_SOCKET) {
        if (!dataIdMap[dataObj.id]) {
          return null
        }
        this.getWebsocketDataObj(dataObj, u8Array)
      } else {
        if (msgType == MSG_RULE_BREAK_REQ || msgType == MSG_RULE_BREAK_RES) {
          // 断点
          this.getBreakDataObj(dataObj, u8Array, msgType)
        }
        if (msgType == MSG_RULE_SCRIPT_REQ || msgType == MSG_RULE_SCRIPT_RES) {
          // 断点
          this.getScriptDataObj(dataObj, u8Array, msgType)
        }
        return null
      }

      if (this.detailVisible && dataObj.id === this.activeId && msgType !== MSG_WEB_SOCKET) {
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
    getWebsocketDataObj(dataObj, u8Array) {
      getWsDataObj({ dataObj, u8Array })
      if (dataObj.opCode === 0x02) {
        dataObj.size = this.getSize(dataObj.fragmentSize)
      }
      if (dataObj.id === this.activeId) {
        this.eventBus.$emit('show-websocket', dataObj)
      }
    },
    getBreakDataObj(dataObj, u8Array, msgType) {
      dataObj.breakType = msgType == MSG_RULE_BREAK_REQ ? RULE_TYPE.REQ : RULE_TYPE.RES
      if (dataObj.breakType == RULE_TYPE.REQ) {
        getReqDataObj({ dataObj, u8Array, hasBobdy: true })
      } else {
        getResDataObj({ dataObj, u8Array, hasBobdy: true })
      }
      this.eventBus.$emit('show-break-run', dataObj)
    },
    getScriptDataObj(dataObj, u8Array, msgType) {
      dataObj.scriptType = msgType == MSG_RULE_SCRIPT_REQ ? RULE_TYPE.REQ : RULE_TYPE.RES
      if (dataObj.scriptType == RULE_TYPE.REQ) {
        getReqDataObj({ dataObj, u8Array, hasBobdy: true })
      } else {
        getResDataObj({ dataObj, u8Array, hasBobdy: true })
      }
      this.eventBus.$emit('show-script-run', dataObj)
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
    async getReqHeadFromDb(dataObj) {
      let res = await getReqHead(dataObj.id)
      let obj = {}
      if (res.status === 200) {
        obj.reqHead = new Uint8Array(res.data)
        Object.seal(obj.reqHead)
      }
      if (dataObj.id === this.activeId && !rawData.reqHead) {
        rawData.reqHead = obj.reqHead
      }
    },
    async getReqBodyFromDb(dataObj) {
      let res = await getReqBody(dataObj.id)
      let obj = {}
      if (res.status === 200) {
        obj.reqBody = new Uint8Array(res.data)
        Object.seal(obj.reqBody)
      }
      if (dataObj.id === this.activeId && !rawData.reqBody) {
        rawData.reqBody = obj.reqBody
      }
    },
    async getResHeadFromDb(dataObj) {
      let res = await getResHead(dataObj.id)
      let obj = {}
      if (res.status === 200) {
        obj.resHead = new Uint8Array(res.data)
        Object.seal(obj.resHead)
      }
      if (dataObj.id === this.activeId && !rawData.resHead) {
        rawData.resHead = obj.resHead
      }
    },
    async getResBodyFromDb(dataObj) {
      let res = await getResBody(dataObj.id)
      let obj = {}
      if (res.status === 200) {
        obj.resBody = new Uint8Array(res.data)
        Object.seal(obj.resBody)
      }
      if (dataObj.id === this.activeId && !rawData.resBody) {
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
    async getWebsocketFromDb(dataObj) {
      if (dataObj.protocol == 'ws:' || dataObj.protocol == 'wss:') {
        let res = await getWebsocket(dataObj.id)
        if (res.status === 200) {
          let u8Array = new Uint8Array(res.data)
          let messages = []
          while (u8Array.length) {
            let index = 0
            let message = {}
            index = getWsDataObj({ dataObj: message, u8Array, hasBobdy: true })
            u8Array = u8Array.slice(index)
            message.size = this.getSize(message.fragmentSize)
            messages.push(message)
          }
          rawData.wsMessages = messages
        }
      } else {
        rawData.wsMessages = []
      }
    },
    async getDataInfo(dataObj) {
      rawData = { id: dataObj.id }
      await Promise.all([
        this.getReqHeadFromDb(dataObj),
        this.getReqBodyFromDb(dataObj),
        this.getResHeadFromDb(dataObj),
        this.getResBodyFromDb(dataObj),
        this.getCertFromDb(dataObj),
        this.getWebsocketFromDb(dataObj),
      ])
      return rawData
    },
    clearTable() {
      dataList = []
      dataIdMap = {}
      this.filterList = []
      this.activeId = ''
      clearData()
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