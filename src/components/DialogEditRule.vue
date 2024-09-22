<template>
  <div v-if="visible">
    <el-dialog
      :title="ruleId?'编辑规则':'新增规则'"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :show-close="false"
      class="dialog-edit-rule"
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
        </el-form-item>
        <el-form-item prop="type" label="行为">
          <div class="border">
            <el-select
              v-model="form.type"
              placeholder="请选择"
              style="width:150px"
              @change="handleChangeType"
            >
              <el-option label="修改请求" :value="RULE_TYPE.REQ"></el-option>
              <el-option label="修改响应" :value="RULE_TYPE.RES"></el-option>
            </el-select>
            <div class="edit-btn" @click="ruleDetailVisible=true">点击编辑</div>
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <span class="btn btn-text" @click="close()">取消</span>
        <span class="btn btn-text" style="margin-right:-8px" @click="handleConfirm()">确定</span>
      </div>
    </el-dialog>
    <DialogRuleDetail
      v-if="ruleDetailVisible"
      :visible.sync="ruleDetailVisible"
      :ruleObj="ruleObj"
      @confirm="handleAddRule"
    />
  </div>
</template>
<script>
import DialogRuleDetail from './DialogRuleDetail.vue'
import { getUUID, RULE_TYPE } from '../common/utils'
export default {
  components: {
    DialogRuleDetail
  },
  props: {
    visible: Boolean,
    ruleId: {
      type: String,
      default: ''
    }
  },
  data() {
    var wayValidator = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('类型不能为空'));
      } else if (this.isConfirm && !this.ruleObj.way) {
        callback(new Error('请编辑规则'));
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
        type: RULE_TYPE.REQ,
      },
      rules: {
        name: [{ required: true, message: '名称不能为空' }],
        url: [{ required: true, message: 'URL不能为空' }],
        type: [{ validator: wayValidator }],
      },
      ruleDetailVisible: false,
      ruleObj: {},
    }
  },
  created() {
    if (this.ruleId) {
      let ruleObj = window.ruleStore.getRuleById(this.ruleId)
      this.originRuleObj = ruleObj
      if (ruleObj) {
        this.form.name = ruleObj.name
        this.form.url = ruleObj.url
        this.form.type = ruleObj.type
        this.form.id = ruleObj.id
        this.ruleObj.way = ruleObj.way
        this.ruleObj.option = ruleObj.option
      }
    }
    this.ruleObj.type = this.form.type
  },
  methods: {
    handleChangeType() {
      if (this.originRuleObj?.type === this.form.type) {
        this.ruleObj.way = this.originRuleObj.way
        this.ruleObj.option = this.originRuleObj.option
      } else {
        this.ruleObj.way = ''
        this.ruleObj.option = null
      }
      this.ruleObj.type = this.form.type
    },
    handleAddRule(ruleObj) {
      this.ruleObj = ruleObj
      this.isConfirm = true
      this.$refs.form.validate(() => { })
      this.isConfirm = false
    },
    handleConfirm() {
      this.isConfirm = true
      this.$refs.form.validate(valid => {
        if (valid) {
          let param = Object.assign({}, this.ruleObj, this.form)
          param.enable = this.originRuleObj ? this.originRuleObj.enable : true
          window.ruleStore.addRule(param)
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
.dialog-edit-rule {
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