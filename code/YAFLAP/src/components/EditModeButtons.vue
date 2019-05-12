<template>
  <div class="fixed-action-btn">
    <a href="#" :class="['btn-floating', 'btn-large'].concat(this.currentTitledButton.colorClass)">
      <i class="large material-icons">{{ this.currentTitledButton.icon }}</i>
    </a>
    <ul>
      <li v-for="button of buttons" :key="button.mode">
        <a :class="['btn-floating'].concat(button.colorClass)" @click="$emit('input', button.mode)">
          <i class="material-icons">{{ button.icon }}</i>
        </a>
      </li>
    </ul>
  </div>
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
        { mode: 'create', icon: 'add', colorClass: ['amber'], },
        { mode: 'delete', icon: 'cancel', colorClass: ['red'] },
        { mode: 'edit', icon: 'edit', colorClass: ['blue', 'darken-1'] }
      ]
    }
  },
  mounted () {
    this.fab = M.FloatingActionButton.init(this.$el, {
      direction: 'top',
      hoverEnabled: true
    })
  },
  destoryed () {
    this.fab.destory();
  },
  computed: {
    currentTitledButton () {
      var result = this.buttons.find(button => button.mode === this.value)
      return result
    }
  }
}
</script>
