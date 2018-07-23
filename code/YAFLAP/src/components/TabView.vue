<template>
  <ul class="tabs">
      <!-- Switch then emit -->
    <li class="tab col s3" v-for="tab in tabData"
      :id="tab.key"
      :key="tab.key"
      @click="switchTag(tab, $event)">
      <a href="#">{{ tab.title }}</a>
    </li>
  </ul>
</template>
<script>
import * as M from 'materialize-css'

export default {
  name: 'tab-view',
  props: {
    tabData: {
      type: Array,
      default: () => []
    }
  },
  mounted () {
    /** Non-reative property */
    this.delegate = M.Tabs.init(this.$el)
  },
  methods: {
    switchTag (tabInfo, $event) {
      this.delegate.select(tabInfo.id)
      this.$emit('switch-panel', { refPanel: tabInfo.refPanel })
    }
  }
}
</script>
<style>

</style>
