import Vuex from 'vuex'
import Vue from 'vue'
import { autometaStore } from '@/store/modules/Autometa'
import { editBoardStore } from '@/store/modules/EditBoard'
import { errorStore } from '@/store/modules/Error'

Vue.use(Vuex)
export const store = new Vuex.Store({
  modules: {
    autometaStore,
    editBoardStore,
    errorStore
  }
})
