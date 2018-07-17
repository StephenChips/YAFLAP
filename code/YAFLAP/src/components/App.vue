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
import D3Path from '@/lib/d3-path.min'

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
      this._updateNodeByKey(nodeKey, {
        posX: nodePosX,
        posY: nodePosY
      })

      /** Update adjcency edges */
      this.edgeData = this.edgeData.map(edge => {
        if (edge.soruce === nodeKey) {
          return new Edge({ ...edge, x0: nodePosX, y0: nodePosY })
        } else if (edge.targetKey === nodeKey) {
          return new Edge({ ...edge, x1: nodePosX, y1: nodePosY })
        } else {
          return edge
        }
      })
    },
    updateNodeType (nodeKey, nodeType) {
      this._updateNodeByKey(nodeKey, {
        type: nodeType
      })
    },
    updateNodeLabel (nodeKey, nodeLabel) {
      this._updateNodeByKey(nodeKey, {
        label: nodeLabel
      })
    },
    updateEdgeLabel (edgeKey, edgeLabel) {
      this._updateEdgeByKey(edgeKey, {
        label: edgeLabel
      })
    },
    deleteNode (nodeKey) {
      this.nodeData = this.nodeData.filter(node => node.key !== nodeKey)
      // Delete adjcency edges
      this.edgeData = this.edgeData.filter(edge =>
        edge.sourceKey !== nodeKey &&
        edge.targetKey !== nodeKey
      )
    },
    deleteEdge (edgeKey) {
      let indexOfEdge = this.edgeData.findIndex(edge => edge.key)
      if (indexOfEdge === -1) {
        return
      } else {
        let edgeShouldBeDeleted = this.edgeData[indexOfEdge]
        let indexOfReversedEdge = this.edgeData.findIndex(edge =>
          edgeShouldBeDeleted.source === edge.target &&
          edgeShouldBeDeleted.target === edge.source)
        let reversedEdge = this.edgeData[indexOfReversedEdge]
        if (indexOfReversedEdge !== -1) {
          this.$set(this.edgeData, indexOfReversedEdge, new Edge({
            ...reversedEdge,
            lineStyle: 'straightLine'
          }))
          this.edgeData.splice(indexOfReversedEdge, 1)
        }
      }
      this.edgeData = this.edgeData.filter(edge => edge.key !== edgeKey)
    },
    insertNode (nodeAttrs) {
      let key = keyGenerator.generate() // The key are generate automatically

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
      let key = keyGenerator.generate()

      /** Mandatory properties */
      let source = this.nodeData.find(node => node.key === edgeAttrs.sourceKey)
      let target = this.nodeData.find(node => node.key === edgeAttrs.targetKey)
      /** Optional properties */
      let label = edgeAttrs.label ? edgeAttrs.label : this.defaultValue.edgeLabel

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
          this.$set(this.edgeData, indexOfReversedEdge, new Edge({
            reversedEdge,
            lineStyle: 'upwardCurve'
          }))
          lineStyle = 'downwardCurve'
        } else {
          lineStyle = 'straightLine'
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
      }
    },
    hasNodes () {
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
    },
    _updateNodeByKey (nodeKey, nodeAttrs) {
      let nodeIndex = this.nodeData.findIndex(node => node.key === nodeKey)
      let oldNode = this.nodeData[nodeIndex]
      this.$set(this.nodeData, nodeIndex, new Node({
        ...oldNode,
        ...nodeAttrs
      }))
    },
    _updateEdgeByKey (edgeKey, edgeAttrs) {
      let edgeIndex = this.nodeData.findIndex(edge => edge.key === edgeKey)
      let oldEdge = this.nodeData[edgeIndex]
      this.$set(this.nodeData, edgeIndex, new Edge({
        ...oldEdge,
        ...edgeAttrs
      }))
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

function Edge (edgeAttrs) {
  function setDefault (edge) {
    edge.lineStyle = 'straightLine'
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
          this._lineStyle = 'ring'
        }
      }
    },
    d: {
      writable: false,
      get () {
        if (this.lineStyle === 'ring') {
          return this._renderRing()
        } else if (this.lineStyle === 'straightLine') {
          return this._renderStraightLine()
        } else if (this.lineStyle === 'upwardCurve') {
          return this._renderCurve('upwardCurve')
        } else if (this.lineStyle === 'downwardCurve') {
          return this._renderCurve('downwardCurve')
        }
      }
    }
  })

  setDefault()
  for (let attr of attributes) {
    this[attr] = edgeAttrs[attr]
  }
}
Edge.prototype = {
  constructor: Edge,
  _renderCurve (archedDirction) {
    const d = 20
    const midPoint = {
      x: (this.x0 + this.x1) / 2,
      y: (this.y0 + this.y1) / 2
    }
    let distanceToMidPoint, controlPoint

    if (archedDirction === 'upwardCurve') {
      distanceToMidPoint = d
    } else if (archedDirction === 'downwardCurve') {
      distanceToMidPoint = -d
    }

    if (this.x0 === this.x1) {
      // Vertical case, slope equals infinite
      controlPoint = {
        x: midPoint.x + distanceToMidPoint,
        y: midPoint.y
      }
    } else if (this.y0 === this.y1) {
      // Horizontal case, slope equals 0
      controlPoint = {
        x: midPoint.x,
        y: midPoint.y + distanceToMidPoint
      }
    } else {
      let slope = (this.y0 - this.y1) / (this.x0 - this.x1)
      let YBiasToMidPoint = distanceToMidPoint / Math.sqrt(slope * slope + 1)
      let XBiasToMidPoint = slope * YBiasToMidPoint
      controlPoint = {
        x: midPoint.x + XBiasToMidPoint,
        y: midPoint.y + YBiasToMidPoint
      }
    }
    return D3Path.path()
      .moveTo(this.x0, this.y0)
      .quadraticCurveTo(controlPoint.x, controlPoint.y, this.x1, this.y1)
      .toString()
  },
  _renderStraightLine () {
    return D3Path.path()
      .moveTo(this.x0, this.y0)
      .lineTo(this.x1, this.y1)
      .toString()
  },
  _renderRing () {
    // this.x0 = this.x1 and this.y0 = this.y1
    const d = 20
    const controlPointA = { x: this.x0 - d, y: this.y0 + d }
    const controlPointB = { x: this.y0 + d, y: this.y0 + d }

    return D3Path.path()
      .moveTo(this.x0, this.y0)
      .bezierCurveTo(controlPointA.x, controlPointA.y, controlPointB.x, controlPointB.y, this.x1, this.y1)
      .toString
  }
}

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
</script>
<style scoped>
</style>
