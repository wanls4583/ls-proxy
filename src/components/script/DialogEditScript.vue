<template>
  <div v-if="visible">
    <el-dialog
      :title="scriptId?'编辑脚本':'新增脚本'"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :show-close="false"
      class="dialog-edit-script"
      center
      width="80vw"
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
        <div class="label">
          <span>脚本</span>
          <span class="error" v-if="error">{{error}}</span>
        </div>
        <div style="flex-grow:1;overflow:hidden">
          <SourceView
            ref="source"
            :hide-title="true"
            :read-only="false"
            :error="!!error"
            languageId="javascript"
            style="padding:0"
            @change="onChange"
          />
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <span class="btn btn-text" @click="onClose()">取消</span>
        <span class="btn btn-text" style="margin-right:-8px" @click="onConfirm()">确定</span>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { getUUID, getU8ArrayFromString } from '../../common/utils'
import SourceView from '../detail/SourceView.vue'
export default {
  components: {
    SourceView
  },
  props: {
    visible: Boolean,
    scriptId: {
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
        enableWildcard: true,
      },
      error: '',
      rules: {
        name: [{ required: true, message: '名称不能为空' }],
        url: [{ required: true, message: 'URL不能为空' }],
      },
    }
  },
  created() {
    if (this.scriptId) {
      let scriptObj = window.scriptStore.getScriptById(this.scriptId)
      if (scriptObj) {
        this.originScriptObj = scriptObj
        this.form.name = scriptObj.name
        this.form.url = scriptObj.url
        this.form.script = scriptObj.script
        this.form.id = scriptObj.id
        this.form.enableWildcard = scriptObj.enableWildcard || false
        this.$nextTick(() => {
          this.$refs.source.render(getU8ArrayFromString(this.form.script || ''))
        })
      }
    }
  },
  methods: {
    onConfirm() {
      this.isConfirm = true
      this.form.script = this.$refs.source.getValue()
      if (!this.form.script) {
        this.error = '脚本不能为空'
      }
      this.$refs.form.validate(valid => {
        if (valid) {
          if (!this.form.script) {
            return
          }
          let param = Object.assign({}, this.form)
          param.enable = this.originScriptObj ? this.originScriptObj.enable : true
          window.scriptStore.addScript(param)
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
    onChange() {
      this.error = ''
    }
  }
}
</script>
<style lang="scss">
.dialog-edit-script {
  .el-dialog__body {
    height: calc(100vh - 200px);
    .el-form {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  }
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