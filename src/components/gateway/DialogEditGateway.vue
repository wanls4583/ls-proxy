<template>
  <div v-if="visible">
    <el-dialog
      :title="id?'编辑网关':'新增网关'"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :show-close="false"
      class="dialog-edit-gateway"
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
        <el-form-item prop="url" label="URL">
          <el-input v-model="form.url"></el-input>
          <div>
            <el-checkbox v-model="form.enableWildcard">启用 Wildcard</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item prop="method" label="方法">
          <el-select v-model="form.method" placeholder="请选择" style="width:100%">
            <el-option
              v-for="item in GATEWAY_METHODS"
              :key="item.value"
              :label="item.desc"
              :value="item.value"
            ></el-option>
          </el-select>
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
import { GATEWAY_METHODS } from '../../common/const'
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
      GATEWAY_METHODS,
      form: {
        id: getUUID(),
        name: '',
        url: '',
        method: '',
        enableWildcard: true,
      },
      error: '',
      rules: {
        name: [{ required: true, message: '名称不能为空' }],
        url: [{ required: true, message: '域名不能为空' }],
        method: [{ required: true, message: '方法不能为空' }],
      },
    }
  },
  created() {
    if (this.id) {
      let node = window.gatewayStore.getNodeById(this.id)
      if (node) {
        this.originNode = node
        this.form.name = node.name
        this.form.url = node.url
        this.form.method = node.method
        this.form.id = node.id
        this.form.enableWildcard = node.enableWildcard || false
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
          window.gatewayStore.addNode(param)
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
.dialog-edit-gateway {
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