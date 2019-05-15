<template>
    <div class="panel">
        <section class="section" v-for="section of sections" v-bind:key="section.id">
          <h5 class="section-header">{{ section.title }}</h5>
          <p class="section-content">{{ section.content }}</p>
        </section>
    </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  name: 'attribute-panel',
  data () {
    return {
    }
  },
  computed: {
      ...mapState({
      automataType: state => state.AutomataStore.automataType,
      nodeCount: state => state.AutomataStore.nodeCount,
      edgeCount: state => state.AutomataStore.edgeCount,
    }),
    sections () {
      return [
        { id: 'automataType', title: 'Automata Type', content: this.automataType },
        { id: 'nodeCount', title: 'Node Count', content: this.nodeCount },
        { id: 'edgeCount', title: 'Edge Count', content: this.edgeCount }
      ]
    }
  }

}
</script>
<style scoped>
.panel {
  margin-top: 10px;
}
.section {
  margin-left: 5px;
  margin-right: 5px;
  padding: 0;
  box-sizing: border-box;
  border: 2px solid brown;
  margin-bottom: 8px;
  box-shadow: 1px 1px 1px black;
  border-radius: 3px;
}
.section-header {
  margin: 0;
  line-height: 50px;
  padding: 5px 3px;
  box-sizing: border-box;
  background: rgb(163, 33, 33);
  color: rgb(223, 223, 223);
  font-size: 26px;
  font-weight: 600;
  padding-left: 15px;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
}
.section-content {
  padding-left: 15px;
  font-family: 'Courier New', Courier, monospace;
  font-weight: 600;
}
</style>
