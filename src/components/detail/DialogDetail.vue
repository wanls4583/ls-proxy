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
        <el-popover width="100" trigger="hover" popper-class="op-list dark" :visible-arrow="true">
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
          <SourceView ref="resHead" />
        </el-tab-pane>
        <el-tab-pane label="响应头" name="响应头">
          <ObjectView title="响应头头列表" :data="data.resHeader" />
        </el-tab-pane>
        <el-tab-pane label="预览" name="预览">
          <SourceView ref="resPreView" :languageId="resLanguageId" :wordWrap="false" />
        </el-tab-pane>
        <el-tab-pane label="响应体" name="响应体">
          <HexView ref="hex" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>
import OverView from './OverView.vue'
import ObjectView from './ObjectView.vue'
import HexView from './HexView.vue'
import SourceView from './SourceView.vue'
import { getDecoededBody } from '../../common/data-utils'
import { getStringFromU8ArrayWithCheck, getU8ArrayFromString } from '../../common/utils'

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
      resLanguageId: '',
    }
  },
  async created() {

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
      let reqBody = await getDecoededBody(this.data?.reqHeader, rawData.reqBody || [])
      if (rawData.reqBody?.length) {
        let text = getStringFromU8ArrayWithCheck(new Uint8Array(reqBody))
        if (text !== false) {
          reqData = reqData.concat(reqBody)
        } else {
          reqData = reqData.concat(Array.from(new TextEncoder().encode(`<binary body>`)))
        }
      }
      this.$refs.reqData.render(reqData)
      this.$refs.reqBody.render(reqBody)
    },
    async initResData(rawData) {
      let resBody = await getDecoededBody(this.data?.resHeader, rawData.resBody || [])
      let resPreView = resBody
      this.resLanguageId = 'plaintext'
      if (rawData.resBody?.length) {
        let text = getStringFromU8ArrayWithCheck(new Uint8Array(resBody))
        if (text !== false) {
          if (this.data.type === 'HTML') {
            this.resLanguageId = 'html'
          } else if (this.data.type === 'CSS') {
            this.resLanguageId = 'css'
          } else if (this.data.type === 'JS') {
            this.resLanguageId = 'javascript'
          } else if (this.data.type === 'XML') {
            this.resLanguageId = 'xml'
          } else if (this.data.type === 'JSON') {
            try {
              text = JSON.stringify(JSON.parse(text), null, 4)
              this.resLanguageId = 'json'
              resPreView = getU8ArrayFromString(text)
            } catch (e) {
              console.log('JSON.parse fail')
            }
          }
        } else {
          resPreView = []
        }
      }
      this.$refs.resHead.render(rawData.resHead || [])
      this.$refs.resPreView.render(resPreView)
      this.$refs.hex.render(resBody)
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