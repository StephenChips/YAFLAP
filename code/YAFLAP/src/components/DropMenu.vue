<template>
<ul class="drop-menu"
  v-show="visible"
  :class="dropMenuClass"
  :style="dropMenuStyle">
  <li @click="$emit('setNodeType', { type: 'initial' })">Set Initial</li>
  <li @click="$emit('setNodeType', { type: 'final' })">Set Final</li>
  <li @click="$emit('setNodeType', { type: 'normal' })">Set Normal</li>
</ul>
</template>
<script>
export default {
  name: 'drop-menu',
  props: {
    dropMenuStyle: Object,
    dropMenuClass: Object,
    menuClass: Object,
    visible: Boolean
  }
}
</script>
<style scoped>

</style>
