<template>
  <div class="detail-object-view">
    <div class="title-wrap">
      <span class="title">{{title}}</span>
      <span class="op-wrap">
        <i class="icon icon-copy"></i>
      </span>
    </div>
    <div class="detail-object-table scroll-overlay">
      <div
        class="detail-object-table-row"
        :class="{editable: editable}"
        v-for="(item, index) in keyList"
        :key="index"
      >
        <template v-if="editable">
          <div class="detail-object-table-cell">
            <el-input v-model="item.key" placeholder="键" @input="onKeyChange(index)"></el-input>
          </div>
          <div class="detail-object-table-cell">
            <el-input v-model="item.val" placeholder="值" @input="onValChange(index)"></el-input>
          </div>
          <div class="detail-object-table-cell op">
            <i
              class="el-icon-remove-outline"
              v-if="index < keyList.length - 1"
              @click="onDelete(index)"
            ></i>
          </div>
        </template>
        <template v-else>
          <div class="detail-object-table-cell">{{item}}</div>
          <div class="detail-object-table-cell">{{data[item]}}</div>
        </template>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    title: {
      type: String,
      default: ''
    },
    data: {
      type: Object,
      default: () => { return {} }
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    data() {
      this.init()
    }
  },
  data() {
    return {
      keyList: []
    }
  },
  created() {
    if (this.editable) {
      this.init()
    } else {
      this.eventBus.$on('refresh-detail-data', () => {
        this.init()
      })
    }
  },
  beforeDestroy() {
    this.eventBus.$off('refresh-detail-data')
  },
  methods: {
    init() {
      let keyList = Object.keys(this.data)
      this.keyList = keyList.sort((a, b) => {
        a = a.toLowerCase()
        b = b.toLowerCase()
        if (a > b) {
          return 1
        }
        if (a < b) {
          return -1
        }
        return 0
      })
      if (this.editable) {
        this.keyList = this.keyList.map(key => {
          return {
            key: key,
            val: this.data[key]
          }
        })
        this.add()
      }
    },
    add() {
      this.keyList.push({ key: '', val: '' })
    },
    getObject() {
      let data = Object.assign({}, this.data)
      if (this.editable) {
        data = {}
        this.keyList.forEach(item => {
          if (item.key) {
            data[item.key] = item.val
          }
        })
      }
      return data
    },
    getParams() {
      let obj = this.getObject()
      let params = ''
      for (let key in obj) {
        params += `&${key}=${obj[key] || ''}`
      }
      params = params.slice(1)
      return params
    },
    getHeader() {
      let obj = this.getObject()
      let header = ''
      for (let key in obj) {
        header += `${key}: ${obj[key] || ''}\r\n`
      }
      return header
    },
    onKeyChange(index) {
      if (index === this.keyList.length - 1) {
        this.add()
      }
    },
    onValChange(index) {
      if (index === this.keyList.length - 1) {
        this.add()
      }
    },
    onDelete(index) {
      this.keyList.splice(index, 1)
    }
  }
}
</script>