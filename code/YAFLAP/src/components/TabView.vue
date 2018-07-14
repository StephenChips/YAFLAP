<template>
  <div class="row">
    <div class="col s12">
      <ul class="tabs">
          <!-- Switch then emit -->
        <li class="tab col s3" v-for="tab in tabList"
          v-bind:key="tab.key"
          v-on:click="switchTag(tab, $event)">
          <a href="#" :class="{ active: tab.isActive }">{{ tab.title }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
export default {
  name: 'tab-view',
  props: {
    tabData: Array
  },
  methods: {
    switchPanel (tabInfo, $event) {
      this.tabList = this.tabList.map(tab => tab.refPanel === tabInfo.refPanel)
      if (this.refPanels.includes(tabInfo.name)) {
        this.$emit('switchPanel', tabInfo.refPanel)
      }
    }
  },
  computed: {
    refPanels () {
      return this.tabList.map(tab => tab.refPanels)
    },
    tabList () {
      return this.tabData.map((value, index) => Object.assign({ key: index }, value))
    }
  }
}
</script>
<style>

</style>
