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
        <el-popover
          width="150"
          trigger="hover"
          popper-class="op-list is-menu dark"
          :visible-arrow="true"
        >
          <div class="op-btn-list">
            <div class="op-group">
              <div class="op-btn-item" @click="onGatewayEnableChange">
                <i v-if="enableGateway" class="el-icon-check"></i>
                <span>启用网关</span>
              </div>
            </div>
            <div class="op-group">
              <div class="op-btn-item" @click="onClickGateway">管理规则</div>
            </div>
          </div>
          <i
            slot="reference"
            class="icon icon-gateway hover-icon"
            :class="{ active: enableGateway }"
          ></i>
        </el-popover>
        <el-popover
          width="150"
          trigger="hover"
          popper-class="op-list is-menu dark"
          :visible-arrow="true"
        >
          <div class="op-btn-list">
            <div class="op-group">
              <div class="op-btn-item" @click="onMirrorEnableChange">
                <i v-if="enableMirror" class="el-icon-check"></i>
                <span>启用镜像</span>
              </div>
            </div>
            <div class="op-group">
              <div class="op-btn-item" @click="onClickMirror">管理规则</div>
            </div>
          </div>
          <i slot="reference" class="icon icon-mirror hover-icon" :class="{ active: enableMirror }"></i>
        </el-popover>
        <el-popover
          ref="rulePopover"
          width="150"
          trigger="hover"
          popper-class="op-list is-menu dark"
          :visible-arrow="true"
        >
          <div class="op-btn-list">
            <div class="op-group">
              <div class="op-btn-item" @click="onRuleEnableChange">
                <i v-if="enableRule" class="el-icon-check"></i>
                <span>启用重写</span>
              </div>
            </div>
            <div class="op-group">
              <div class="op-btn-item" @click="onClickRule">管理规则</div>
            </div>
          </div>
          <i slot="reference" class="icon icon-pen hover-icon" :class="{ active: enableRule }"></i>
        </el-popover>
        <el-popover
          ref="breakPopover"
          width="150"
          trigger="hover"
          popper-class="op-list is-menu dark"
          :visible-arrow="true"
        >
          <div class="op-btn-list">
            <div class="op-group">
              <div class="op-btn-item" @click="onBreakEnableChange">
                <i v-if="enableBreak" class="el-icon-check"></i>
                <span>启用断点</span>
              </div>
              <div class="op-btn-item" @click="onBreakAutoPopChange">
                <i v-if="autoPopBreak" class="el-icon-check"></i>
                <span>自动弹出</span>
              </div>
            </div>
            <div class="op-group">
              <div class="op-btn-item" @click="onClickBreak">管理断点</div>
              <div class="op-btn-item" @click="onShowBreak">执行断点</div>
            </div>
          </div>
          <i slot="reference" class="icon icon-bug hover-icon" :class="{ active: enableBreak }"></i>
        </el-popover>
        <el-popover
          ref="rulePopover"
          width="150"
          trigger="hover"
          popper-class="op-list is-menu dark"
          :visible-arrow="true"
        >
          <div class="op-btn-list">
            <div class="op-group">
              <div class="op-btn-item" @click="onScriptEnableChange">
                <i v-if="enableScript" class="el-icon-check"></i>
                <span>启用脚本</span>
              </div>
            </div>
            <div class="op-group">
              <div class="op-btn-item" @click="onClickScript">管理脚本</div>
            </div>
          </div>
          <i
            slot="reference"
            class="icon icon-script hover-icon"
            style="font-size:17px"
            :class="{ active: enableScript }"
          ></i>
        </el-popover>
        <el-popover
          width="150"
          trigger="hover"
          popper-class="op-list is-menu dark"
          :visible-arrow="true"
        >
          <div class="op-btn-list">
            <div class="op-group">
              <div class="op-btn-item" @click="onClickNetwork">
                <i v-if="networkAactive" class="el-icon-check"></i>
                <span>系统代理</span>
              </div>
            </div>
          </div>
          <i
            slot="reference"
            class="icon icon-network hover-icon"
            :class="{ active: networkAactive, 'warn-active': networkHalfAactive }"
          ></i>
        </el-popover>
        <el-popover
          width="150"
          trigger="hover"
          popper-class="op-list is-menu dark"
          :visible-arrow="true"
        >
          <div class="op-btn-list">
            <div class="op-group">
              <div class="op-btn-item" @click="onClickSll">
                <i v-if="sslAactive" class="el-icon-check"></i>
                <span>SSL证书</span>
              </div>
            </div>
          </div>
          <i slot="reference" class="icon icon-ssl hover-icon" :class="{ active: sslAactive }"></i>
        </el-popover>
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
import { mapState, mapMutations } from 'vuex'
import { getRuleOnOff, getBreakOnOff, getScriptOnOff, getRootCertStatus, saveMirrorOnOff, saveGatewayOnOff, saveRuleOnOff, saveBreakOnOff, saveScriptOnOff, getProxyOnOff, saveProxyOnOff, addRootCert, getMirrorOnOff, getGatewayOnOff } from '../common/http'
export default {
  name: 'Header',
  data() {
    return {
      hostname: '127.0.0.1:8000',
      gatewayAactive: false,
      networkAactive: false,
      networkHalfAactive: false,
      sslAactive: false,
      processing: false,
      headerMarginLeft: '0px',
      isMac: window.process?.platform == 'darwin',
      isWin: window.process?.platform == 'win32',
      isLinux: window.process?.platform == 'linux',
      loading: {}
    }
  },
  computed: {
    ...mapState(['enableMirror', 'enableGateway', 'enableRule', 'enableBreak', 'autoPopBreak', 'enableScript'])
  },
  created() {
    this.init()
  },
  methods: {
    ...mapMutations(['changeMirrorEnable', 'changeGatewayEnable', 'changeRuleEnable', 'changeBreakEnable', 'changeAutoPopBreak', 'changeScriptEnable']),
    init() {
      this.initEvent()
      getGatewayOnOff().then(res => {
        this.changeGatewayEnable(!!res.data)
      })
      getMirrorOnOff().then(res => {
        this.changeMirrorEnable(!!res.data)
      })
      getRuleOnOff().then(res => {
        this.changeRuleEnable(!!res.data)
      })
      getBreakOnOff().then(res => {
        this.changeBreakEnable(!!res.data)
      })
      getScriptOnOff().then(res => {
        this.changeScriptEnable(!!res.data)
      })
      getProxyOnOff().then(res => {
        let httpEnable = !!res.data?.http
        let httpsEnable = !!res.data?.https
        let socketEnable = !!res.data?.socket
        this.networkAactive = httpEnable && httpsEnable && socketEnable
        this.networkHalfAactive = !this.networkAactive && (httpEnable || httpsEnable || socketEnable)
      })
      getRootCertStatus().then(res => {
        this.sslAactive = !!res.data
      })
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
    async onGatewayEnableChange() {
      if (this.loading.gateway) {
        return
      }
      this.loading.gateway = true
      let enableGateway = !this.enableGateway
      let res = await saveGatewayOnOff(enableGateway)
      this.loading.gateway = false
      if (res.status === 200) {
        this.changeGatewayEnable(enableGateway)
      }
    },
    onClickGateway() {
      this.eventBus.$emit('show-gateway-list')
    },
    async onMirrorEnableChange() {
      if (this.loading.mirror) {
        return
      }
      this.loading.mirror = true
      let enableMirror = !this.enableMirror
      let res = await saveMirrorOnOff(enableMirror)
      this.loading.mirror = false
      if (res.status === 200) {
        this.changeMirrorEnable(enableMirror)
      }
    },
    onClickMirror() {
      this.eventBus.$emit('show-mirror-list')
    },
    async onRuleEnableChange() {
      if (this.loading.rule) {
        return
      }
      this.loading.rule = true
      let enableRule = !this.enableRule
      let res = await saveRuleOnOff(enableRule)
      this.loading.rule = false
      if (res.status === 200) {
        this.changeRuleEnable(enableRule)
      }
      // this.$refs.rulePopover.doClose()
    },
    onClickRule() {
      this.eventBus.$emit('show-rule')
    },
    async onBreakEnableChange() {
      if (this.loading.break) {
        return
      }
      this.loading.break = true
      let enableBreak = !this.enableBreak
      let res = await saveBreakOnOff(enableBreak)
      this.loading.break = false
      if (res.status === 200) {
        this.changeBreakEnable(enableBreak)
      }
      // this.$refs.breakPopover.doClose()
    },
    onBreakAutoPopChange() {
      let autoPopBreak = !this.autoPopBreak
      this.changeAutoPopBreak(autoPopBreak)
      window.localStorage.setItem('autoPopBreak', autoPopBreak)
      // this.$refs.breakPopover.doClose()
    },
    async onScriptEnableChange() {
      if (this.loading.script) {
        return
      }
      this.loading.script = true
      let enableScript = !this.enableScript
      let res = await saveScriptOnOff(enableScript)
      this.loading.script = false
      if (res.status === 200) {
        this.changeScriptEnable(enableScript)
      }
    },
    onClickBreak() {
      this.eventBus.$emit('show-break-list')
    },
    onShowBreak() {
      this.eventBus.$emit('show-break-run')
    },
    onClickScript() {
      this.eventBus.$emit('show-script-list')
    },
    async onClickNetwork() {
      if (this.loading.proxy) {
        return
      }
      this.loading.proxy = true
      let networkAactive = !this.networkAactive
      let res = await saveProxyOnOff(networkAactive)
      this.loading.proxy = false
      if (res.status === 200) {
        this.networkAactive = networkAactive
        this.networkHalfAactive = false
      }
    },
    async onClickSll() {
      if (!this.sslAactive) {
        let res = await addRootCert()
        if (res.status === 200) {
          this.sslAactive = true
        }
      }
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
