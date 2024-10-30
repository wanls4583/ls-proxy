<template>
  <div class="header-wrap" :style="{'margin-left': headerMarginLeft}">
    <div class="left-wrap">
      <div class="proxy-wrap">
        <div class="dot" :class="{ active: processing }"></div>
        <div class="hostname">Proxying at {{ hostname }}</div>
        <el-tooltip class="item" effect="light" content="复制代理地址" placement="bottom">
          <i class="icon icon-copy hover-icon"></i>
        </el-tooltip>
        <el-tooltip class="item" effect="light" content="修改端口号" placement="bottom">
          <i class="icon icon-pen-1 hover-icon"></i>
        </el-tooltip>
      </div>
      <div class="btn-wrap">
        <i
          class="icon icon-gateway hover-icon"
          :class="{ active: gatewayAactive }"
          @click="onClickGateWay"
        ></i>
        <i
          class="icon icon-mirror hover-icon"
          :class="{ active: mirrorAactive }"
          @click="onClickMirror"
        ></i>
        <el-popover
          width="150"
          trigger="hover"
          popper-class="op-list is-menu dark"
          :visible-arrow="true"
        >
          <div class="op-btn-list">
            <div class="op-group">
              <div class="op-btn-item" @click="onClickPen">{{penAactive?'禁用重写':'启用重写'}}</div>
            </div>
            <div class="op-group">
              <div class="op-btn-item" @click="onClickRule">管理规则</div>
            </div>
          </div>
          <i slot="reference" class="icon icon-pen hover-icon" :class="{ active: penAactive }"></i>
        </el-popover>
        <el-popover
          width="150"
          trigger="hover"
          popper-class="op-list is-menu dark"
          :visible-arrow="true"
        >
          <div class="op-btn-list">
            <div class="op-group">
              <div class="op-btn-item" @click="onClickBug">{{penAactive?'禁用断点':'启用断点'}}</div>
            </div>
            <div class="op-group">
              <div class="op-btn-item" @click="onClickBreak">管理断点</div>
            </div>
          </div>
          <i slot="reference" class="icon icon-bug hover-icon" :class="{ active: bugAactive }"></i>
        </el-popover>
        <i
          class="icon icon-network hover-icon"
          :class="{ active: networkAactive }"
          @click="onClickNetwork"
        ></i>
        <i class="icon icon-ssl hover-icon" :class="{ active: sslAactive }" @click="onClickSll"></i>
      </div>
    </div>
    <div class="right-wrap">
      <div class="btn-group">
        <div class="btn btn-primary" style="width: 67px" @click="onStart">
          <span>{{ processing ? '停止' : '启动' }}</span>
        </div>
        <div class="btn btn-primary" @click="onClear">
          <i class="icon icon-delete"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Header',
  data() {
    return {
      hostname: '127.0.0.1:8000',
      gatewayAactive: false,
      mirrorAactive: false,
      penAactive: false,
      bugAactive: false,
      networkAactive: false,
      sslAactive: false,
      processing: false,
      headerMarginLeft: '0px',
      isMac: window.process?.platform == 'darwin',
      isWin: window.process?.platform == 'win32',
      isLinux: window.process?.platform == 'linux'
    }
  },
  created() {
    this.init()
  },
  methods: {
    init() {
      this.initEvent()
      if (this.isMac) {
        this.headerMarginLeft = '55px'
      }
    },
    initEvent() {
      this.eventBus.$on('socket-close', () => {
        if (this.processing) {
          this.onStart()
        }
      })
      if (window.require) {
        const { ipcRenderer } = window.require('electron')
        ipcRenderer.on('enter-full-screen', () => {
          if (this.isMac) {
            this.headerMarginLeft = '0px'
          }
        });
        ipcRenderer.on('leave-full-screen', () => {
          if (this.isMac) {
            this.headerMarginLeft = '55px'
          }
        });
      }
    },
    onClickGateWay() {
      this.gatewayAactive = !this.gatewayAactive
    },
    onClickMirror() {
      this.mirrorAactive = !this.mirrorAactive
    },
    onClickPen() {
      this.penAactive = !this.penAactive
    },
    onClickRule() {
      this.eventBus.$emit('show-rule')
    },
    onClickBug() {
      this.bugAactive = !this.bugAactive
    },
    onClickBreak() {
      this.eventBus.$emit('show-break')
    },
    onClickNetwork() {
      this.networkAactive = !this.networkAactive
    },
    onClickSll() {
      this.sslAactive = !this.sslAactive
    },
    onStart() {
      this.processing = !this.processing
      this.eventBus.$emit('start-listen', this.processing)
    },
    onClear() {
      this.eventBus.$emit('clear-table')
    }
  }
}
</script>

<style>
</style>
