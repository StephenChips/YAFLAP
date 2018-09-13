<template>
    <div class="matching-panel">
      <h3>{{ result }}</h3>
    <div class="input-field col s12">
      <input id="matchbox" placeholder="Enter string here..." type="text"
        @input="this.dispatch('matchString', $event)"
        :value="string">
      <label for="matchbox">match</label>
    </div>
  </div>
</template>
<script>
export default {
  name: 'matching-panel',
  computed: {
    result () {
      return this.$store.autometaStore.matchPair.result
    },
    string () {
      return this.$store.autometaStore.matchPair.string
    }
  }
}
</script>
