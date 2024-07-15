<template>
  <div class="record-table-wrap">
    <div class="table-title">
      <div class="th-cell" v-for="(item, index) in columns" :key="index" :style="cellStyle(item)">
        <span class="label">{{item.label}}</span>
      </div>
    </div>
    <div class="table-content-wrap">
      <div class="table-content"></div>
    </div>
  </div>
</template>

<script>
import HScrollBar from './HScrollBar.vue'
import VScrollBar from './VScrollBar.vue'
export default {
  components: {
    HScrollBar,
    VScrollBar,
  },
  data() {
    return {
      columns: [
        {
          label: '类型',
          width: '60px',
          prop: 'type'
        },
        {
          label: 'URL',
          width: '50%',
          prop: 'url'
        },
        {
          label: '方法',
          width: '60px',
          prop: 'method'
        },
        {
          label: '状态码',
          width: '60px',
          prop: 'status'
        },
        {
          label: '服务器IP',
          width: '140px',
          prop: 'ip'
        },
        {
          label: '时长',
          width: '60px',
          prop: 'duration'
        },
        {
          label: '大小',
          width: '60px',
          prop: 'size'
        }
      ]
    }
  },
  computed: {
    cellStyle() {
      return (column) => {
        let style = {}
        let wColumns = this.columns.filter(item => item.width)
        if (column.width) {
          style.width = column.width
          style['flex-shrink'] = 0
        }
        if (wColumns.length === this.columns.length) {
          style = { flex: `1 1 ${column.width}` }
        } else if (wColumns.length && !column.width || !wColumns.length) {
          style = { flex: `1 1 0` }
        }
        return style
      }
    }
  }
}
</script>