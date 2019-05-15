<template>
<ul class="drop-menu">
  <li class="drop-menu-item" v-for="item of items" :Key="item.key" @click="$emit('click-item', item.key)">
    {{ item.title }}
  </li>
</ul>
</template>
<script>
import { NODE_TYPE } from '@/utils/enum'

export default {
  name: 'drop-menu',
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  created () {
    this.NODE_TYPE = NODE_TYPE
  }
}
</script>
<style scoped>
.drop-menu-item {
  padding: 6px 8px;
  font-size: 14px;
  text-align: center;
  border-bottom: 1px black solid;
  list-style-type: none;
}

.drop-menu-item:hover {
  background-color:#EAEAEA;
}

.drop-menu {
  border: 1px #AE20BB solid;
  margin-bottom: 10px;
  background-color: #FFFFFF;
  border-radius: 3px;
  box-shadow: 3px 3px 0 black;
  padding: 0;
}
</style>
