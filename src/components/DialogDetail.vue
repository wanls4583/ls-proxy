<template>
  <div v-show="visible" class="dialog-tetail-wrap">
    <div class="req-detail-wrap">
      <el-tabs v-model="reqTab" @tab-click="onReqTabChagne" style="height:100%">
        <el-tab-pane label="总览" name="总览">
          <OverView :data="data" />
        </el-tab-pane>
        <el-tab-pane label="原始" name="原始"></el-tab-pane>
        <el-tab-pane label="参数" name="参数">
          <ObjectView title="参数头列表" :data="data.params" />
        </el-tab-pane>
        <el-tab-pane label="请求头" name="请求头">
          <ObjectView title="请求头列表" :data="data.reqHeader" />
        </el-tab-pane>
        <el-tab-pane label="请求体" name="请求体"></el-tab-pane>
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
        <el-tab-pane label="原始" name="原始"></el-tab-pane>
        <el-tab-pane label="响应头" name="响应头">
          <ObjectView title="响应头头列表" :data="data.resHeader" />
        </el-tab-pane>
        <el-tab-pane label="响应体" name="响应体">
          <HexView :data="resBody" ref="hex" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>
import OverView from './detail/OverView.vue'
import ObjectView from './detail/ObjectView.vue'
import HexView from './detail/HexView.vue'
export default {
  components: {
    OverView,
    ObjectView,
    HexView,
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
  watch: {
    visible() {
      if (this.visible) {
        this.onReqTabChagne()
        this.onResTabChagne()
      }
    }
  },
  computed: {
    resBody() {
      return this.data.resBody || []
    }
  },
  methods: {
    onReqTabChagne() {

    },
    onResTabChagne() {
      if (this.resTab == '响应体') {
        this.$nextTick(() => {
          this.$refs.hex.render()
        })
      }
    },
    onClose() {
      this.eventBus.$emit('close-detail')
    }
  }
}
</script>