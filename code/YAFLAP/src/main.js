/* eslint-disable */
import Vue from 'vue'
import App from '@/components/App'
import { store } from '@/store/index'
import router from '@/router/index'

var vm = new Vue({
  el: '#app',
  store,
  router,
  components: { App }
})

console.log('Vue instance is created')
