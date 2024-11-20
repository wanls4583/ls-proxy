<template>
  <div v-if="visible">
    <el-dialog
      title="断点列表"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :show-close="false"
      class="dialog-break-list"
      center
    >
      <div class="bar_wrap">
        <div class="left_wrap">
          <el-checkbox v-model="enableBreak" @change="handleEnableChange()">启用断点</el-checkbox>
          <el-checkbox v-model="autoPopBreak" @change="handleAutoPopChange()">自动弹出</el-checkbox>
        </div>
        <div class="right_wrp">
          <i class="icon icon-import hover-icon" style="font-weight:bold;font-size:18px"></i>
          <i
            class="icon icon-plus hover-icon"
            style="font-weight:bold;font-size:20px"
            @click="hanleAddBreak"
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
        <el-table-column prop="types" label="中断" width="160">
          <template slot-scope="scope">
            <el-checkbox-group
              v-model="scope.row.types"
              @change="handleChangeType(scope.row)"
              style="display:flex"
            >
              <el-checkbox :label="RULE_TYPE.REQ">请求</el-checkbox>
              <el-checkbox :label="RULE_TYPE.RES">响应</el-checkbox>
            </el-checkbox-group>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="操作" width="80">
          <div slot-scope="scope" class="flex-center-between op" style="width: 50px">
            <i class="el-icon-edit" @click="hanleEdit(scope.row)"></i>
            <i class="el-icon-delete" @click="hanleDel(scope.row)"></i>
          </div>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <span class="btn btn-text" style="margin-right:-8px" @click="close()">关闭</span>
      </div>
    </el-dialog>
    <DialogEditBreak
      :visible.sync="editBreakVisible"
      :breakId="breakId"
      v-if="editBreakVisible"
      @confirm="getList"
    />
  </div>
</template>
<script>
import { mapMutations } from 'vuex'
import DialogEditBreak from './DialogEditBreak.vue'
import { RULE_TYPE } from '../../common/const'
import { saveBreakOnOff } from '../../common/http'
export default {
  components: {
    DialogEditBreak
  },
  props: {
    visible: Boolean,
  },
  data() {
    return {
      RULE_TYPE,
      list: [],
      breakId: '',
      enableBreak: false,
      autoPopBreak: false,
      allEnable: false,
      editBreakVisible: false
    }
  },
  created() {
    this.enableBreak = this.$store.state.enableBreak
    this.autoPopBreak = this.$store.state.autoPopBreak
    this.getList()
  },
  methods: {
    ...mapMutations(['changeBreakEnable', 'changeAutoPopBreak']),
    getList() {
      this.list = window.breakStore.getBreakList()
      this.setEnableAll()
    },
    setEnableAll() {
      this.allEnable = this.list.length && this.list.filter(item => item.enable).length === this.list.length
    },
    handleCheckChange(row) {
      window.breakStore.setEnable(row.id, row.enable)
      this.setEnableAll()
    },
    handleAllCheckChange() {
      let enable = this.allEnable
      this.list.forEach(item => {
        item.enable = enable
        this.handleCheckChange(item)
      })
    },
    async handleEnableChange() {
      let enableBreak = this.enableBreak
      let res = await saveBreakOnOff(enableBreak)
      if (res.status === 200) {
        this.changeBreakEnable(enableBreak)
      }
    },
    handleAutoPopChange() {
      this.changeAutoPopBreak(this.autoPopBreak)
      window.localStorage.setItem('autoPopBreak', this.autoPopBreak)
    },
    handleRowCLick(row) {
      this.hanleEdit(row)
    },
    hanleAddBreak() {
      this.breakId = ''
      this.editBreakVisible = true
    },
    handleChangeType(row) {
      window.breakStore.addBreak(row)
    },
    hanleEdit(row) {
      this.breakId = row.id
      this.editBreakVisible = true
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
        window.breakStore.delBreak(row.id)
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
.dialog-break-list {
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