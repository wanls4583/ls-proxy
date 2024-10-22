<template>
  <div v-if="visible">
    <el-dialog
      title="规则详情"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :show-close="false"
      class="dialog-rule-detail"
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
        <el-form-item prop="value" label="类型">
          <el-select
            v-model="form.value"
            placeholder="请选择"
            style="width:100%"
            @change="handleValChange"
          >
            <el-option
              v-for="item in methodList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="prop" :label="propLabel" v-if="!isBodyReplace">
          <el-input v-model="form.prop" :disabled="isBodyReplace"></el-input>
          <div v-if="propLabel==='匹配'">
            <el-checkbox v-model="form.icase">忽略大小写</el-checkbox>
            <el-checkbox v-model="form.enableReg">启用正则</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item prop="propVal" :label="valLabel" v-if="!isHeaderDelete">
          <el-input v-model="form.propVal" :type="isBodyReplace?'textarea':'text'" :rows="5"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <span class="btn btn-text" @click="close()">取消</span>
        <span class="btn btn-text" style="margin-right:-8px" @click="confirm()">确定</span>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { RULE_METHOD, ruleMethodList, RULE_TYPE } from '../common/utils'
export default {
  props: {
    visible: Boolean,
    ruleObj: {
      type: Object,
      default: () => { }
    },
  },
  data() {
    var propValidator = (rule, value, callback) => {
      if (value === '') {
        callback(new Error(`${this.propLabel}不能为空`));
      } else {
        callback();
      }
    }
    return {
      form: {
        prop: '',
        propVal: '',
        value: '',
        icase: false,
        enableReg: false,
      },
      rules: {
        prop: [{ required: true, validator: propValidator }],
      },
    }
  },
  computed: {
    methodObj() {
      return ruleMethodList.find(item => item.value === this.form.value) || {}
    },
    propLabel() {
      let label = '匹配'
      if ([RULE_METHOD.MODIFY_PARAM_ADD, RULE_METHOD.MODIFY_HEADER_ADD, RULE_METHOD.MODIFY_HEADER_ADD].includes(this.methodObj.method)) {
        label = '名称'
      }
      return label
    },
    valLabel() {
      let label = '替换'
      if (this.methodObj.method === RULE_METHOD.MODIFY_BODY_MOD) {
        label = this.methodObj.type === RULE_TYPE.REQ ? '替换请求体' : '替换响应体'
      }
      return label
    },
    isBodyModify() {
      return [RULE_METHOD.MODIFY_BODY_MOD, RULE_METHOD.MODIFY_BODY_MOD].includes(this.methodObj.method)
    },
    isBodyReplace() {
      return [RULE_METHOD.MODIFY_BODY_REP, RULE_METHOD.MODIFY_BODY_REP].includes(this.methodObj.method)
    },
    isHeaderDelete() {
      return [RULE_METHOD.MODIFY_PARAM_DEL, RULE_METHOD.MODIFY_HEADER_DEL, RULE_METHOD.MODIFY_HEADER_DEL].includes(this.methodObj.method)
    },
    methodList() {
      return ruleMethodList.filter(item => item.type === this.ruleObj.type)
    }
  },
  created() {
  },
  mounted() {
    this.form.value = ruleMethodList.find(item => item.type === this.ruleObj.type).value
    if (this.ruleObj.method) {
      this.form.value = this.ruleObj.type + '_' + this.ruleObj.method
      this.form.prop = this.ruleObj.key || ''
      if (!this.isHeaderDelete) {
        this.form.propVal = this.ruleObj.value || ''
      }
      this.form.icase = this.ruleObj.icase
      this.form.enableReg = this.ruleObj.enableReg
    }
  },
  methods: {
    handleValChange() {
      if ([RULE_METHOD.MODIFY_HEADER_MOD, RULE_METHOD.MODIFY_HEADER_DEL].includes(this.methodObj.method)) {
        this.form.icase = true
      }
    },
    close() {
      this.$emit('update:visible', false)
    },
    confirm() {
      let param = {}
      this.$refs.form.validate(valid => {
        if (valid) {
          param.key = this.form.prop
          param.value = this.isHeaderDelete ? true : this.form.propVal
          param.icase = this.form.icase
          param.enableReg = this.form.enableReg
          param.methodType = this.methodObj.methodType
          param.method = this.methodObj.method
          param.type = this.ruleObj.type

          this.$emit('confirm', param)
          this.$emit('update:visible', false)
        }
      })
    }
  }
}
</script>
<style lang="scss">
</style>