<template>
  <div class="app">
      <div class="row">
        <side-panel class="col s3"></side-panel>
        <edit-board class="col s9"
          ref="editBoard"
          :state="editBoardState"
          @add-node="addNode"
          @remove-node="removeNode"
          @add-edge="addEdge"
          @remove-edge="removeEdge"
          @set-node="setNode"
          @set-edge="setEdge"
        ></edit-board>
      </div>
      <edit-mode-buttons v-model="editBoardState"></edit-mode-buttons>
  </div>
</template>
<script>
// '@' stands for the src directory, which is configured in /build/webpack.base.conf.js.
import SidePanel from '@/components/SidePanel.vue'
import EditBoard from '@/components/EditBoard.vue'
import EditModeButtons from '@/components/EditModeButtons.vue'
import { mapActions } from 'vuex'
import { Node, Edge } from '@/Automata.js'

function mapNode (node) {
  var type;
  if (node.type === 'finish') {
    type = 'final'
  } else if (node.type === 'start') {
    type = 'initial'
  } else if (node.type === 'normal') {
    type = 'normal'
  } else if (node.type === 'start-finish') {
    type = 'init final'
  }
  return new Node(node.id, type)
}

function getTrans (label) {
  var split = label.split(',');
  var transition = [];
  for (var str of split) {
    var match = str.match(/[^\s]/);
    if (match !== null) {
      transition.push(match[0] === 'ε' ? '' : match[0])
    }
  }
  return transition;
}

function mapEdge (edge) {
  var trans = getTrans(edge.label);
  return new Edge(edge.source, edge.target, new Set(getTrans(edge.label)))
}

export default {
  name: 'App',
  data () {
    return {
      editBoardState: 'edit'
    }
  },
  methods: {
    addNode (node) {
      this.$store.dispatch('addNode', mapNode(node))
    },
    addEdge (edge) {
      this.$store.dispatch('addEdge', mapEdge(edge))
    },
    removeNode (node) {
      this.$store.dispatch('removeNode', node.id)
    },
    removeEdge (edge) {
      this.$store.dispatch('removeEdge', { source: edge.source, target: edge.target })
    },
    setNode (node) {
      if (node.type !== undefined) {
        this.$store.dispatch('setNodeType', mapNode(node))
      }
    },
    setEdge (edge) {
      if (edge.label !== undefined) {
        this.$store.dispatch('setEdgeTransition', mapEdge(edge))
      }
    },
  },
  components: { SidePanel, EditBoard, EditModeButtons }
}
</script>
<style scoped>
</style>