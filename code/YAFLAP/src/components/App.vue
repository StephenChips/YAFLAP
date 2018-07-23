<template>
  <div class="app">
      <div class="row">
        <side-panel class="col s3"></side-panel>
        <edit-board
          class="col s9"
          :node-data="nodeData"
          :edge-data="edgeData"
          :edit-mode="editMode"
          @update-node="updateNode"
          @update-edge="updateEdge"
          @delete-node="deleteNode"
          @delete-edge="deleteEdge"
          @insert-node="insertNode"
          @insert-edge="insertEdge"
      ></edit-board>
      </div>
      <edit-mode-buttons
        @switch-mode="switchMode"
      ></edit-mode-buttons>
  </div>
</template>
<script>
// Configured in {root}/build/webpack.base.conf.js, '@' stands for the src directory.
import SidePanel from '@/components/SidePanel'
import EditBoard from '@/components/EditBoard'
import EditModeButtons from '@/components/EditModeButtons'
import * as D3Path from 'd3-path'
import { LINE_STYLE, EDIT_MODE, NODE_TYPE } from '@/utils/enum'
import { autometa } from '@/AutometaDecorator'
import {
  Node as AutometaNode,
  Edge as AutometaEdge,
  NODE_TYPE as AUTOMETA_NODE_TYPE
} from '@/Autometa'

export default {
  name: 'App',
  data () {
    return {
      styleValues: {
        main: { },
        tabView: { },
        editBoard: { }
      },
      nodeData: [],
      edgeData: [],
      nodeCount: autometa.nodeCount,
      edgeCount: autometa.edgeCount,
      editMode: EDIT_MODE.edit,
      defaultValue: {
        nodeType: NODE_TYPE.normal,
        nodeLabel: 'node',
        edgeLabel: 'ε'
      }
    }
  },
  created () {
    // Some properties that aren't reative
    this.EDIT_MODE = EDIT_MODE
    this.LINE_STYLE = LINE_STYLE
    this.NODE_TYPE = NODE_TYPE
    this.autometa = autometa
  },
  methods: {
    updateNode (nodeAttr) {
      function getAutometaNodeType (nodeType) {
        if (nodeType === NODE_TYPE.initial) {
          return AUTOMETA_NODE_TYPE.initial
        } else if (nodeType === NODE_TYPE.final) {
          return AUTOMETA_NODE_TYPE.final
        } else if (nodeType === NODE_TYPE.normal) {
          return AUTOMETA_NODE_TYPE.normal
        } else if (nodeType === NODE_TYPE.initFinal) {
          return AUTOMETA_NODE_TYPE.initFinal
        }
      }
      let oldNodeIndex = this.nodeData.findIndex(node => node.key === nodeAttr.key)
      let oldNode = this.nodeData[oldNodeIndex]
      let newNode = new Node(Object.assign(oldNode, nodeAttr))
      this.$set(this.nodeData, oldNodeIndex, newNode)
      if (nodeAttr.posX || nodeAttr.posY) {
        this.updateAdjcencyEdges(newNode)
      }
      if (nodeAttr.type) {
        autometa.updateNode({
          key: nodeAttr.key,
          type: getAutometaNodeType(nodeAttr.type)
        })
      }
    },
    updateEdge (edgeAttr) {
      let oldEdgeIndex = this.edgeData.findIndex(edge => edge.key === edgeAttr.key)
      let oldEdge = this.edgeData[oldEdgeIndex]
      let newEdge = new Edge(Object.assign(oldEdge, edgeAttr))
      this.$set(this.edgeData, oldEdgeIndex, newEdge)
      if (edgeAttr.label) {
        let transition = parseTransition(edgeAttr.label)
        let key = { source: newEdge.sourceKey, target: newEdge.targetKey }
        if (transition.every(str => str.length === 1)) {
          autometa.updateEdge({ key, transition })
        } else {
          /** Pop up error */
        }
      }
    },
    updateAdjcencyEdges (node) {
      this.edgeData = this.edgeData.map(edge => {
        if (edge.sourceKey === node.key && edge.targetKey === node.key) {
          return new Edge(Object.assign(edge, { x0: node.posX, y0: node.posY, x1: node.posX, y1: node.posY }))
        } else if (edge.sourceKey === node.key) {
          return new Edge(Object.assign(edge, { x0: node.posX, y0: node.posY }))
        } else if (edge.targetKey === node.key) {
          return new Edge(Object.assign(edge, { x1: node.posX, y1: node.posY }))
        } else {
          return edge
        }
      })
    },
    deleteNode (nodeAttr) {
      this.nodeData = this.nodeData.filter(node => node.key !== nodeAttr.key)
      // Delete adjcency edges
      this.edgeData = this.edgeData.filter(edge =>
        edge.sourceKey !== nodeAttr.key &&
        edge.targetKey !== nodeAttr.key
      )
      autometa.deleteNode(nodeAttr.key)
    },
    deleteEdge (edgeAttr) {
      let indexOfEdge = this.edgeData.findIndex(edge => edge.key)
      let edgeShouldBeDeleted = this.edgeData[indexOfEdge]
      if (indexOfEdge === -1) {
        return
      } else {
        let indexOfReversedEdge = this.edgeData.findIndex(edge =>
          edgeShouldBeDeleted.source === edge.target &&
          edgeShouldBeDeleted.target === edge.source)
        let reversedEdge = this.edgeData[indexOfReversedEdge]
        let newEdge = new Edge(Object.assign(reversedEdge, { lineStyle: LINE_STYLE.straightLine }))
        if (indexOfReversedEdge !== -1) {
          this.$set(this.edgeData, indexOfReversedEdge, newEdge)
          this.edgeData.splice(indexOfReversedEdge, 1)
        }
      }
      this.edgeData = this.edgeData.filter(edge => edge.key !== edgeAttr.key)
      autometa.deleteEdge({
        source: edgeShouldBeDeleted.sourceKey,
        target: edgeShouldBeDeleted.targetKey
      })
    },
    insertNode (nodeAttrs) {
      let key = keyGenerator.generate().toString() // The key are generate automatically

      /** Mandatory properties */
      let posX = nodeAttrs.posX
      let posY = nodeAttrs.posY

      /** Optional properties */
      let type = nodeAttrs.type ? nodeAttrs.type : this.defaultValue.nodeType
      let label = nodeAttrs.label ? nodeAttrs.label : this.defaultValue.nodeLabel

      /** Insert node */
      this.nodeData.push(new Node({
        key, posX, posY, type, label
      }))
      autometa.insertNode(new AutometaNode(key, type))
    },
    insertEdge (edgeAttrs) {
      let key = keyGenerator.generate().toString()

      /** Mandatory properties */
      let source = this.nodeData.find(node => node.key === edgeAttrs.sourceKey)
      let target = this.nodeData.find(node => node.key === edgeAttrs.targetKey)
      /** Optional properties */
      let label = edgeAttrs.label ? edgeAttrs.label : this.defaultValue.edgeLabel
      let transition = parseTransition(label)

      if (source && target) {
        let indexOfReversedEdge, lineStyle
        let sameEdge = this.edgeData.find(edge =>
          edge.sourceKey === source.key &&
          edge.targetKey === target.key
        )
        if (sameEdge) return
        indexOfReversedEdge = this.edgeData.findIndex(edge =>
          edge.sourceKey === target.key &&
          edge.targetKey === source.key
        )
        if (indexOfReversedEdge !== -1) {
          // If there is a reversed edge in array, repaint it as a upward curve, and paint the new edge as downward edge.
          let reversedEdge = this.edgeData[indexOfReversedEdge]
          let newEdge = new Edge(Object.assign(reversedEdge, {
            lineStyle: LINE_STYLE.upwardCurve
          }))
          this.$set(this.edgeData, indexOfReversedEdge, newEdge)
          lineStyle = LINE_STYLE.downwardCurve
        } else {
          lineStyle = LINE_STYLE.straightLine
        }
        this.edgeData.push(new Edge({
          key,
          label,
          lineStyle,
          sourceKey: source.key,
          targetKey: target.key,
          x0: source.posX,
          y0: source.posY,
          x1: target.posX,
          y1: target.posY
        }))
        autometa.insertEdge(new AutometaEdge(source.key, target.key, transition))
      }
    },
    switchMode (mode) {
      this.editMode = mode
    }
  },
  components: { SidePanel, EditBoard, EditModeButtons }
}
/*  Edge's Attributes:
 *   key: edge's identifier/key (mandatory)
 *   label: Edge's label (optional)
 */
function Edge (edgeAttrs) {
  function setDefault (edge) {
    edge.lineStyle = LINE_STYLE.straightLine
  }
  const attributes = ['key', 'label', 'sourceKey', 'targetKey', 'x0', 'y0', 'x1', 'y1', 'lineStyle']
  Object.defineProperties(this, {
    lineStyle: {
      get () {
        return this._lineStyle
      },
      set (lineStyle) {
        if (this.sourceKey !== this.targetKey) {
          this._lineStyle = lineStyle
        } else {
          this._lineStyle = LINE_STYLE.ring
        }
      }
    },
    d: {
      get () {
        if (this.lineStyle === LINE_STYLE.ring) {
          return this._renderRing()
        } else if (this.lineStyle === LINE_STYLE.straightLine) {
          return this._renderStraightLine()
        } else if (this.lineStyle === LINE_STYLE.upwardCurve) {
          return this._renderCurve('upwardCurve')
        } else if (this.lineStyle === LINE_STYLE.downwardCurve) {
          return this._renderCurve('downwardCurve')
        }
      }
    }
  })

  setDefault(this)
  for (let attr of attributes) {
    this[attr] = edgeAttrs[attr]
  }
}
Edge.prototype = {
  constructor: Edge,
  _renderCurve (archedDirction) {
    const midPoint = {
      x: (this.x0 + this.x1) / 2,
      y: (this.y0 + this.y1) / 2
    }
    const halfDistance = Math.sqrt(
      Math.pow(this.x0 - midPoint.x, 2) +
      Math.pow(this.y0 - midPoint.y, 2))

    let path = D3Path.path()
    let controlPoint
    let negFlag

    if (archedDirction === 'upwardCurve') {
      negFlag = 1
    } else if (archedDirction === 'downwardCurve') {
      negFlag = -1
    }

    if (this.x0 === this.x1) {
      // Vertical case, slope equals infinite
      controlPoint = {
        x: midPoint.x + negFlag * halfDistance,
        y: midPoint.y
      }
    } else if (this.y0 === this.y1) {
      // Horizontal case, slope equals 0
      controlPoint = {
        x: midPoint.x,
        y: midPoint.y + negFlag * halfDistance
      }
    } else {
      let slope = (this.y0 - this.y1) / (this.x0 - this.x1)
      let YBiasToMidPoint = negFlag * halfDistance / Math.sqrt(slope * slope + 1)
      let XBiasToMidPoint = negFlag * slope * YBiasToMidPoint
      controlPoint = {
        x: midPoint.x + XBiasToMidPoint,
        y: midPoint.y + YBiasToMidPoint
      }
    }
    path.moveTo(this.x0, this.y0)
    path.quadraticCurveTo(controlPoint.x, controlPoint.y, this.x1, this.y1)
    return path.toString()
  },
  _renderStraightLine () {
    let path = D3Path.path()
    path.moveTo(this.x0, this.y0)
    path.lineTo(this.x1, this.y1)
    return path.toString()
  },
  _renderRing () {
    // this.x0 = this.x1 and this.y0 = this.y1
    const d = 1
    const controlPointA = { x: this.x0 - d, y: this.y0 + 0.6 * d }
    const controlPointB = { x: this.y0 - d, y: this.y0 - 100 * d }

    let path = D3Path.path()
    path.moveTo(this.x0, this.y0)
    path.bezierCurveTo(controlPointA.x, controlPointA.y, controlPointB.x, controlPointB.y, this.x1, this.y1)
    return path.toString()
  }
}
/* Node's Attributes:
 *   key: node's identifier/key (mandatory)
 *   posX: X coordinate of the node (optional)
 *   posY: Y coordinate of the node (optional)
 *   label: node's label (optional)
 *   type: node's type (optional)
 */
function Node (nodeAttrs) {
  const attributes = ['key', 'label', 'type', 'posX', 'posY']
  for (let attr of attributes) {
    this[attr] = nodeAttrs[attr]
  }
}

var keyGenerator = {
  count: 0,
  generate () {
    return this.count++
  }
}

var parseTransition = str => str
  .split(',')
  .map(function (str) {
    let trimmed = str.trim()
    return trimmed === 'ε' ? '' : trimmed
  })
</script>
<style scoped>
</style>
