import { MATCH_RESULT, AUTOMETA_TYPE, autometa } from '@/Autometa'
export const autometaStore = {
  state: {
    nodeCount: 0,
    edgeCount: 0,
    autometaType: AUTOMETA_TYPE.empty,
    matchPair: { str: '', result: MATCH_RESULT.unknown }
  },
  mutations: {
    updateNodeCount (state, count) {
      state.nodeCount = count
    },
    updateEdgeCount (state, count) {
      state.edgeCount = count
    },
    updateAutometaType (state, type) {
      state.autometaType = type
    },
    updateMatchString (state, str) {
      state.matchPair.str = str
    },
    updateMatchResult (state, result) {
      state.matchPair.result = result
    }
  },
  actions: {
    matchString ({ commit, state }, str) {
      if (str) {
        state.matchPair.str = str
      }
      commit('updateMatchResult', autometa.matchWholeString(state.matchPair.str))
    }
  }
}
