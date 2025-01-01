<template>
  <div v-show="visible" class="dialog-tetail-wrap">
    <div class="req-detail-wrap">
      <el-tabs v-model="reqTab" @tab-click="onReqTabChagne">
        <el-tab-pane label="总览" name="总览">
          <OverView :data="data" />
        </el-tab-pane>
        <el-tab-pane label="标头" name="标头">
          <SourceView ref="reqHead" />
        </el-tab-pane>
        <el-tab-pane label="请求头" name="请求头">
          <ObjectView title="请求头列表" :data="data.reqHeader" />
        </el-tab-pane>
        <el-tab-pane label="参数" name="参数">
          <ObjectView title="参数头列表" :data="data.params" />
        </el-tab-pane>
        <el-tab-pane :label="reqLabel" name="预览" v-if="hasReqPreView">
          <SourceView v-show="hasReqPreView" ref="reqPreView" :languageId="reqLanguageId" />
        </el-tab-pane>
        <el-tab-pane label="请求体" name="请求体">
          <HexView ref="reqHex" />
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
        <el-tab-pane label="标头" name="标头">
          <SourceView ref="resHead" />
        </el-tab-pane>
        <el-tab-pane label="响应头" name="响应头">
          <ObjectView title="响应头头列表" :data="data.resHeader" />
        </el-tab-pane>
        <el-tab-pane :label="resLable" name="预览">
          <div v-if="resImgUrl" class="img-wrap">
            <img :src="resImgUrl" />
          </div>
          <div v-else-if="resVideoUrl" class="video-wrap">
            <video ref="resVideo" controls>
              <source :src="resVideoUrl" type="video/mp4" />
            </video>
          </div>
          <WebsocketView
            v-else-if="data.protocol === 'ws:' || data.protocol === 'wss:'"
            ref="wsView"
          />
          <SourceView v-show="resPreViewVisible" ref="resPreView" :languageId="resLanguageId" />
        </el-tab-pane>
        <el-tab-pane label="响应体" name="响应体">
          <HexView ref="resHex" />
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
import WebsocketView from './WebsocketView.vue'
import { getDecoededBody } from '../../common/data-utils'
import { getStringFromU8ArrayWithCheck, getU8ArrayFromString } from '../../common/utils'

let oldRawData = {}
export default {
  components: {
    OverView,
    ObjectView,
    HexView,
    SourceView,
    WebsocketView,
  },
  props: {
    visible: Boolean,
    data: Object
  },
  data() {
    return {
      reqTab: '总览',
      resTab: '标头',
      resLanguageId: '',
      reqLanguageId: '',
      resImgUrl: '',
      resVideoUrl: '',
      hasReqPreView: false,
      hasResPreView: false,
    }
  },
  computed: {
    reqLabel() {
      return this.reqLanguageId?.toUpperCase() || '预览'
    },
    resLable() {
      if (this.data.protocol === 'ws:' || this.data.protocol === 'wss:') {
        return 'Webscoket'
      }
      return this.resImgUrl ? '图片' : (this.resVideoUrl ? '视频' : '预览')
    },
    resPreViewVisible() {
      return this.hasResPreView &&
        !this.resImgUrl &&
        !this.resVideoUrl &&
        !(this.data.protocol === 'ws:' || this.data.protocol === 'wss:')
    }
  },
  async created() {

  },
  methods: {
    initData(rawData) {
      this.resImgUrl = ''
      this.resVideoUrl = ''
      if (rawData.reqHead !== oldRawData.reqHead || rawData.reqBody !== oldRawData.reqBody) {
        this.initReqData(rawData)
      }
      if (rawData.resHead !== oldRawData.resHead || rawData.resBody !== oldRawData.resBody) {
        this.initResData(rawData)
      }
      this.initWsData(rawData)
      oldRawData = rawData
    },
    async initReqData(rawData) {
      let reqBody = await getDecoededBody(this.data?.reqHeader, rawData.reqBody || new Uint8Array())
      let reqPreView = reqBody
      this.reqLanguageId = 'plaintext'
      if (rawData.reqBody?.length) {
        let text = getStringFromU8ArrayWithCheck(reqBody)
        if (text !== false) {
          if (this.data.reqType === 'JSON') {
            try {
              reqPreView = []
              text = JSON.stringify(JSON.parse(text), null, 4)
              this.reqLanguageId = 'json'
              reqPreView = getU8ArrayFromString(text)
            } catch (e) {
              console.log('JSON.parse fail')
            }
          }
        } else {
          reqPreView = []
        }
      }
      this.hasReqPreView = reqPreView.length > 0
      this.$refs.reqPreView?.render(reqPreView)
      this.$refs.reqHead.render(rawData.reqHead || new Uint8Array())
      this.$refs.reqHex.render(reqBody)
    },
    async initResData(rawData) {
      let resBody = await getDecoededBody(this.data?.resHeader, rawData.resBody || new Uint8Array())
      let resPreView = resBody
      this.resLanguageId = 'plaintext'
      this.resImgUrl = ''
      this.resVideoUrl = ''
      if (rawData.resBody?.length) {
        let text = getStringFromU8ArrayWithCheck(resBody)
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
              resPreView = []
              text = JSON.stringify(JSON.parse(text), null, 4)
              this.resLanguageId = 'json'
              resPreView = getU8ArrayFromString(text)
            } catch (e) {
              console.log('JSON.parse fail')
            }
          }
        } else {
          resPreView = []
          this.$nextTick(() => {
            if (this.data.resHeader['Content-Type']?.startsWith('image/')) {
              this.resImgUrl = URL.createObjectURL(new Blob([resBody], { type: this.data.resHeader['Content-Type'] }))
            }
            if (this.data.resHeader['Content-Type']?.startsWith('video/')) {
              this.resVideoUrl = URL.createObjectURL(new Blob([resBody], { type: this.data.resHeader['Content-Type'] }))
            }
          })
        }
      }
      this.hasResPreView = resPreView.length > 0
      this.$refs.resPreView.render(resPreView)
      this.$refs.resHead.render(rawData.resHead || new Uint8Array())
      this.$refs.resHex.render(resBody)
    },
    initWsData(rawData) {
      if (this.data.protocol === 'ws:' || this.data.protocol === 'wss:') {
        this.$nextTick(() => {
          this.$refs.wsView && this.$refs.wsView.initData(rawData.wsMessages)
        })
      }
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
      if (this.$refs.resVideo && this.resTab !== '预览') {
        this.$refs.resVideo.pause()
      }
    },
    onClose() {
      this.eventBus.$emit('close-detail')
    }
  }
}
</script>