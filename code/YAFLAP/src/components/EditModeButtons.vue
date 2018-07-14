<template>
  <div class="fixed-action-btn" id="mode-selection">
    <a href="#" class="btn-floating blue darken-1 btn-large" id="current-mode-button"><i class="large material-icons">edit</i></a>
    <ul>
      <li @click="emit('switch-mode', 'add')">
        <a class="btn-floating amber"><i class="material-icons">add</i></a>
      </li>
      <li @click="emit('switch-mode', 'remove')">
        <a class="btn-floating red"><i class="material-icons">clear</i></a>
      </li>
      <li @click="emit('switch-mode', 'edit')">
        <a class="btn-floating blue darken-1"><i class="material-icons">edit</i></a>
      </li>
    </ul>
  </div>
</template>
<script>
export default {
  name: 'edit-mode-button'
}
</script>
<style scoped>

</style>
