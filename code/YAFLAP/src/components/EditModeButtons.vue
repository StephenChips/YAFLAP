<template>
  <ul class="edit-mode-buttons">
    <li class="edit-mode-button-item" :class="{ 'edit-mode-button-item-selected': value === button.mode }"  v-for="button of buttons" :key="button.mode">
      <a  @click="$emit('input', button.mode)">
        {{ button.title }}
      </a>
    </li>
    <li class="clearfix" style="list-style-type: none"></li>
  </ul>
</template>
<script>
export default {
  name: 'edit-mode-button',
  props: {
    value: {
      type: String,
      default: 'add'
    }
  },
  data () {
    return {
      buttons: [
        { mode: 'create', title: 'Add', colorClass: ['amber'], },
        { mode: 'delete', title: 'cancel', colorClass: ['red'] },
        { mode: 'edit', title: 'Edit', colorClass: ['blue', 'darken-1'] }
      ]
    }
  },
  mounted () {
    this.fab = M.FloatingActionButton.init(this.$el, {
      direction: 'top',
      hoverEnabled: true
    })
  },
  computed: {
    currentTitledButton () {
      var result = this.buttons.find(button => button.mode === this.value)
      return result
    }
  }
}
</script>
<style scoped>
.edit-mode-buttons {
  padding: 0px;
  border-radius: 5px;
  border: 2px solid brown;
  background: #bbbbbb;
  box-shadow: 2px 2px 0 black;
}
.edit-mode-button-item {
  float: left;
  border-right: 1px solid brown;
  padding: 5px 10px;
  list-style-type: none;
  cursor: pointer;
}
.edit-mode-button-item > a {
  color: white;
}
.edit-mode-button-item-selected {
  background-color: #777777;
}
.clearfix {
  clear: both;
}
</style>

