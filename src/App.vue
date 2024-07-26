<template>
  <div id="app">
    <div class="right-wrap">
      <ls-header @clear="onClear" @start="onStart" />
      <type-filter />
      <record-table ref="table" />
    </div>
  </div>
</template>

<script>
import Header from './components/Header.vue'
import TypeFilter from './components/TypeFilter.vue'
import RecordTable from './components/RecordTable.vue'
export default {
  name: 'App',
  components: {
    LsHeader: Header,
    TypeFilter,
    RecordTable,
  },
  methods: {
    onClear() {
      this.$refs.table.clearTable()
    },
    onStart(val) {
      this.$refs.table.startSocket(val)
    }
  }
}
</script>

<style>
.right-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
