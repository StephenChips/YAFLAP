<template>
  <ul class="tabs">
    <li v-for="tab of tabs" class="tab-item"
      :class="{ 'tab-item-selected': value === tab.id }"
      v-bind:key="tab.id"
      @click="$emit('input', tab.id)">
      <a href="javascript:void(0);">{{ tab.title }}</a>
    </li>
  </ul>
</template>
<script>
import * as M from 'materialize-css'

export default {
  name: 'tab-view',
  props: {
    tabs: {
      type: Array,
      default: () => []
    },
    value: {
      type: String,
      default: ''
    }
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
.tabs {
  display: flex;
  justify-content:space-evenly;
  align-items: center;
  flex-wrap: nowrap;
  height: 40px;
  box-shadow: 1px 1px 1px black;
  border-radius: 3px;
}
.tab-item {
  box-sizing: border-box;
  font-size: 18px;
  background: #bbbbbb;
  border: 2px solid brown;
  height: 100%;
  flex-grow: 1;
  flex-shrink: 1;
  text-align: center;
  line-height: 30px;
}

.tab-item a {
  color: whitesmoke;
}
.tab-item-selected {
  background: #777777;
}
</style>
