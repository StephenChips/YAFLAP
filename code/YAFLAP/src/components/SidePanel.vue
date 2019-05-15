<template>
  <div class="side-panel">
    <div>
      <h3 class="title">{{ title }}</h3>
      <p>{{ websideDesc }}</p>
    </div>
    <tab-view :tabs="tabs" v-model="currentSidePanel"></tab-view>
    <keep-alive>
      <component v-bind:is="currentSidePanel"></component>
    </keep-alive>
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
      title: 'YAFLAP',
      websideDesc: 'Yet Another Formal Lanuage and Automata Package',
      currentSidePanel: 'AttributePanel',
      tabs: [
        { id: 'AttributePanel', title: 'Attribute' },
        { id: 'MatchingPanel', title: 'Match' },
        { id: 'GeneratorPanel', title: 'Generator' }
      ],
    }
  },
  components: { TabView, AttributePanel, MatchingPanel, GeneratorPanel }
}
</script>
<style scoped>
.panels {
  margin-top: 30px;
  width: 90%;
}
.title {
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  font-size: 40px;
  margin: 10px 0;
}
</style>
