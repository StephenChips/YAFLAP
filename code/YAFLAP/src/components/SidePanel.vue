<template>
  <div class="side-panel">
    <div class="row center-align">
      <h3 class="col s12 title">{{ title }}</h3>
      <p class="col s12 grey-text caption">{{ websideDesc }}</p>
    </div>
    <tab-view :tab-data="tabData"></tab-view>
    <component :is="currentPanel"></component>
  </div>
</template>
<script>
import TabView from '@/components/TabView'
import AttributePanel from '@/components/AttributePanel'
import MatchingPanel from '@/components/MatchingPanel'
import GeneratorPanel from '@/components/GeneratorPanel'

export default {
  name: 'side-panel',
  data () {
    return {
      currentPanel: 'AttributePanel',
      title: 'YAFLAP',
      websideDesc: 'Yet Another Formal Lanuage and Autometa Package',
      tabData: [
        { refPanel: 'Attribute', title: 'Attribute', isActive: true },
        { refPanel: 'Match', title: 'Match', isActive: false },
        { refPanel: 'Generate', title: 'Generator', isActive: false }
      ]
    }
  },
  components: { TabView, AttributePanel, MatchingPanel, GeneratorPanel }
}
</script>
<style scoped>
</style>
