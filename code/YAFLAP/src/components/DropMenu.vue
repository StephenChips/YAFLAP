<template>
<ul class="drop-menu"
  :class="dropMenuClass"
  :style="dropMenuStyle">
  <li @click="$emit('set-node-type', NODE_TYPE.initial)">Set Initial</li>
  <li @click="$emit('set-node-type', NODE_TYPE.final)">Set Final</li>
  <li @click="$emit('set-node-type', NODE_TYPE.normal)">Set Normal</li>
  <li @click="$emit('set-node-type', NODE_TYPE.initFinal)">Set Initial-Final</li>
</ul>
</template>
<script>
import { NODE_TYPE } from '@/utils/enum'

export default {
  name: 'drop-menu',
  props: {
    dropMenuStyle: Object,
    dropMenuClass: Object,
    menuClass: Object
  },
  created () {
    this.NODE_TYPE = NODE_TYPE
  }
}
</script>
<style scoped>
</style>
