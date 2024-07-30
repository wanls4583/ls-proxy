<template>
  <div class="header-wrap" :style="{'margin-left': headerMarginLeft}">
    <div class="left-wrap">
      <div class="proxy-wrap">
        <div class="dot" :class="{ active: networkAactive && processing }"></div>
        <div class="hostname">Proxying at {{ hostname }}</div>
        <el-tooltip class="item" effect="light" content="复制代理地址" placement="bottom">
          <i class="iconfont icon-copy"></i>
        </el-tooltip>
        <el-tooltip class="item" effect="light" content="修改端口号" placement="bottom">
          <i class="iconfont icon-pen-1"></i>
        </el-tooltip>
      </div>
      <div class="btn-wrap">
        <i
          class="iconfont icon-gateway"
          :class="{ active: gatewayAactive }"
          @click="onClickGateWay"
        ></i>
        <i class="iconfont icon-mirror" :class="{ active: mirrorAactive }" @click="onClickMirror"></i>
        <i class="iconfont icon-pen" :class="{ active: penAactive }" @click="onClickPen"></i>
        <i class="iconfont icon-bug" :class="{ active: bugAactive }" @click="onClickBug"></i>
        <i
          class="iconfont icon-network"
          :class="{ active: networkAactive }"
          @click="onClickNetwork"
        ></i>
        <i class="iconfont icon-ssl" :class="{ active: sslAactive }" @click="onClickSll"></i>
      </div>
    </div>
    <div class="right-wrap">
      <div class="btn-group">
        <div class="btn btn-primary" style="width: 67px" @click="onStart">
          <span>{{ processing ? '停止' : '启动' }}</span>
        </div>
        <div class="btn btn-primary" @click="onClear">
          <i class="iconfont icon-delete"></i>
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
    onClickBug() {
      this.bugAactive = !this.bugAactive
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
