<template>
  <div v-if="visible">
    <el-dialog
      :title="id?'编辑镜像':'新增镜像'"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :show-close="false"
      class="dialog-edit-mirror"
      center
    >
      <el-form
        label-position="top"
        label-width="80px"
        ref="form"
        :model="form"
        :rules="rules"
        size="medium"
      >
        <el-form-item prop="name" label="名称">
          <el-input v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item prop="url" label="域名">
          <el-input v-model="form.url"></el-input>
          <div>
            <el-checkbox v-model="form.enableWildcard">启用 Wildcard</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item prop="host" label="镜像">
          <el-input v-model="form.host"></el-input>
          <div>
            <el-checkbox v-model="form.changeHostHeader">更改 Host 首部</el-checkbox>
            <el-checkbox v-model="form.changeRefererHeader">更改 Referer 首部</el-checkbox>
            <el-checkbox v-model="form.changeOriginHeader">更改 Origin 首部</el-checkbox>
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <span class="btn btn-text" @click="onClose()">取消</span>
        <span class="btn btn-text" style="margin-right:-8px" @click="onConfirm()">确定</span>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { getUUID } from '../../common/utils'
export default {
  props: {
    visible: Boolean,
    id: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      form: {
        id: getUUID(),
        name: '',
        url: '',
        host: '',
        enableWildcard: true,
        changeHostHeader: true,
        changeRefererHeader: true,
        changeOriginHeader: true,
      },
      error: '',
      rules: {
        name: [{ required: true, message: '名称不能为空' }],
        url: [{ required: true, message: '域名不能为空' }],
        host: [{ required: true, message: '镜像不能为空' }],
      },
    }
  },
  created() {
    if (this.id) {
      let node = window.mirrorStore.getNodeById(this.id)
      if (node) {
        this.originNode = node
        this.form.name = node.name
        this.form.url = node.url
        this.form.host = node.host
        this.form.id = node.id
        this.form.enableWildcard = node.enableWildcard || false
        this.form.changeHostHeader = node.changeHostHeader || false
        this.form.changeRefererHeader = node.changeRefererHeader || false
        this.form.changeOriginHeader = node.changeOriginHeader || false
      }
    }
  },
  methods: {
    onConfirm() {
      this.isConfirm = true
      this.$refs.form.validate(valid => {
        if (valid) {
          let param = Object.assign({}, this.form)
          param.enable = this.originNode ? this.originNode.enable : true
          window.mirrorStore.addNode(param)
          this.$emit('confirm')
          this.onClose()
        } else {
          return false
        }
      })
      this.isConfirm = false
    },
    onClose() {
      this.$emit('update:visible', false)
    },
  }
}
</script>
<style lang="scss">
.dialog-edit-mirror {
  .label {
    display: flex;
    justify-content: space-between;
    line-height: 30px;
    color: #999;
  }
  .error {
    font-size: 12px;
    color: #f56c6c;
  }
}
</style>