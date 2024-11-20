<template>
  <el-dialog
    title="编辑Part"
    :visible.sync="visible"
    :close-on-click-modal="false"
    :show-close="false"
    :before-close="onClose"
    :append-to-body="true"
    class="dialog-edit-multipart"
    center
    width="60vw"
  >
    <div class="content">
      <el-tabs v-model="tab">
        <el-tab-pane label="头部" name="头部">
          <ObjectView title="头部列表" ref="header" :data="data.header" :editable="true" />
        </el-tab-pane>
        <el-tab-pane label="实体" name="实体">
          <BodyEditor ref="body" :body="data.body" :header="data.header" :hidePart="true" />
        </el-tab-pane>
      </el-tabs>
    </div>
    <div slot="footer" class="dialog-footer">
      <span class="btn btn-text" @click="onClose()">取消</span>
      <span class="btn btn-text" style="margin-right:2px" @click="onConfirm()">确认</span>
    </div>
  </el-dialog>
</template>
<script>
import Empty from './../Empty.vue'
import ObjectView from '../detail/ObjectView.vue'
export default {
  name: 'DialogEditMultpart',
  components: {
    Empty,
    ObjectView,
    BodyEditor: () => import('./BodyEditor.vue'),
  },
  props: {
    visible: Boolean,
    part: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      tab: '头部',
      data: {
        header: {},
        body: null
      }
    }
  },
  watch: {
    visible() {
      this.setData()
    },
    part: {
      handler() {
        this.setData()
      }
    }
  },
  created() {
  },
  methods: {
    setData() {
      if (this.visible) {
        this.data.header = Object.assign({}, this.part.header)
        this.data.body = this.part.body || new Uint8Array([])
      }
    },
    onClose() {
      this.$emit('update:visible', false)
    },
    onConfirm() {
      this.$emit('confirm', {
        header: this.$refs.header.getObject(),
        body: this.$refs.body.getBody()
      })
      this.onClose()
    }
  }
}
</script>
<style lang="scss">
.dialog-edit-multipart {
  .el-dialog {
    padding: 0 !important;
  }
  .el-dialog__body {
    padding: 0 !important;
  }
  .content {
    height: 50vh;
  }
}
</style>