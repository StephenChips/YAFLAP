<template>
    <div class="matching-panel">
      <h3>{{ matchResult }}</h3>
    <div class="input-field col s12">
      <input id="matchbox" :placeholder="prompt" type="text" :class="inputFieldClass" v-model="inputedString">
      <label for="matchbox">match</label>
    </div>
  </div>
</template>
<script>
import { autometa } from '@/AutometaDecorator'
import { MATCH_RESULT } from '@/Autometa'

export default {
  name: 'matching-panel',
  data () {
    return {
      inputedString: '',
      prompt: 'Enter string here...'
    }
  },
  computed: {
    matchResult () {
      return autometa.matchWholeString(this.inputedString)
    },
    inputFieldClass () {
      return this.matchResult === MATCH_RESULT.ok ? 'valid' : 'invalid'
    }
  }
}
</script>
<style scoped>
</style>
