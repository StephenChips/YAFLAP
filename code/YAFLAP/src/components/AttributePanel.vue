<template>
    <div class="row">
        <section>
            <ul class="col s12">
                <li class="collection-item">Autometa Type</li>
                <li class="collection-item">{{ autometaType }}</li>
            </ul>
        </section>
        <section>
            <ul class="col s12">
                <li class="collection-item">Node Count</li>
                <li class="collection-item">{{ nodeCount }}</li>
            </ul>
        </section>
        <section>
            <ul class="col s12">
                <li class="collection-item">Edge Count</li>
                <li class="collection-item">{{ edgeCount }}</li>
            </ul>
        </section>
    </div>
</template>
<script>
import { messageBus } from '@/utils/bus'
import { autometa } from '@/AutometaDecorator'

export default {
  name: 'attribute-panel',
  data () {
    return {
      autometaType: autometa.type,
      nodeCount: autometa.nodeCount,
      edgeCount: autometa.edgeCount
    }
  },
  mounted () {
    let that = this
    messageBus.$on('update-edge-count', function (count) {
      that.edgeCount = count
    })
    messageBus.$on('update-node-count', function (count) {
      that.nodeCount = count
    })
    messageBus.$on('update-autometa-type', function (type) {
      that.autometaType = type
    })
  }
}
</script>

<style>

</style>
