<template>
  <div class="app">
      <div class="row">
        <side-panel class="col s3"></side-panel>
        <edit-board class="col s9"></edit-board>
      </div>
      <edit-mode-buttons></edit-mode-buttons>
  </div>
</template>
<script>
// '@' stands for the src directory, which is configured in /build/webpack.base.conf.js.
import SidePanel from '@/components/SidePanel'
import EditBoard from '@/components/EditBoard'
import EditModeButtons from '@/components/EditModeButtons'
export default {
  name: 'App',
  components: { SidePanel, EditBoard, EditModeButtons }
}
</script>
<style scoped>
</style>
