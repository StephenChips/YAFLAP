/* eslint-disable */
import Vue from 'vue'
import App from '@/components/App'
import { store } from '@/store/index'

var vm = new Vue({
  el: '#app',
  store,
  components: { App }
})
console.log('Vue instance is created')
