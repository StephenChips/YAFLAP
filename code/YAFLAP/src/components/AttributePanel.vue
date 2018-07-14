<template>
    <div class="row">
        <section v-for="attr in autometaAttrs" :key="attr.key">
            <ul class="col s12">
                <li class="collection-item">{{ attr.name }}</li>
                <li class="collection-item">{{ attr.value }}</li>
            </ul>
        </section>
    </div>
</template>
<script>
export default {
  name: 'AttributePanel',
  props: {
    autometaType: {
      type: String,
      default: 'unknown'
    },
    nodeCount: {
      type: Number,
      default: 0
    },
    edgeCount: {
      type: Number,
      default: 0
    }
  },
  computed: {
    autometaAttrs () {
      let capitalize = str => str[0].toLocaleUpperCase() + str.slice(1)
      return [
        { key: 0, name: 'Autometa Type', value: capitalize(this.autometaType) },
        { key: 1, name: 'Node Count', value: this.nodeCount },
        { key: 2, name: 'Edge Count', value: this.edgeCount }
      ]
    }
  }
}
</script>

<style>

</style>
