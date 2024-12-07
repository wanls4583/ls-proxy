<template>
  <div v-if="visible">
    <el-dialog
      title="网关列表"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :show-close="false"
      class="dialog-gateway-list"
      center
    >
      <div class="bar_wrap">
        <div class="left_wrap">
          <el-checkbox v-model="enableGateway" @change="handleEnableChange()">启用网关</el-checkbox>
        </div>
        <div class="right_wrp">
          <i class="icon icon-import hover-icon" style="font-weight:bold;font-size:18px"></i>
          <i
            class="icon icon-plus hover-icon"
            style="font-weight:bold;font-size:20px"
            @click="hanleAdd"
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
        <el-table-column prop="host" label="方法" min-width="200">
          <template slot-scope="scope">
            <span>{{methodDesc(scope.row.method)}}</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <span class="btn btn-text" style="margin-right:-8px" @click="close()">关闭</span>
      </div>
    </el-dialog>
    <DialogEditGateway
      :visible.sync="editGatewayVisible"
      :id="id"
      v-if="editGatewayVisible"
      @confirm="getList"
    />
  </div>
</template>
<script>
import { mapMutations } from 'vuex'
import { saveGatewayOnOff } from '../../common/http'
import { GATEWAY_METHODS } from '../../common/const'
import DialogEditGateway from './DialogEditGateway.vue'
export default {
  components: {
    DialogEditGateway
  },
  props: {
    visible: Boolean,
  },
  data() {
    return {
      list: [],
      id: '',
      enableGateway: false,
      allEnable: false,
      editGatewayVisible: false
    }
  },
  computed: {
    methodDesc() {
      return (method) => {
        return GATEWAY_METHODS.find(item => item.value === method)?.desc || ''
      }
    }
  },
  created() {
    this.getList()
    this.enableGateway = this.$store.state.enableGateway
  },
  methods: {
    ...mapMutations(['changeGatewayEnable']),
    getList() {
      this.list = window.gatewayStore.getNodeList()
      this.setEnableAll()
    },
    setEnableAll() {
      this.allEnable = this.list.length && this.list.filter(item => item.enable).length === this.list.length
    },
    handleCheckChange(row) {
      window.gatewayStore.setEnable(row.id, row.enable)
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
      let enableGateway = this.enableGateway
      let res = await saveGatewayOnOff(enableGateway)
      if (res.status === 200) {
        this.changeGatewayEnable(enableGateway)
      }
    },
    handleRowCLick(row) {
      this.hanleEdit(row)
    },
    hanleAdd() {
      this.id = ''
      this.editGatewayVisible = true
    },
    hanleEdit(row) {
      this.id = row.id
      this.editGatewayVisible = true
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
        window.gatewayStore.delNode(row.id)
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
.dialog-gateway-list {
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