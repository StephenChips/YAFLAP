<template>
    <div class="row">
        <div class="input-field col s12 ">
            <input :placeholder="prompt" type="text" :class="inputFieldClass" v-model="inputedString">
            <label for="matchbox">match</label>
        </div>
    </div>
</template>
<script>
export default {
  name: 'MatchingPanel',
  data () {
    return {
      inputedString: String,
      prompt: String,
      inputFieldClass: {
        validate: false
      }
    }
  }
}
</script>
<style scoped>

</style>
