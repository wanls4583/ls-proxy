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
        <el-form-item prop="way" label="类型">
          <el-select v-model="form.way" placeholder="请选择" style="width:100%">
            <el-option
              v-for="item in wayList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="prop" :label="propLabel" v-if="!isBodyReplace">
          <el-input v-model="form.prop" :disabled="isBodyReplace"></el-input>
        </el-form-item>
        <el-form-item prop="val" :label="valLabel" v-if="!isHeaderDelete">
          <el-input v-model="form.val" :type="isBodyReplace?'textarea':'text'" :rows="5"></el-input>
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
import { RULE_WAY, ruleWayList } from '../common/utils'
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
        val: '',
        way: '',
      },
      rules: {
        prop: [{ required: true, validator: propValidator }],
      },
    }
  },
  computed: {
    propLabel() {
      let label = '匹配'
      if ([RULE_WAY.MODIFY_REQ_PARAM_ADD, RULE_WAY.MODIFY_REQ_HEADER_ADD, RULE_WAY.MODIFY_RES_HEADER_ADD].includes(this.form.way)) {
        label = '名称'
      }
      return label
    },
    valLabel() {
      let label = '替换'
      if (this.form.way === RULE_WAY.MODIFY_REQ_BODY_MOD) {
        label = '替换请求体'
      }
      if (this.form.way === RULE_WAY.MODIFY_RES_BODY_MOD) {
        label = '替换响应体'
      }
      return label
    },
    isBodyModify() {
      return [RULE_WAY.MODIFY_REQ_BODY_MOD, RULE_WAY.MODIFY_RES_BODY_MOD].includes(this.form.way)
    },
    isBodyReplace() {
      return [RULE_WAY.MODIFY_REQ_BODY_REP, RULE_WAY.MODIFY_RES_BODY_REP].includes(this.form.way)
    },
    isHeaderDelete() {
      return [RULE_WAY.MODIFY_REQ_PARAM_DEL, RULE_WAY.MODIFY_REQ_HEADER_DEL, RULE_WAY.MODIFY_RES_HEADER_DEL].includes(this.form.way)
    },
    wayList() {
      return ruleWayList.filter(item => item.type === this.ruleObj.type)
    }
  },
  created() {
  },
  mounted() {
    this.form.way = ruleWayList.find(item => item.type === this.ruleObj.type).value
    if (this.ruleObj.way) {
      this.form.way = this.ruleObj.way
      if (this.isBodyReplace) {
        this.form.val = this.ruleObj.option.body
      } else {
        let keys = Object.keys(this.ruleObj.option)
        this.form.prop = keys[0] || ''
        if (!this.isHeaderDelete) {
          this.form.val = this.ruleObj.option[keys[0]] || ''
        }
      }
    }
  },
  methods: {
    close() {
      this.$emit('update:visible', false)
    },
    confirm() {
      let param = {}
      let option = {}
      this.$refs.form.validate(valid => {
        if (valid) {
          if (this.isBodyReplace) {
            option.body = this.form.val
          } else {
            option[this.form.prop] = this.isHeaderDelete ? true : this.form.val
          }
          param.option = option
          param.way = this.form.way
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