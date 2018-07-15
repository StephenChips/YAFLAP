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
import Autometa from '@/Autometa.js'

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
      edgeCount: 0,
      autometa: Autometa.autometa
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
        this.deleteNode(elInfo.attrs.key)
      } else if (elInfo.type === 'edge') {
        this.deleteEdge(elInfo.attrs.key)
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
      /** Update nodes */
      this.nodeData = this.nodeData.map(node => {
        if (node.key === nodeKey) {
          return Object.assign({ posX: nodePosX, posY: nodePosY }, node)
        } else {
          return node
        }
      })

      /** Update adjcency edges */
      this.edgeData = this.edgeData.map(edge => {
        if (edge.soruce === nodeKey) {
          return Object.assign({ x0: nodePosX, y0: nodePosY }, edge)
        } else if (edge.target === nodeKey) {
          return Object.assign({ x1: nodePosX, y1: nodePosY }, edge)
        } else {
          return edge
        }
      })
    },
    updateNodeType (nodeKey, nodeType) {
      this.nodeData = this.nodeData.map(node => {
        if (node.key === nodeKey) {
          return Object.assign({ type: nodeType }, node)
        } else {
          return node
        }
      })
    },
    updateNodeLabel (nodeKey, nodeLabel) {
      this.nodeData = this.nodeData.map(node => {
        if (node.key === nodeKey) {
          return Object.assign({ label: nodeLabel }, node)
        } else {
          return node
        }
      })
    },
    updateEdgeLabel (edgeKey, edgeLabel) {
      this.edgeData = this.edgeData.map(edge => {
        if (edge.key === edgeKey) {
          return Object.assgin({ label: edgeLabel }, edge)
        } else {
          return edge
        }
      })
    },
    deleteNode (nodeKey) {
      this.nodeData = this.nodeData.filter(node => node.key !== nodeKey)
    },
    deleteEdge (edgeKey) {
      this.edgeData = this.edgeData.filter(edge => edge.key !== edgeKey)
    },
    insertNode (nodeAttrs) {
      let key = ++this.nodeCount // The key are generate automatically

      /** Mandatory properties */
      let posX = nodeAttrs.posX
      let posY = nodeAttrs.posY

      /** Optional properties */
      let type = nodeAttrs.type ? nodeAttrs.type : this.defaultValue.nodeType
      let label = nodeAttrs.label ? nodeAttrs.lable : this.defaultValue.label

      let newNode = { key, posX, posY, type, label }
      this.nodeData.push(newNode)
      /** update internal autometa */
    },
    insertEdge (edgeAttrs) {
      let key = ++this.edgeCount // The key are generate automatically

      /** Mandatory properties */
      let source = edgeAttrs.source
      let target = edgeAttrs.target
      /** Optional properties */
      let label = edgeAttrs.label ? edgeAttrs.label : this.defaultValue.edgeLabel

      let d = this.calculatePath(source, target)
      let newEdge = { key, d, label }
      this.edgeData.push(newEdge)
    },
    calculatePath (source, target) {
      if (this.allNodesExist(source, target)) {
        let edgeBetweenTwoNodes = this.nodeData.filter(node => [source, target].includes(node.key))
      }
    },
    allNodesExist () {
      let nodeKeys = Array.from(arguments)
      let length = this.node.length
      let i, j
      i = j = 0
      for (; i < length; i++) {
        for (; j < length; j++) {
          if (this.nodeData.key === nodeKeys[j]) {
            break
          }
        }
      }
      return j === length
    }
  },
  computed: {
    tabViewStyle () {
      return {}
    },
    editBoardStyle () {
      return {

      }
    }
  },
  components: { SidePanel, EditBoard, SidePanelButton, EditModeButtons }
}
</script>
<style scoped>
</style>
