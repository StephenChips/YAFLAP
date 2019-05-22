<template>
<div>
  <h1>Welcome to Visual Compiler</h1>
  <h5>A Tool Dedicate to Demonstrate Ideas and Concepts of Compiling!</h5>
  <router-link :to="{ name: 'AutomataBoard' }">Go to Automata Page</router-link>
  <router-link :to="{ name: 'ParserBoard' }">Go to Iki Parser Page</router-link>
  <router-link :to="{ name: 'LL1TableBoard' }">Go to LL(1) Page</router-link>
</div>
</template>

<script>
export default {

}
</script>

<style>

</style>
