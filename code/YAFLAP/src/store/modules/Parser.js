export default {
  state: {
    sourceCode: '',
    tokenList: []
  },
  mutations: {
    setSourceCode (str) {
      this.sourceCode = str
    },
    setTokenList (tokList) {
      this.tokList = tokList
    }
  },
  actions: {
    parse ({ commit, state }, code) {
      
    }
  }
}