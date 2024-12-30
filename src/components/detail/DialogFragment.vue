<template>
  <div v-if="visible">
    <el-dialog
      title="数据"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :show-close="false"
      class="dialog-fragment-wrap"
      center
    >
      <el-tabs v-model="tab" @tab-click="onTabChagne" style="height:50vh">
        <el-tab-pane label="载体" name="载体">
          <SourceView ref="sourceView" v-show="data.opCode===0x01" />
          <HexView ref="hexView" v-show="data.opCode!==0x01" />
        </el-tab-pane>
        <el-tab-pane label="祯数据" name="祯数据">
          <HexView ref="fragView" />
        </el-tab-pane>
      </el-tabs>
      <div slot="footer" class="dialog-footer">
        <template v-if="tab==='祯数据'">
          <span class="btn btn-text" v-if="fragIndex>0" @click="preFragment">上一祯</span>
          <span
            class="btn btn-text"
            v-if="fragIndex<data.fragmentList.length-1"
            @click="nextFragment"
          >下一祯</span>
        </template>
        <span class="btn btn-text" style="margin-right:-8px" @click="close()">关闭</span>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import HexView from './HexView.vue'
import SourceView from './SourceView.vue'
export default {
  components: {
    HexView,
    SourceView,
  },
  props: {
    visible: Boolean,
    data: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      tab: '载体',
      fragIndex: 0,
    }
  },
  created() {
  },
  mounted() {
    this.$nextTick(() => {
      this.initData()
    })
  },
  methods: {
    initData() {
      if (this.data.opCode === 0x01) {
        this.$refs.sourceView?.render(this.data.fragmentData)
      } else {
        this.$refs.hexView?.render(this.data.fragmentData)
      }
      this.fragIndex = 0
      let fragment = this.data.fragmentList[this.fragIndex]
      fragment && this.$refs.fragView?.render(fragment.fragmentHead.concat(fragment.fragmentData))
    },
    preFragment() {
      let fragment = this.data.fragmentList[--this.fragIndex]
      fragment && this.$refs.fragView?.render(fragment.fragmentHead.concat(fragment.fragmentData))
    },
    nextFragment() {
      let fragment = this.data.fragmentList[++this.fragIndex]
      fragment && this.$refs.fragView?.render(fragment.fragmentHead.concat(fragment.fragmentData))
    },
    onTabChagne(tab) {

    },
    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>
<style lang="scss">
.dialog-fragment-wrap {
  .el-dialog__body {
    padding: 0 !important;
  }
}
</style>