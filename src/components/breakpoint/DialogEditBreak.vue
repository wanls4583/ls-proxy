<template>
  <div v-if="visible">
    <el-dialog
      :title="breakId?'编辑断点':'新增断点'"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :show-close="false"
      class="dialog-edit-break"
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
        <el-form-item prop="types" label="断点">
          <el-checkbox-group v-model="form.types">
            <el-checkbox :label="RULE_TYPE.REQ">请求</el-checkbox>
            <el-checkbox :label="RULE_TYPE.RES">响应</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <span class="btn btn-text" @click="close()">取消</span>
        <span class="btn btn-text" style="margin-right:-8px" @click="handleConfirm()">确定</span>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { getUUID, RULE_TYPE } from '../../common/utils'
export default {
  props: {
    visible: Boolean,
    breakId: {
      type: String,
      default: ''
    }
  },
  data() {
    var typeValidator = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('类型不能为空'));
      } else {
        callback();
      }
    }
    return {
      RULE_TYPE,
      form: {
        id: getUUID(),
        name: '',
        url: '',
        types: [RULE_TYPE.REQ, RULE_TYPE.RES],
        enableWildcard: true,
      },
      rules: {
        name: [{ required: true, message: '名称不能为空' }],
        url: [{ required: true, message: 'URL不能为空' }],
        types: [{ validator: typeValidator }],
      },
    }
  },
  created() {
    if (this.breakId) {
      let breakObj = window.breakStore.getBreakById(this.breakId)
      if (breakObj) {
        this.originBreakObj = breakObj
        this.form.name = breakObj.name
        this.form.url = breakObj.url
        this.form.types = breakObj.types
        this.form.id = breakObj.id
        this.form.enableWildcard = breakObj.enableWildcard || false
      }
    }
  },
  methods: {
    handleConfirm() {
      this.isConfirm = true
      this.$refs.form.validate(valid => {
        if (valid) {
          let param = Object.assign({}, this.form)
          param.enable = this.originBreakObj ? this.originBreakObj.enable : true
          window.breakStore.addBreak(param)
          this.$emit('confirm')
          this.close()
        } else {
          return false
        }
      })
      this.isConfirm = false
    },
    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>
<style lang="scss">
.dialog-edit-break {
  .border {
    display: flex;
    align-items: center;
    .el-input__inner {
      border-style: none;
      border-right: 1px solid #464646 !important;
    }
    .edit-btn {
      display: flex;
      flex-grow: 1;
      align-items: center;
      padding: 0 15px;
      color: #999;
      user-select: none;
      cursor: pointer;
    }
  }
}
</style>