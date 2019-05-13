import Vue from 'vue'
import Router from 'vue-router'
import AutomataBoard from '@/components/AutomataBoard.vue'
import GeneratorBoard from '@/components/GeneratorBoard.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'AutomataBoard',
      component: AutomataBoard
    },
    {
      path: '/generators',
      name: 'GeneratorBoard',
      component: GeneratorBoard
    }
  ]
})
