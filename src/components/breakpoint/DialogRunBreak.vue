<template>
  <div v-if="dialogVisible">
    <el-dialog
      title="断点执行器"
      :visible.sync="dialogVisible"
      :close-on-click-modal="false"
      :show-close="true"
      :before-close="onClose"
      class="dialog-req-break"
      center
      width="90vw"
    >
      <div class="wrap" v-if="list.length">
        <div class="left_wrap">
          <div
            class="item"
            v-for="(item, index) in list"
            :key="item.id"
            :class="{even: index%2===1, active: nowBreak && item.id===nowBreak.id}"
            @click="onChangeBreak(item)"
          >
            <span>{{item.url}}</span>
          </div>
        </div>
        <div class="right_wrap">
          <div class="header">
            <template v-if="isReq">
              <el-input v-model="path" class="input_with_select">
                <el-select v-model="method" slot="prepend" style="width:130px">
                  <el-option v-for="item in HTTP_METHODS" :label="item" :value="item" :key="item"></el-option>
                </el-select>
              </el-input>
            </template>
            <template v-else>
              <el-input :value="statusDesc" class="input_with_select" readonly>
                <el-select v-model="status" slot="prepend" style="width:130px">
                  <el-option
                    v-for="item in HTTP_STATUS"
                    :label="item.code"
                    :value="item.code"
                    :key="item.code"
                  ></el-option>
                </el-select>
              </el-input>
            </template>
            <div class="btn-group">
              <div class="btn btn-primary" size="large" style="width: 100px" @click="onRun">
                <span>执行</span>
              </div>
              <div class="btn btn-primary" size="large" style="padding:0 12px">
                <i class="icon icon-zhongduan" style="font-size:18px;font-weight:bold"></i>
              </div>
            </div>
          </div>
          <div class="content">
            <el-tabs v-model="tab">
              <el-tab-pane label="参数" name="参数" v-if="isReq">
                <ObjectView title="参数头列表" ref="params" :data="data.params" :editable="true" />
              </el-tab-pane>
              <el-tab-pane :label="isReq?'请求头':'响应头'" name="头部">
                <ObjectView
                  :title="isReq?'请求头列表':'响应头列表'"
                  ref="header"
                  :data="data.header"
                  :editable="true"
                />
              </el-tab-pane>
              <el-tab-pane :label="isReq?'请求体':'响应体'" name="实体">
                <BodyEditor ref="body" :body="data.body" :header="data.header" />
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
      <div class="wrap" v-else>
        <Empty title="暂无断点" />
      </div>
    </el-dialog>
  </div>
</template>
<script>
import Empty from './../Empty.vue'
import ObjectView from '../detail/ObjectView.vue'
import BodyEditor from './BodyEditor.vue'
import { HTTP_METHODS, HTTP_STATUS, RULE_TYPE } from '../../common/const'
import { getU8ArrayFromString, getUUID } from '../../common/utils'
import { runBreak } from '../../common/http'
export default {
  components: {
    Empty,
    ObjectView,
    BodyEditor,
  },
  data() {
    return {
      HTTP_METHODS,
      HTTP_STATUS,
      RULE_TYPE,
      list: [],
      dialogVisible: false,
      tab: '参数',
      status: '',
      path: '',
      method: '',
      nowBreak: null,
      data: {
        params: {},
        header: {},
        body: null
      }
    }
  },
  computed: {
    isReq() {
      return this.nowBreak?.breakType === RULE_TYPE.REQ
    },
    isRes() {
      return this.nowBreak?.breakType === RULE_TYPE.RES
    },
    statusDesc() {
      let obj = HTTP_STATUS.find(item => item.code == this.status)
      return obj ? obj.desc : ''
    }
  },
  created() {
    this.eventBus.$on('show-break-run', (dataObj) => {
      if (dataObj) {
        this.list.push(dataObj)
        !this.nowBreak && this.onChangeBreak(this.list[0])
        if (this.$store.state.autoPopBreak) {
          this.dialogVisible = true
        }
      } else {
        this.dialogVisible = true
      }
    })
  },
  methods: {
    getHead(boundary) {
      let headLine = ''
      if (this.isReq) {
        let path = this.path[0] === '/' ? this.path : '/' + this.path
        path = encodeURI(path)
        headLine = `${this.method} ${path} ${this.nowBreak.version}\r\n`
      } else {
        headLine = `${this.nowBreak.version} ${this.status} ${this.statusDesc}\r\n`
      }
      let header = this.$refs.header.getHeader()
      if (boundary) {
        header = header.replace(/(\n|^)content-type[^\r\n]*?\r\n/i, '$1')
        header = `Content-Type: multipart/form-data; boundary=${boundary}\r\n` + header
      }
      let head = headLine + header + '\r\n'
      let u8Array = getU8ArrayFromString(head)
      return u8Array
    },
    getBody(boundary) {
      return this.$refs.body.getBody(boundary)
    },
    getReq() {
      let isMultipart = this.$refs.body.checkMultipart()
      let boundary = isMultipart ? (this.$refs.body.getBoundary() || '----' + getUUID()) : ''
      let head = this.getHead(boundary)
      let body = this.getBody(boundary)
      let req = new Uint8Array(head.length + body.length)
      req.set(head)
      req.set(body, head.length)

      return req
    },
    onChangeBreak(item) {
      this.nowBreak = item
      if (item.breakType === RULE_TYPE.REQ) {
        this.method = item.method
        this.path = item.path
        this.data.params = Object.assign({}, item.params)
        this.data.header = Object.assign({}, item.reqHeader)
      } else {
        this.status = item.status
        this.data.header = Object.assign({}, item.resHeader)
        if (this.tab === '参数') {
          this.tab = '头部'
        }
      }
      this.data.body = item.body
    },
    onRun() {
      if (!this.list.length) {
        return
      }
      let req = this.getReq()
      runBreak(this.nowBreak.id, req)
      this.list.splice(this.list.indexOf(this.nowBreak), 1)
      if (this.list.length) {
        this.onChangeBreak(this.list[0])
      } else {
        this.nowBreak = null
      }
    },
    onClose() {
      this.dialogVisible = false
    },
  }
}
</script>
<style lang="scss">
.dialog-req-break {
  .el-dialog {
    padding: 0 !important;
  }
  .el-dialog__body {
    padding: 0 !important;
  }
  .wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 80vh;
    .left_wrap {
      max-width: 250px;
      min-width: 250px;
      height: 100%;
      border-right: 1px solid #464646;
      .item {
        line-height: 32px;
        padding: 0 15px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        &.even {
          background-color: rgba(255, 255, 255, 0.03);
        }
        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        &:active,
        &.active {
          background-color: #ebb238bb;
        }
      }
    }
    .right_wrap {
      flex-grow: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      .header {
        display: flex;
        justify-content: space-between;
        padding: 15px;
        border-bottom: 1px solid #464646;
        .input_with_select {
          flex-grow: 1;
          margin-right: 15px;
          .el-input__inner {
            border-top-right-radius: 4px;
            border-bottom-right-radius: 4px;
          }
        }
      }
      .content {
        flex-grow: 1;
        overflow: hidden;
      }
    }
  }
  .detail-object-view {
    .title-wrap {
      height: 35px;
    }
  }
}
</style>