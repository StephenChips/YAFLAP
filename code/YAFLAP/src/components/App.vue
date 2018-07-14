<template>
  <div class="app">
      <side-panel
        :style="tabViewStyle"
        :class="tabViewClass"
      ></side-panel>
      <edit-board
        :style="editBoardStyle"
        :class="editBoardClass"
        :node-data="nodeData"
        :edge-data="edgeData"
        @update="updateBoardElement"
        @delete="deleteBoardElement"
        @insert="insertElementBoard"
      ></edit-board>
      <side-panel-button></side-panel-button>
      <edit-mode-buttons></edit-mode-buttons>
  </div>
</template>
<script>
// Configured in {root}/build/webpack.base.conf.js, '@' stands for the src directory.
import SidePanel from '@/components/SidePanel'
import EditBoard from '@/components/EditBoard'
import SidePanelButton from '@/components/SidePanelButton'
import EditModeButtons from '@/components/EditModeButtons'

export default {
  name: 'App',
  data () {
    return {
      styleValues: {
        main: { },
        tabView: { },
        editBoard: { }
      },
      tabViewClass: ['sidenav', 'sidenav-fixed'],
      editBoardClass: [''],
      nodeData: [],
      edgeData: [],
      nodeCount: 0,
      edgeCount: 0
    }
  },
  methods: {
    updateBoardElement (elInfo) {
      let type = elInfo.type
      let attrs = elInfo.attrs
      if (type === 'node') {
        if (attrs.posX || attrs.posY) {
          this.updateNodePosition(attrs.key, attrs.posX, attrs.posY)
        }
        if (attrs.label) {
          this.updateNodeLabel(attrs.key, attrs.label)
        }
        if (attrs.type) {
          this.updateNodeType(attrs.key, attrs.type)
        }
      } else if (type === 'edge') {
        if (attrs.label) {
          this.updateEdgeLabel(attrs.key, attrs.label)
        }
      }
    },
    deleteBoardElement (elInfo) {
      if (elInfo.type === 'node') {
        this.deleteNode(attrs.key)
      } else if (elInfo.type === 'edge') {
        this.deleteEdge(attrs.key)
      }
    },
    insertBoardElement (elInfo) {
      if (elInfo.type === 'node') {
        this.insertNode(elInfo.attrs)
      } else if (elInfo.type === 'edge') {
        this.insertEdge(elInfo.attrs)
      }
    },
    updateNodePosition (nodeKey, nodePosX, nodePosY) {

    },
    updateNodeType (nodeKey, nodeType) {

    },
    updateNodeLabel (nodeKey, label) {

    },
    updateEdgeLabel (edgeKey, label) {

    },
    deleteNode (nodeKey) {

    },
    deleteEdge (edgeKey) {

    },
    insertNode (nodeAttrs) {
      let key = this.generateNodeKey() // The key are generate automatically

      /** Mandatory properties */
      let posX = nodeAttrs.posX
      let posY = nodeAttrs.posY

      /** Optional properties */
      let type = nodeAttrs.type ? nodeAttrs.type : this.defaultValue.nodeType
      let label = nodeAttrs.label ? nodeAttrs.lable : this.defaultValue.label
    },
    insertEdge (edgeAttrs) {
      let key = this.generateEdgeKey() // The key are generate automatically

      /** Mandatory properties */
      let source = edgeAttrs.source
      let target = edgeAttrs.target
      /** Optional properties */
      let label = edgeAttrs.label ? edgeAttrs.label : this.defaultValue.edgeLabel
    },
    generateNodeKey () {
      return counter.next()
    },
    generateEdgeKey () {
      return counter.next()
    },
  },
  computed: {
    tabViewStyle () {
      return {}
    },
    editBoardStyle () {
      return {}
    }
  },
  components: {
    SidePanel, EditBoard, SidePanelButton, EditModeButtons
  }
}

let counter = {
  value: 0,
  next () { return this.value++ }
}
</script>
<style scoped>
</style>
