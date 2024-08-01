<template>
  <div
    v-if="visible"
    class="dialog-tetail-wrap"
    @mouseenter.stop
    @mouseleave.stop
    @mousemove.stop
    @wheel.stop
  >
    <div class="req-detail-wrap">
      <el-tabs v-model="reqTab" @tab-click="onReqTabChagne" style="height:100%">
        <el-tab-pane label="总览" name="总览">
          <OverView :data="data" />
        </el-tab-pane>
        <el-tab-pane label="原始" name="原始"></el-tab-pane>
        <el-tab-pane label="请求头" name="请求头"></el-tab-pane>
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
        <el-tab-pane label="响应头" name="响应头"></el-tab-pane>
        <el-tab-pane label="响应体" name="响应体"></el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>
import OverView from './detail/OverView.vue'
export default {
  components: {
    OverView
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
  methods: {
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