<template>
  <div id="app">
    <div class="right-wrap">
      <ls-header />
      <type-filter />
      <record-table />
      <DialogRuleList :visible.sync="ruleListVisible" v-if="ruleListVisible" />
    </div>
  </div>
</template>

<script>
import Header from './components/Header.vue'
import TypeFilter from './components/TypeFilter.vue'
import RecordTable from './components/RecordTable.vue'
import DialogRuleList from './components/rule/DialogRuleList.vue'
export default {
  name: 'App',
  components: {
    LsHeader: Header,
    TypeFilter,
    RecordTable,
    DialogRuleList,
  },
  data() {
    return {
      ruleListVisible: false,
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
