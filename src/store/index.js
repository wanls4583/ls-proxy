import Vue from 'vue';
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    enableRule: false,
    enableBreak: false,
    autoPopBreak: false,
    enableScript: false,
  },
  mutations: {
    changeRuleEnable(state, enableRule) {
      state.enableRule = enableRule
    },
    changeBreakEnable(state, enableBreak) {
      state.enableBreak = enableBreak
    },
    changeAutoPopBreak(state, autoPopBreak) {
      state.autoPopBreak = autoPopBreak
    },
    changeScriptEnable(state, enableScript) {
      state.enableScript = enableScript
    }
  }
})