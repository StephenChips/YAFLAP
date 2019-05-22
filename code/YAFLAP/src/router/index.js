import Vue from 'vue'
import Router from 'vue-router'
import AutomataBoard from '@/components/AutomataBoard.vue'
import LL1TableBoard from '@/components/LL1TableBoard.vue'
import ParserBoard from '@/components/ParserBoard.vue'
import GeneratorBoard from '@/components/GeneratorBoard.vue'
import HomePage from '@/components/HomePage.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: { name: 'HomePage' }
    },
    {
      path: '/home',
      name: 'HomePage',
      component: HomePage
    },
    {
      path: '/automata',
      name: 'AutomataBoard',
      component: AutomataBoard
    },
    {
      path: '/generators',
      name: 'GeneratorBoard',
      component: GeneratorBoard
    },
    {
      path: '/parser',
      name: 'ParserBoard',
      component: ParserBoard
    },
    {
      path: '/ll1-tables',
      name: 'LL1TableBoard',
      component: LL1TableBoard
    }
  ]
})
