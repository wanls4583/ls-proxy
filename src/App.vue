<template>
  <div id="app">
    <div class="right-wrap">
      <ls-header />
      <type-filter />
      <record-table />
      <DialogRuleList :visible.sync="ruleListVisible" v-if="ruleListVisible" />
      <DialogBreakList :visible.sync="breakListVisible" v-if="breakListVisible" />
      <DialogScriptList :visible.sync="scriptListVisible" v-if="scriptListVisible" />
      <DialogRunBreak />
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
import * as monaco from 'monaco-editor';
import Header from './components/Header.vue'
import TypeFilter from './components/TypeFilter.vue'
import RecordTable from './components/RecordTable.vue'
import DialogRuleList from './components/rule/DialogRuleList.vue'
import DialogBreakList from './components/breakpoint/DialogBreakList.vue'
import DialogScriptList from './components/script/DialogScriptList.vue';
import DialogRunBreak from './components/breakpoint/DialogRunBreak.vue'
export default {
  name: 'App',
  components: {
    LsHeader: Header,
    TypeFilter,
    RecordTable,
    DialogRuleList,
    DialogBreakList,
    DialogScriptList,
    DialogRunBreak,
  },
  data() {
    return {
      ruleListVisible: false,
      breakListVisible: false,
      scriptListVisible: false,
    }
  },
  created() {
    let autoPopBreak = window.localStorage.getItem('autoPopBreak')
    this.changeAutoPopBreak(autoPopBreak === 'true')
    this.initEvent()
    this.initMonacoTheme()
  },
  methods: {
    ...mapMutations(['changeAutoPopBreak']),
    initEvent() {
      this.eventBus.$on('show-rule', () => {
        this.ruleListVisible = true
      })
      this.eventBus.$on('show-break-list', () => {
        this.breakListVisible = true
      })
      this.eventBus.$on('show-script-list', () => {
        this.scriptListVisible = true
      })
    },
    initMonacoTheme() {
      let themId = 'myTheme'
      monaco.editor.defineTheme(themId, {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: 'method-token', foreground: '#E54073' },
          { token: 'protocol-token', foreground: '#74ACE8' },
          { token: 'num-token', foreground: '#C99C6E' },
          { token: 'header-token', foreground: '#A0C180' },
        ],
        colors: {
          "editor.foreground": "#DFDFDF",
          "editor.background": "#2B2B2B",
          "editorCursor.foreground": "#EFAE22",
          "editor.lineHighlightBorder": "#00000000",
          "editor.lineHighlightBackground": "#00000000",
          "editorLineNumber.foreground": "#DFDFDF",
          "editorLineNumber.activeForeground": "#DFDFDF",
          // "editor.selectionBackground": "#EFAE22BB",
          // "editor.inactiveSelectionBackground": "#EFAE22BB",
          "scrollbarSlider.background": "#606060",
          "scrollbarSlider.hoverBackground": "#AEAEAE",
          "scrollbarSlider.activeBackground": "#C3C3C3",
        }
      })
      monaco.editor.setTheme(themId)
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
