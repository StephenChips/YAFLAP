<template>
  <div class="side-panel z-depth-2">
    <div class="row center-align">
      <h3 class="col s12 title">{{ title }}</h3>
      <p class="col s12 grey-text caption">{{ websideDesc }}</p>
    </div>
    <div class="row">
      <tab-view
        :tab-data="tabData"
        @switch-panel="switchPanel"
      ></tab-view>
    </div>
    <div class="row">
      <attribute-panel v-if="activePanel === ACTIVE_PANEL.attributePanel" ></attribute-panel>
      <matching-panel v-else-if="activePanel === ACTIVE_PANEL.matchingPanel"></matching-panel>
      <generator-panel v-else-if="activePanel === ACTIVE_PANEL.generatorPanel"></generator-panel>
    </div>
  </div>
</template>
<script>
import TabView from '@/components/TabView'
import AttributePanel from '@/components/AttributePanel'
import MatchingPanel from '@/components/MatchingPanel'
import GeneratorPanel from '@/components/GeneratorPanel'
import { AUTOMETA_TYPE } from '@/utils/enum'

const ACTIVE_PANEL = {
  attributePanel: 'attributePanel',
  matchingPanel: 'matchingPanel',
  generatorPanel: 'generatorPanel'
}

export default {
  name: 'side-panel',
  data () {
    return {
      activePanel: ACTIVE_PANEL.attributePanel,
      title: 'YAFLAP',
      websideDesc: 'Yet Another Formal Lanuage and Autometa Package',
      tabData: [
        { key: 'attribute-tab', refPanel: ACTIVE_PANEL.attributePanel, title: 'Attribute' },
        { key: 'match-tab', refPanel: ACTIVE_PANEL.matchingPanel, title: 'Match' },
        { key: 'generate-tab', refPanel: ACTIVE_PANEL.generatorPanel, title: 'Generator' }
      ]
    }
  },
  created () {
    this.AUTOMETA_TYPE = AUTOMETA_TYPE
    this.ACTIVE_PANEL = ACTIVE_PANEL
  },
  methods: {
    switchPanel (eventArgs) {
      this.activePanel = eventArgs.refPanel
    }
  },
  components: { TabView, AttributePanel, MatchingPanel, GeneratorPanel }
}
</script>
<style scoped>
</style>
