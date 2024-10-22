<template>
  <div v-if="visible">
    <el-dialog
      title="规则列表"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :show-close="false"
      class="dialog-rule-list"
      center
    >
      <div class="bar_wrap">
        <div class="left_wrap">
          <el-checkbox v-model="enableRule" @change="handleEnableRuleChange()">启用重写</el-checkbox>
        </div>
        <div class="right_wrp">
          <i class="icon icon-import hover-icon" style="font-weight:bold;font-size:18px"></i>
          <i
            class="icon icon-plus hover-icon"
            style="font-weight:bold;font-size:20px"
            @click="hanleAddRule"
          ></i>
        </div>
      </div>
      <el-table
        :data="list"
        stripe
        :highlight-current-row="true"
        height="50vh"
        class="scroll-auto"
        style="width:100%"
        @row-dblclick="handleRowCLick"
      >
        <el-table-column prop="checkbox" width="45">
          <!-- eslint-disable-next-line -->
          <template slot="header" slot-scope="scope">
            <el-checkbox v-model="allEnable" @change="handleAllCheckChange"></el-checkbox>
          </template>
          <template slot-scope="scope">
            <el-checkbox v-model="scope.row.enable" @change="handleCheckChange(scope.row)"></el-checkbox>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" width="150"></el-table-column>
        <el-table-column prop="url" label="URL" min-width="200"></el-table-column>
        <el-table-column prop="method" label="行为" width="150">
          <template slot-scope="scope">{{methodDesc(scope.row.type, scope.row.method)}}</template>
        </el-table-column>
        <el-table-column prop="method" label="行为" width="80">
          <div slot-scope="scope" class="flex-center-between op" style="width: 40px">
            <i class="el-icon-edit" @click="hanleEdit(scope.row)"></i>
            <i class="el-icon-delete" @click="hanleDel(scope.row)"></i>
          </div>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <span class="btn btn-text" style="margin-right:-8px" @click="close()">关闭</span>
      </div>
    </el-dialog>
    <DialogEditRule
      :visible.sync="editRuleVisible"
      :ruleId="ruleId"
      v-if="editRuleVisible"
      @confirm="getList"
    />
  </div>
</template>
<script>
import DialogEditRule from './DialogEditRule.vue'
import { ruleMethodList } from '../common/utils'
import { getRuleOnOff, saveRuleOnOff } from '../common/http'
export default {
  components: {
    DialogEditRule
  },
  props: {
    visible: Boolean,
  },
  data() {
    return {
      ruleMethodList,
      list: [],
      ruleId: '',
      enableRule: false,
      allEnable: false,
      editRuleVisible: false
    }
  },
  computed: {
    methodDesc() {
      return (type, method) => {
        return ruleMethodList.find(item => item.type === type && item.method === method).label
      }
    }
  },
  created() {
    this.getList()
    getRuleOnOff().then((res) => {
      this.enableRule = !!res.data
    })
  },
  methods: {
    getList() {
      this.list = window.ruleStore.getRuleList()
      this.setEnableAll()
    },
    setEnableAll() {
      this.allEnable = this.list.length && this.list.filter(item => item.enable).length === this.list.length
    },
    handleCheckChange(row) {
      window.ruleStore.setEnable(row.id, row.enable)
      this.setEnableAll()
    },
    handleAllCheckChange() {
      let enable = this.allEnable
      this.list.forEach(item => {
        item.enable = enable
        this.handleCheckChange(item)
      })
    },
    handleEnableRuleChange() {
      saveRuleOnOff(this.enableRule)
    },
    handleRowCLick(row) {
      this.hanleEdit(row)
    },
    hanleAddRule() {
      this.ruleId = ''
      this.editRuleVisible = true
    },
    hanleEdit(row) {
      this.ruleId = row.id
      this.editRuleVisible = true
    },
    hanleDel(row) {
      this.$confirm(`是否删除【${row.name}】?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        confirmButtonClass: 'btn btn-text',
        cancelButtonClass: 'btn btn-text',
        closeOnClickModal: false,
        type: 'warning'
      }).then(() => {
        window.ruleStore.delRule(row.id)
        this.getList()
      }).catch(() => { })
    },
    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>
<style lang="scss">
.dialog-rule-list {
  .el-dialog {
    width: auto;
    min-width: 600px;
  }
  .el-dialog__body {
    padding: 0 !important;
  }
  .bar_wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #363636;
    padding-bottom: 10px;
    .left_wrap,
    .right_wrp {
      display: flex;
      align-items: center;
    }
  }
  .op {
    i {
      font-size: 14px;
      cursor: pointer;
      &:hover {
        color: #efae22;
      }
      &:active {
        color: #fff;
      }
    }
  }
}
</style>