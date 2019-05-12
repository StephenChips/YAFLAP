<template>
    <div class="matching-panel">
      <h3>{{ result }}</h3>
    <div class="input-field col s12">
      <input id="matchbox" placeholder="Enter string here..." type="text"
        v-model="inputValue">
      <label for="matchbox">match</label>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex';
export default {
  name: 'matching-panel',
  data () {
    return {
      inputValue: ''
    }
  },
  computed: {
    result () {
      return this.$store.state.AutomataStore.matchPair.result
    },
    str () {
      return this.$store.state.AutomataStore.matchPair.str
    }
  },
  watch: {
    inputValue (value) {
      this.$store.dispatch('matchString', value)
    }
  }
}
</script>
