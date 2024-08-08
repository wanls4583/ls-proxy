<template>
  <div v-show="visible" class="dialog-tetail-wrap">
    <div class="req-detail-wrap">
      <el-tabs v-model="reqTab" @tab-click="onReqTabChagne">
        <el-tab-pane label="总览" name="总览">
          <OverView :data="data" />
        </el-tab-pane>
        <el-tab-pane label="原始" name="原始">
          <SourceView :data="reqData" ref="reqData" id="reqData" />
        </el-tab-pane>
        <el-tab-pane label="参数" name="参数">
          <ObjectView title="参数头列表" :data="data.params" />
        </el-tab-pane>
        <el-tab-pane label="请求头" name="请求头">
          <ObjectView title="请求头列表" :data="data.reqHeader" />
        </el-tab-pane>
        <el-tab-pane label="请求体" name="请求体">
          <HexView :data="reqBody" ref="reqBody" id="reqBody" />
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
          <SourceView :data="resData" ref="resData" id="resData" />
        </el-tab-pane>
        <el-tab-pane label="响应头" name="响应头">
          <ObjectView title="响应头头列表" :data="data.resHeader" />
        </el-tab-pane>
        <el-tab-pane label="响应体" name="响应体">
          <HexView :data="resBody" ref="resBody" id="resBody" />
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
      reqBody: [],
      reqData: [],
      resBody: [],
      resData: [],
    }
  },
  watch: {
    visible() {
      if (this.visible) {
        this.onReqTabChagne()
        this.onResTabChagne()
      }
    },
    data() {
      this.initData()
    }
  },
  created() {
    this.initData()
    this.initMonacoTheme()
  },
  methods: {
    initData() {
      this.reqBody = this.data.reqBody || []
      this.reqData = (this.data.reqHead || []).concat(this.data.reqBody || [])
      this.resBody = this.data.resBody || []
      this.resData = (this.data.resHead || []).concat(this.data.resBody || [])
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
    onReqTabChagne() {
      if (this.reqTab == '请求体') {
        this.$nextTick(() => {
          this.$refs.reqBody.render()
        })
      } else if (this.reqTab == '原始') {
        this.$nextTick(() => {
          this.$refs.reqData.render()
        })
      }
    },
    onResTabChagne() {
      if (this.resTab == '响应体') {
        this.$nextTick(() => {
          this.$refs.resBody.render()
        })
      } else if (this.resTab == '原始') {
        this.$nextTick(() => {
          this.$refs.resData.render()
        })
      }
    },
    onClose() {
      this.eventBus.$emit('close-detail')
    }
  }
}
</script>