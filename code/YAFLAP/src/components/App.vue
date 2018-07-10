<template>
  <div class="app">
      <side-panel :style="tabViewStyle" :class="tabViewClass"></side-panel>
      <edit-board :style="editBoardStyle" :class="editBoardStyle"></edit-board>
      <side-panel-button></side-panel-button>
      <edit-mode-buttons></edit-mode-buttons>
  </div>
</template>

<script>
// Configured in {root}/build/webpack.base.conf.js, '@' stands for the src directory.
import TabView from '@/components/TabView'
import EditBoard from '@/components/EditBoard'
import SidePanelButton from '@/components/SidePanelButton'
import EditModeButtons from "@/compoments/EditModeButtons";
import R from '@/lib/ramda/ramda'

export default {
    name: 'App',
    data () {
        return {
            styleValues: { 
                main: { },
                tabView: { },
                editBoard: { }
            },
            tabViewClass: ['sidenav', 'sidenav-fixed'],
            editBoardClass: [''],
        }
    },
    computed: {
        tabViewStyle () {
            return {}
        },
        editBoardStyle () {
            return {}
        }
    },
    component: {
        TabView, EditBoard
    }
}
</script>

<style lang="sass" scoped>
.app {

}
</style>