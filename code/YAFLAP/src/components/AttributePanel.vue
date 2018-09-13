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
import { mapState } from 'vuex'
export default {
  name: 'attribute-panel',
  computed: mapState({
    autometaType: state => state.autometaStore.autoemtaType,
    nodeCount: state => state.autometaStore.nodeCount,
    edgeCount: state => state.autometaStore.edgeCount
  })
}
</script>

<style>

</style>
