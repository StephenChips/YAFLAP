<template>
  <div class="fixed-action-btn">
    <a href="#" class="btn-floating blue darken-1 btn-large" id="current-mode-button">
      <i class="large material-icons">edit</i>
    </a>
    <ul>
      <li @click="updateEditMode(EDIT_MODE.add)">
        <a class="btn-floating amber"><i class="material-icons">add</i></a>
      </li>
      <li @click="updateEditMode(EDIT_MODE.delete)">
        <a class="btn-floating red"><i class="material-icons">clear</i></a>
      </li>
      <li @click="updateEditMode(EDIT_MODE.edit)">
        <a class="btn-floating blue darken-1"><i class="material-icons">edit</i></a>
      </li>
    </ul>
  </div>
</template>
<script>
import * as M from 'materialize-css'
import { EDIT_MODE } from '@/utils/enum'
export default {
  name: 'edit-mode-button',
  created () {
    this.EDIT_MODE = EDIT_MODE
  },
  mounted () {
    this.delegate = M.FloatingActionButton.init(this.$el, {
      direction: 'top',
      hoverEnabled: true
    })
  },
  methods: {
    updateEditMode (mode) {
      this.$store.commit('updateEditMode', mode)
    }
  }
}
</script>
