<template>
  <div id="app">
    <div class="right-wrap">
      <ls-header />
      <type-filter />
      <record-table />
      <DialogRuleList :visible.sync="ruleListVisible" v-if="ruleListVisible" />
      <DialogBreakList :visible.sync="breakListVisible" v-if="breakListVisible" />
    </div>
  </div>
</template>

<script>
import Header from './components/Header.vue'
import TypeFilter from './components/TypeFilter.vue'
import RecordTable from './components/RecordTable.vue'
import DialogRuleList from './components/rule/DialogRuleList.vue'
import DialogBreakList from './components/breakpoint/DialogBreakList.vue'
export default {
  name: 'App',
  components: {
    LsHeader: Header,
    TypeFilter,
    RecordTable,
    DialogRuleList,
    DialogBreakList,
  },
  data() {
    return {
      ruleListVisible: false,
      breakListVisible: false,
    }
  },
  created() {
    this.initEvent()
  },
  methods: {
    initEvent() {
      this.eventBus.$on('show-rule', () => {
        this.ruleListVisible = true
      })
      this.eventBus.$on('show-break', () => {
        this.breakListVisible = true
      })
    },
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
