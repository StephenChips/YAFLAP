<template>
<div class="row">
  <p class="col s12">
    <button @click="$router.push('/generators')">Go to generator page >>></button>
  </p>
</div>
</template>
<script>
export default {
  name: 'generator-panel'
}
</script>
<style scoped>
button {
  display: block;
  width: 100%;
  height: 50px;
  font-size: 20px;
  font-style: italic;
  border: 3px solid rgb(102, 38, 38);
  background-color: rgb(206, 238, 226);
  box-shadow: 3px 3px 0 black;
}
button:hover {
  box-shadow: 3px 3px 1px #999999;
}
button:active {
  box-shadow: 3px 3px 1px #999999;
  background-color: rgb(130, 100, 70);
}
</style>
