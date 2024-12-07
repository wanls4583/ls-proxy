<template>
  <div v-if="visible">
    <el-dialog
      title="镜像列表"
      :visible.sync="visible"
      :close-on-click-modal="false"
      :show-close="false"
      class="dialog-mirror-list"
      center
    >
      <div class="bar_wrap">
        <div class="left_wrap">
          <el-checkbox v-model="enableMirror" @change="handleEnableChange()">启用镜像</el-checkbox>
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
        <el-table-column prop="url" label="域名" min-width="200"></el-table-column>
        <el-table-column prop="host" label="镜像" min-width="200"></el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <span class="btn btn-text" style="margin-right:-8px" @click="close()">关闭</span>
      </div>
    </el-dialog>
    <DialogEditMirror
      :visible.sync="editMirrorVisible"
      :id="id"
      v-if="editMirrorVisible"
      @confirm="getList"
    />
  </div>
</template>
<script>
import { mapMutations } from 'vuex'
import { saveMirrorOnOff } from '../../common/http'
import DialogEditMirror from './DialogEditMirror.vue'
export default {
  components: {
    DialogEditMirror
  },
  props: {
    visible: Boolean,
  },
  data() {
    return {
      list: [],
      id: '',
      enableMirror: false,
      allEnable: false,
      editMirrorVisible: false
    }
  },
  created() {
    this.getList()
    this.enableMirror = this.$store.state.enableMirror
  },
  methods: {
    ...mapMutations(['changeMirrorEnable']),
    getList() {
      this.list = window.mirrorStore.getNodeList()
      this.setEnableAll()
    },
    setEnableAll() {
      this.allEnable = this.list.length && this.list.filter(item => item.enable).length === this.list.length
    },
    handleCheckChange(row) {
      window.mirrorStore.setEnable(row.id, row.enable)
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
      let enableMirror = this.enableMirror
      let res = await saveMirrorOnOff(enableMirror)
      if (res.status === 200) {
        this.changeMirrorEnable(enableMirror)
      }
    },
    handleRowCLick(row) {
      this.hanleEdit(row)
    },
    hanleAdd() {
      this.id = ''
      this.editMirrorVisible = true
    },
    hanleEdit(row) {
      this.id = row.id
      this.editMirrorVisible = true
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
        window.mirrorStore.delNode(row.id)
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
.dialog-mirror-list {
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