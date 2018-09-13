export let errorStore = {
  state: {
    message: undefined
  },
  mutations: {
    updateErrorMsg (state, msg) {
      state.message = msg
    }
  },
  actions: {
    raiseError ({ commit, clearError }, message) {
      commit('updateErrorMsg', message)
      console.error(message)
      clearError()
    },
    clearError ({ commit }) {
      commit('updateErrorMsg', undefined)
    }
  },
  getters: {
    isError: state => state.message !== undefined
  }
}
