<template>
  <div v-show="visible" class="dialog-tetail-wrap">
    <div class="req-detail-wrap">
      <el-tabs v-model="reqTab" @tab-click="onReqTabChagne">
        <el-tab-pane label="总览" name="总览">
          <OverView :data="data" />
        </el-tab-pane>
        <el-tab-pane label="原始" name="原始">
          <SourceView ref="reqData" />
        </el-tab-pane>
        <el-tab-pane label="参数" name="参数">
          <ObjectView title="参数头列表" :data="data.params" />
        </el-tab-pane>
        <el-tab-pane label="请求头" name="请求头">
          <ObjectView title="请求头列表" :data="data.reqHeader" />
        </el-tab-pane>
        <el-tab-pane label="请求体" name="请求体">
          <HexView ref="reqBody" />
        </el-tab-pane>
      </el-tabs>
      <div class="op-wrap">
        <el-popover
          width="100"
          trigger="hover"
          popper-class="detail-op-popover dark"
          :visible-arrow="true"
        >
          <div class="op-btn-list">
            <div class="op-btn-item" @click="onClose">关闭</div>
          </div>
          <i class="el-icon-more" slot="reference" style="font-size:16px"></i>
        </el-popover>
      </div>
    </div>
    <div class="res-detail-wrap">
      <el-tabs v-model="resTab" @tab-click="onResTabChagne">
        <el-tab-pane label="原始" name="原始">
          <SourceView ref="resData" />
        </el-tab-pane>
        <el-tab-pane label="响应头" name="响应头">
          <ObjectView title="响应头头列表" :data="data.resHeader" />
        </el-tab-pane>
        <el-tab-pane label="响应体" name="响应体">
          <HexView ref="resBody" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>
import OverView from './detail/OverView.vue'
import ObjectView from './detail/ObjectView.vue'
import HexView from './detail/HexView.vue'
import SourceView from './detail/SourceView.vue'
import * as monaco from 'monaco-editor';
import { getStringFromU8Array } from '../common/utils'

let oldRawData = {}
export default {
  components: {
    OverView,
    ObjectView,
    HexView,
    SourceView,
  },
  props: {
    visible: Boolean,
    data: Object
  },
  data() {
    return {
      reqTab: '总览',
      resTab: '原始',
    }
  },
  async created() {
    this.initMonacoTheme()
  },
  methods: {
    initData(rawData) {
      if (rawData.reqHead !== oldRawData.reqHead || rawData.reqBody !== oldRawData.reqBody) {
        this.initReqData(rawData)
      }
      if (rawData.resHead !== oldRawData.resHead || rawData.resBody !== oldRawData.resBody) {
        this.initResData(rawData)
      }
      oldRawData = rawData
    },
    async initReqData(rawData) {
      let reqData = rawData.reqHead || []
      let reqBody = await this.getDecoededBody(rawData.reqHeader, rawData.reqBody || [])
      if (rawData.reqBody?.length) {
        if (['gzip', 'br', 'deflate'].includes(this.data?.reqHeader?.['Content-Encoding'])) {
          reqData = reqData.concat(Array.from(new TextEncoder().encode(`<${this.data.reqHeader['Content-Encoding']} binary body>`)))
        } else if (!this.getIfText(this.data.reqHeader)) {
          reqData = reqData.concat(Array.from(new TextEncoder().encode(`<binary body>`)))
        } else {
          reqData = reqData.concat(reqBody)
        }
      }
      this.$refs.reqData.render(reqData)
      this.$refs.reqBody.render(reqBody)
    },
    async initResData(rawData) {
      let resData = rawData.resHead || []
      let resBody = await this.getDecoededBody(rawData.resHeader, rawData.resBody || [])
      if (rawData.resBody?.length) {
        if (['gzip', 'br', 'deflate'].includes(this.data?.resHeader?.['Content-Encoding'])) {
          resData = resData.concat(Array.from(new TextEncoder().encode(`<${this.data.resHeader['Content-Encoding']} binary body>`)))
        } else if (!this.getIfText(this.data.resHeader)) {
          resData = resData.concat(Array.from(new TextEncoder().encode(`<binary body>`)))
        } else {
          resData = resData.concat(resBody)
        }
      }
      this.$refs.resData.render(resData)
      this.$refs.resBody.render(resBody)
    },
    initMonacoTheme() {
      let themId = 'myTheme'
      monaco.editor.defineTheme(themId, {
        base: "vs",
        inherit: true,
        rules: [
          { token: 'method-token', foreground: '#E54073' },
          { token: 'protocol-token', foreground: '#74ACE8' },
          { token: 'num-token', foreground: '#C99C6E' },
          { token: 'header-token', foreground: '#A0C180' },
        ],
        colors: {
          "editor.foreground": "#DFDFDF",
          "editor.background": "#2B2B2B",
          "editorCursor.foreground": "#EFAE22",
          "editor.lineHighlightBorder": "#00000000",
          "editor.lineHighlightBackground": "#00000000",
          "editorLineNumber.foreground": "#DFDFDF",
          "editorLineNumber.activeForeground": "#DFDFDF",
          // "editor.selectionBackground": "#EFAE22BB",
          // "editor.inactiveSelectionBackground": "#EFAE22BB",
          "scrollbarSlider.background": "#606060",
          "scrollbarSlider.hoverBackground": "#AEAEAE",
          "scrollbarSlider.activeBackground": "#C3C3C3",
        }
      })
      monaco.editor.setTheme(themId)
    },
    getDecoededBody(header, body) {
      let arr = []
      header = header || {}
      if (header['Transfer-Encoding'] === 'chunked') {
        let index = -1
        while ((index = body.search([13, 10])) > -1) {
          let num = getStringFromU8Array(new Uint8Array(body.slice(0, index)))
          num = parseInt(num, 16)
          if (!num) {
            break
          }
          arr = arr.concat(Array.from(body.slice(index + 2, index + 2 + num)))
          body = body.slice(index + 2 + num + 2)
        }
      } else if (header['Content-Type']?.indexOf('boundary=') > -1) {
        let index = header['Content-Type'].indexOf('boundary=')
        let boundary = header['Content-Type'].slice(index + 'boundary='.length)
        body = body.slice(boundary.length + 2)
        while ((index = body.search(boundary)) > -1) {
          if (getStringFromU8Array(new Uint8Array(body.slice(index + boundary.length, index + boundary.length + 4))) === '--\r\n') {
            break
          }
          arr.push(body.slice(0, index))
          body = body.slice(index + boundary.length + 2)
        }
      } else {
        arr = Array.from(body)
      }
      let encoding = header['Content-Encoding']
      if (window.require && arr.length && ['gzip', 'br', 'deflate'].includes(encoding)) {
        const zlib = window.require('node:zlib')
        return new Promise((resolve) => {
          let decodeFun = null
          arr = new Uint8Array(arr).buffer
          if (encoding === 'gzip') {
            decodeFun = zlib.gunzip
          }
          if (encoding === 'br') {
            decodeFun = zlib.brotliDecompress
          }
          if (encoding === 'deflate') {
            decodeFun = zlib.inflate
          }
          decodeFun(arr, (err, buf) => {
            if (err) {
              return resolve([])
            }
            resolve(Array.from(buf))
          })
        })
      }
      return arr
    },
    getIfText(header) {
      let contentType = header?.['Content-Type'] || ''
      let arr = ['text/', 'json', 'charset=', 'javascript']
      for (let i = 0; i < arr.length; i++) {
        if (contentType.indexOf(arr[i]) > -1) {
          return true
        }
      }
    },
    onReqTabChagne() {
    },
    onResTabChagne() {
    },
    onClose() {
      this.eventBus.$emit('close-detail')
    }
  }
}
</script>