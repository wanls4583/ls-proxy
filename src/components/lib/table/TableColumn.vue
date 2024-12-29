<template>
  <div></div>
</template>

<script>
export default {
  name: 'TableColumn',
  props: {
    label: {
      type: String,
      default: ''
    },
    width: [String, Number],
    prop: {
      type: String,
      default: ''
    },
    showProp: Function,
    cellStyle: {
      type: Object,
      default: () => ({})
    },
    cellClass: {
      type: Array,
      default: () => []
    }
  },
  created() {
    let width = this.width
    if (width) {
      if (typeof width === 'number') {
        width = width + 'px'
      } else {
        width = /^\d+$/.exec(width) ? width + 'px' : width
      }
    }
    let column = {
      label: this.label,
      width: width,
      prop: this.prop,
      cellStyle: this.cellStyle,
      cellClass: this.cellClass
    }
    let _this = this
    column.renderCell = function (row) {
      if (_this.$scopedSlots.default) {
        return _this.$scopedSlots.default({ row })
      } else {
        return row.showProp?.(row) || row[_this.prop]
      }
    }
    this.$parent.columns.push(column)
  }
};
</script>