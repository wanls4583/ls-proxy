<template>
  <div class="detail-overview-wrap">
    <div class="overview-title">
      <div class="label">名称</div>
      <div class="value">值</div>
    </div>
    <div class="overview-tree">
      <el-tree
        :data="treeData"
        node-key="label"
        :indent="12"
        @node-expand="onToggle"
        @node-collapse="onToggle"
      >
        <div class="overview-tree-node" slot-scope="scope">
          <span class="label">{{scope.data.label}}</span>
          <span class="value" :class="scope.data.valClass">{{scope.data.value}}</span>
        </div>
      </el-tree>
    </div>
  </div>
</template>
<script>
import { formatTime } from '@/common/utils'
const [
  TIME_DNS_START,
  TIME_DNS_END,
  TIME_CONNECT_START,
  TIME_CONNECT_END,
  TIME_CONNECT_SSL_START,
  TIME_CONNECT_SSL_END,
  TIME_REQ_START,
  TIME_REQ_END,
  TIME_RES_START,
  TIME_RES_END
] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export default {
  props: {
    data: {
      type: Object,
      default: () => { return {} }
    }
  },
  data() {
    return {
      treeData: []
    }
  },
  created() {
    this.eventBus.$on('refresh-detail-data', () => {
      this.init()
    })
  },
  beforeDestroy() {
    this.eventBus.$off('refresh-detail-data')
  },
  methods: {
    init() {
      this.treeData = []
      this.treeData.push({
        label: 'URL',
        value: this.data.url
      })

      this.treeData.push({
        label: '状态',
        value: this.data.status
      })

      this.treeData.push({
        label: '方法',
        value: this.data.method
      })

      this.treeData.push({
        label: '协议',
        value: this.data.version
      })

      this.treeData.push({
        label: 'Keep Alive',
        value: this.data.resHeader?.['Connection'] === 'keep-alive'
      })

      this.treeData.push({
        label: 'Content Type',
        value: this.data.resHeader?.['Content-Type']
      })

      let children = []

      children.push({
        label: 'ID',
        value: this.data.id
      })
      children.push({
        label: '客户端地址',
        value: this.data.clntIp
      })
      children.push({
        label: '客户端端口',
        value: this.data.clntPort
      })
      children.push({
        label: '服务端地址',
        value: this.data.ip
      })
      children.push({
        label: '服务端端口',
        value: this.data.port
      })

      this.treeData.push({
        label: '连接',
        value: '',
        children: children
      })
      if (this.data.cert) {
        children = []
        children.push({
          label: '版本',
          value: this.data.tlsVersion
        })

        let cipherChildren = this.data.cipherList?.map((item, index) => {
          return {
            label: '算法' + (index + 1),
            value: item
          }
        }) || []
        children.push({
          label: '加密算法列表',
          value: '',
          children: cipherChildren
        })

        children.push({
          label: '选则算法',
          value: this.data.cipher
        })

        this.treeData.push({
          label: 'TLS',
          value: '',
          children: children
        })

        children = []

        let subjectChilren = []
        let subjects = this.data.cert.subject?.split('\n') || []
        subjects.forEach(sub => {
          let eq = sub.indexOf('=')
          if (eq > -1) {
            let label = sub.slice(0, eq)
            let value = sub.slice(eq + 1)
            subjectChilren.push({
              label, value
            })
          }
        })
        children.push({
          label: 'Subject',
          children: subjectChilren
        })

        let isuserChildren = []
        let isusers = this.data.cert.issuer?.split('\n') || []
        isusers.forEach(sub => {
          let eq = sub.indexOf('=')
          if (eq > -1) {
            let label = sub.slice(0, eq)
            let value = sub.slice(eq + 1)
            isuserChildren.push({
              label, value
            })
          }
        })
        children.push({
          label: '签发者',
          children: isuserChildren
        })

        children.push({
          label: '开始时间',
          value: this.data.cert.validFrom ? formatTime(this.data.cert.validFrom).result : ''
        })

        children.push({
          label: '结束时间',
          value: this.data.cert.validTo ? formatTime(this.data.cert.validTo).result : ''
        })

        children.push({
          label: '指纹',
          value: this.data.cert.fingerprint
        })

        children.push({
          label: '序列号',
          value: this.data.cert.serialNumber
        })

        children.push({
          label: '证书',
          value: this.data.pem
        })

        this.treeData.push({
          label: '服务端证书',
          children: children
        })
      }

      children = []

      children.push({
        label: '请求开始',
        valClass: ['aequilate-font'],
        value: this.data.times?.[TIME_REQ_START] ? formatTime(this.data.times?.[TIME_REQ_START], '-', true).fullResult : ''
      })

      children.push({
        label: '请求结束',
        valClass: ['aequilate-font'],
        value: this.data.times?.[TIME_REQ_END] ? formatTime(this.data.times?.[TIME_REQ_END], '-', true).fullResult : ''
      })

      let reqDuration = ''
      if (this.data.times?.[TIME_REQ_START] && this.data.times?.[TIME_REQ_END]) {
        reqDuration = this.data.times?.[TIME_REQ_END] - this.data.times?.[TIME_REQ_START]
        reqDuration = (reqDuration / 1000).toFixed(3) + ' ms'
      }
      children.push({
        label: '请求时长',
        valClass: ['aequilate-font'],
        value: reqDuration,
      })

      children.push({
        label: '响应开始',
        valClass: ['aequilate-font'],
        value: this.data.times?.[TIME_RES_START] ? formatTime(this.data.times?.[TIME_RES_START], '-', true).fullResult : ''
      })

      children.push({
        label: '响应结束',
        valClass: ['aequilate-font'],
        value: this.data.times?.[TIME_RES_END] ? formatTime(this.data.times?.[TIME_RES_END], '-', true).fullResult : ''
      })

      let resDuration = ''
      if (this.data.times?.[TIME_RES_START] && this.data.times?.[TIME_RES_END]) {
        resDuration = this.data.times?.[TIME_RES_END] - this.data.times?.[TIME_RES_START]
        resDuration = (resDuration / 1000).toFixed(3) + ' ms'
      }
      children.push({
        label: '响应时长',
        valClass: ['aequilate-font'],
        value: resDuration,
      })

      let duration = ''
      if (this.data.times?.[TIME_REQ_START] && this.data.times?.[TIME_RES_END]) {
        duration = this.data.times?.[TIME_RES_END] - this.data.times?.[TIME_REQ_START]
        duration = (duration / 1000).toFixed(3) + ' ms'
      }
      children.push({
        label: '总时长',
        valClass: ['aequilate-font'],
        value: duration,
      })

      this.treeData.push({
        label: '时间',
        value: '',
        children: children
      })

      this.onToggle()
    },
    onToggle() {
      this.$nextTick(() => {
        document.querySelector('.overview-tree').querySelectorAll('.el-tree-node__content').forEach((item, index) => {
          if (index % 2 === 1) {
            item.style.background = 'rgba(255, 255, 255, 0.03)'
          } else {
            item.style.background = 'transparent'
          }
        })
      })
    }
  }
}
</script>