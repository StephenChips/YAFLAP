<template>
  <div class="matching-panel">
    <h3 class="result">
      <div class="result-title">THE RESULT IS</div>
      <div class="result-content" :class="{ ok: result === 'ok', failed: result === 'failed' }">{{ result }}</div>
    </h3>
    <div class="matchbox-wrapper">
      <input class="matchbox" placeholder="Enter string to match" type="text" v-model="inputValue">
    </div>
  </div>
</template>
<script>
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
<style scoped>
.matching-panel {
  width: 300px;
}
.result {
  box-sizing: border-box;
  border: 10px solid brown;
  height: 160px;
  text-align: center;
  margin: 10px 0;
  position: relative;
  box-shadow: 3px 3px 0 black;
  background: rgb(237, 255, 248);
}
.result-content {
  font-size: 14px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 52px;
  font-style: italic;
}
.result-title {
  margin-top: 20px;
  font-size: 16px;
  font-weight: 400;
}
.matchbox-wrapper {
  margin: 30px auto;
  width: 100%;
  height: 40px;
  border: 3px solid brown;
  box-shadow: 3px 3px 0px black;
}
.matchbox {
  width: 100%;
  height: 100%;
  font-size: 16px;
  outline-color: transparent;
}
.ok {
  color: green;
}
.failed {
  color: red;
}
</style>
