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
  box-shadow: 3px 3px 0px black;
  border-radius: 3px;
  padding: 0;
}
.tab-item {
  box-sizing: border-box;
  font-size: 17px;
  background: rgb(206, 238, 226);
  border: 2px solid brown;
  height: 100%;
  flex-grow: 1;
  flex-shrink: 1;
  text-align: center;
  line-height: 30px;
  list-style-type: none;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  letter-spacing: 1.1;
}

.tab-item > a {
  color: black;
  text-decoration: none;
}
.tab-item-selected {
  background: whitesmoke;
}
</style>
