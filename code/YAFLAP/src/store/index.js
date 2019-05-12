import Vuex from 'vuex'
import Vue from 'vue'
import AutomataStore from '@/store/modules/Automata'

Vue.use(Vuex)
export const store = new Vuex.Store({
  modules: {
    AutomataStore
  }
})
