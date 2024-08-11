<template>
  <div class="detail-object-view">
    <div class="title-wrap">
      <span class="title">{{title}}</span>
      <span class="op-wrap">
        <i class="icon icon-copy"></i>
      </span>
    </div>
    <div class="detail-object-table">
      <div class="detail-object-table-row" v-for="item in keyList" :key="item">
        <div class="detail-object-table-cell">{{item}}</div>
        <div class="detail-object-table-cell">{{data[item]}}</div>
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
    }
  },
  data() {
    return {
      keyList: []
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
    }
  }
}
</script>