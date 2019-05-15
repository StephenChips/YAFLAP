<template>
  <div class="base">
    <svg
      class="graph"
      @mousemove="_handleBoardMouseMoveEvent"
      @mouseup="_handleBoardMouseUpEvent">
      <defs>
        <marker
          id="edgeArrow"
          markerWidth='6'
          markerHeight='6'
          viewBox="-2 -5 10 10"
          refX="20"
          refY='-1'
          orient='auto'
          markerUnits='strokeWidth'>
          <path d='M-1,-4 L10,-1 L2,5 z' fill='#334400' />
        </marker>
        <marker
          id="freeEdgeArrow"
          markerWidth='6'
          markerHeight='6'
          viewBox="-2 -5 10 10"
          refX="0"
          refY='0'
          orient='auto'
          markerUnits='strokeWidth'>
          <path d='M-1,-4 L10,-1 L2,5 z' fill='#334400' />
        </marker>
        <marker
          v-for="edge of edges" :key="edge.id"
          :id="`edge-label-marker-${edge.id}`"
          markerWidth='100'
          markerHeight='9'
          viewBox="-10 -20 40 30"
          refX="0"
          refY='10'
          orient='0'
          markerUnits='strokeWidth'>
          <text text-anchor="middle">{{ edge.label }}</text>
        </marker>
      </defs>
      <g data-free-edge="free-edge" v-show="isFreeEdgeVisible">
        <path
          class="edge-overlay"
          :d='_getArcPath(freeEdge.source.x, freeEdge.source.y, freeEdge.target.x, freeEdge.target.y)'/>
        <path
          class="edge"
          marker-end="url(#freeEdgeArrow)"
          :d='_getArcPath(freeEdge.source.x, freeEdge.source.y, freeEdge.target.x, freeEdge.target.y)'/>
      </g>
      <g>
        <g v-for='edge of edges' :key="edge.id"
          :data-edge-id="edge.id"
          :data-edge-source="edge.source" :data-edge-target="edge.target"
          @click="_handleEdgeClickEvent">
          <path
            class="edge-overlay"
            :d='_linkArc(edge)'
            :data-edge-source="edge.source"
            :data-edge-target="edge.target"/>
          <path
            class="edge"
            v-bind="{ 'id' : `${name}-${edge.id}` }"
            :data-edge-source="edge.source"
            :data-edge-target="edge.target"
            :d='_linkArc(edge)'
            :marker-mid="`url(#edge-label-marker-${edge.id})`"
            marker-end="url(#edgeArrow)"/>
            <!--  FIXME temporary solution -->
          <text
            v-if="edge.source === edge.target"
            text-anchor="middle"
            :transform="__temporary_getTransformOfSelfConnectedEdge(edge)"
            >{{ edge.label }}
          </text>
        </g>
      </g>
      <g>
        <g v-for="node of nodes"
          :data-node-id='node.id'
          :key='node.id'
          :class='`node node-${node.type}`'
          @mousedown="_handleNodeMouseDownEvent"
          @mousemove="_handleNodeMouseMoveEvent"
          @mouseup="_handleNodeMouseUpEvent"
          @dblclick="_handleNodeDblClickEvent"
          @contextmenu="_handleNodeContextMenuEvent">
          <circle :r="nodeRadius" :transform="`translate(${node.x}, ${node.y})`" :data-node-id='node.id' />
          <text text-anchor="middle" :transform="`translate(${node.x}, ${node.y + 1.8 * nodeRadius})`" :data-node-id='node.id'>{{ node.label }}</text>
          <path v-if="node.type === 'start' || node.type === 'start-finish'" stroke="3" fill="#000000" :d="`M ${node.x-nodeRadius},${node.y} L${node.x - 2 * nodeRadius},${node.y-nodeRadius} L ${node.x - 2 * nodeRadius},${node.y+nodeRadius} Z`" :data-node-id='node.id'/>
        </g>
      </g>
    </svg>
    <drop-menu
      class="node-menu"
      :items="menuItems"
      @click-item="_handleMenuClickItemEvent"
      :style="{ top: nodeMenuPosition.y, left: nodeMenuPosition.x }"
      v-if="shouldShowNodeMenu"
    />
    <edit-field ref="nodeEditField"
      class="edit-field"
      v-if="shouldShowEditField"
      :style="{ top: this.editFieldPosition.y, left: this.editFieldPosition.x }"
      v-model="editFieldInput"
      @submit="_commitInput"/>
    <div ref="overlay" class="overlay" v-if="shouldShowOverlay" @click="_handleOverlayClickEvent">&nbsp;</div>
  </div>
</template>
<script>
import EditField from './EditField.vue'
import DropMenu from './DropMenu.vue'

class Edge {
  constructor (options) {
    this.source = options.source
    this.target = options.target
    this.label = options.label
  }

  get id () {
    return `${this.source}-${this.target}`
  }
}

class Node {
  constructor (options) {
    this.id = String(options.id)
    this.x = options.x
    this.y = options.y
    this.label = options.label
    this.type = options.type
  }
}

function _getEdgeClickEventHandler (options) {
  var hasClickedBefore = false
  var timerId
  return function (event) {
    if (hasClickedBefore) {
      options.handleDblClick.call(this, event)
      hasClickedBefore = false
      clearTimeout(timerId)
    } else {
      options.handleClick.call(this, event)
      hasClickedBefore = true
      setTimeout(() => {
        hasClickedBefore = false
      }, 300)
    }
  }
}

// produce following events:
/**
 * add-node, remove-node, add-edge, remove-edge, swicth-state
 */
export default {
  name: 'edit-board',
  props: {
    state: {
      // Either 'edit', 'delete', 'create'
      // You can do nothing in the `none` state
      type: String,
      default: 'edit'
    },
    name: {
      type: String,
      default: 'graph'
    }
  },
  created () {
    // This mehods has extra contexts, so it have to mixin after component's created.
    this._handleEdgeClickEvent = _getEdgeClickEventHandler({
      handleClick (event) {
        if (this.state === 'delete') {
          var source = event.target.getAttribute('data-edge-source')
          var target = event.target.getAttribute('data-edge-target')
          this.removeEdge(source, target)
        }
      },
      handleDblClick (event) {
        if (this.state === 'edit' && this.editState === 'none') {
          this._startEditingEdge(event)
        }
      }
    }).bind(this)
  },
  data: function () {
    return {
      nodeRadius: 20,
      nodes: [],
      edges: [],
      freeEdge: {
        source: { x: 0, y: 0 },
        target: { x: 0, y: 0 }
      },
      selectedNode: undefined,
      isFreeEdgeVisible: false,
      isMovingNode: false,
      editState: 'none',
      nodeCounter: 0,
      editFieldInput: '',
      editTarget: undefined,
      editFieldPosition: { x: 0, y: 0 },
      nodeMenuPosition: { x: 0, y: 0 },
      menuItems: [
        { key: 'start', title: 'Set as start node' },
        { key: 'finish', title: 'Set as finish node' },
        { key: 'normal', title: 'Set as normal node' },
        { key: 'start-finish', title: 'Set as start-finish node' }
      ]
    }
  },
  methods: {
    __temporary_getTransformOfSelfConnectedEdge (edge) {
      var node = this._findNodeById(edge.target)
      return `translate(${node.x}, ${node.y - 85})`
    },
    _linkArc (edge) {
      var source = this._findNodeById(edge.source)
      var target = this._findNodeById(edge.target)
      if (source === target) {
        return this._getRingPath(source.x, source.y)
      } else {
        return this._getArcPath(source.x, source.y, target.x, target.y)
      }
    },
    _getRingPath (x, y) {
      var len = 100;
      var controlPoints = {
        left: { x: x - len, y: y - len },
        right: { x: x + len, y: y - len },
      };

      return `M ${x},${y} C ${controlPoints.left.x},${controlPoints.left.y} ${controlPoints.right.x},${controlPoints.right.y} ${x},${y}`
    },
    _getArcPath (sourceX, sourceY, targetX, targetY) {
      var dx = sourceX - targetX
      var dy = sourceY - targetY
      var dr = Math.sqrt(dx * dx + dy * dy)
      return `M ${sourceX}, ${sourceY} A ${dr},${dr} 0 0,1 ${targetX},${targetY}`
    },
    _handleNodeMouseMoveEvent (event) {
      if (this.state === 'edit' && this.isMovingNode) {
        event.preventDefault()
        event.stopPropagation()
        this._updateMovingNode(event)
      }
    },
    _handleNodeMouseUpEvent (event) {
      event.preventDefault()
      event.stopPropagation()
      if (this.state === 'edit' && this.isMovingNode) {
        this._stopMovingNode()
      } else {
        var targetNodeId = event.target.getAttribute('data-node-id')
        if (this.state === 'create' && this.isFreeEdgeVisible) {
          try {
            this.addEdge({
              source: this.selectedNode.id,
              target: targetNodeId,
              label: 'ε'
            })
          } catch (e) {
            this.$emit('error', e)
          }
          this._stopLinkingNodes()
        } else if (this.state === 'delete') {
          this.removeNode(targetNodeId)
        }
      }
    },
    _handleNodeMouseDownEvent (event) {
      event.preventDefault()
      event.stopPropagation()
      if (this.state === 'edit') {
        this._startMovingNode(event)
      } else if (this.state === 'create') {
        this._startLinkingNodes(event)
      }
    },
    _handleNodeDblClickEvent (event) {
      event.preventDefault()
      event.stopPropagation()
      if (this.state === 'edit' && this.editState !== 'edit-node-label') {
        this._startEditingNode(event)
      }
    },
    _handleNodeContextMenuEvent (event) {
      event.preventDefault()
      event.stopPropagation()

      if (this.state === 'edit' && this.editState !== 'open-node-menu') {
        this._openNodeMenu(event)
      }
    },
    _handleBoardMouseMoveEvent (event) {
      event.preventDefault()
      event.stopPropagation()
      if (this.state === 'create' && this.isFreeEdgeVisible) {
        this._updateFreeEdgePosition(event)
      } else if (this.state === 'edit' && this.isMovingNode) {
        this._updateMovingNode(event)
      }
    },
    _handleBoardMouseUpEvent (event) {
      event.preventDefault()
      event.stopPropagation()

      if (this.state === 'create') {
        if (this.isFreeEdgeVisible) {
          this._stopLinkingNodes()
        } else {
          var mouse = this._getMousePosition(event)
          this.addNode({
            label: 'NODE #' + this.nodeCounter,
            type: 'normal',
            x: mouse.x,
            y: mouse.y
          })
        }
      }
    },
    _handleEdgeClickEvent (event) {
      event.preventDefault()
      event.stopPropagation()
      // eslint-disable-next-line
      _handleEdgeClickEvent.call(this, event)
    },
    _handleOverlayClickEvent () {
      event.preventDefault()
      event.stopPropagation()
      if (this.state === 'edit') {
        if (this.editState === 'edit-edge-label' || this.editState === 'edge-node-label') {
          this._commitInput()
        } else {
          this._terminateInput()
        }
      }
    },
    _handleMenuClickItemEvent (key) {
      this.menuInput = key
      this._commitInput()
    },
    _initFreeEdgePosition (event) {
      var mouse = this._getMousePosition(event)
      this.freeEdge.target.x = mouse.x
      this.freeEdge.source.x = mouse.x
      this.freeEdge.target.y = mouse.y
      this.freeEdge.source.y = mouse.y
    },
    _updateFreeEdgePosition (event) {
      var mouse = this._getMousePosition(event)
      this.freeEdge.target.x = mouse.x
      this.freeEdge.target.y = mouse.y
    },
    _updateMovingNode (event) {
      var mouse = this._getMousePosition(event)
      this.selectedNode.x = mouse.x
      this.selectedNode.y = mouse.y
    },
    _setSelectedNodeFromEvent (event) {
      var nodeId = event.target.getAttribute('data-node-id')
      this.selectedNode = this._findNodeById(nodeId)
    },
    _startMovingNode (event) {
      this.isMovingNode = true
      this._setSelectedNodeFromEvent(event)
    },
    _stopMovingNode () {
      this.isMovingNode = false
      this.selectedNode = undefined
    },
    _startLinkingNodes (event) {
      this._setSelectedNodeFromEvent(event)
      this._initFreeEdgePosition(event)
      this.isFreeEdgeVisible = true
    },
    _stopLinkingNodes () {
      this.isFreeEdgeVisible = false
      this.selectedNode = false
    },
    _getMousePosition (event) {
      // e = Mouse click event.
      var rect = this.$el.getBoundingClientRect()
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    },
    _findNodeById (id) {
      return this.nodes.find(node => node.id === String(id))
    },
    _findEdgeById (source, target) {
      return this.edges.find(edge => edge.source === source && edge.target === target)
    },
    _findNodeIndexById (id) {
      return this.nodes.findIndex(node => node.id === String(id))
    },
    _findEdgeIndexById (source, target) {
      return this.edges.findIndex(edge => edge.source === source && edge.target === target)
    },
    _startEditingEdge (event) {
      var source = event.target.getAttribute('data-edge-source')
      var target = event.target.getAttribute('data-edge-target')
      this.editTarget = this._findEdgeById(source, target)
      this.editState = 'edit-edge-label'
      this._setEditFieldPosition(event)
    },
    _startEditingNode (event) {
      var id = event.target.getAttribute('data-node-id')
      this.editTarget = this._findNodeById(id)
      this.editState = 'edit-node-label'
      this._setEditFieldPosition(event)
    },
    _setEditFieldPosition (event) {
      var mouse = this._getMousePosition(event)
      this.editFieldPosition.x = mouse.x
      this.editFieldPosition.y = mouse.y
    },
    _openNodeMenu (event) {
      var mouse = this._getMousePosition(event)
      var id = event.target.getAttribute('data-node-id')
      this.nodeMenuPosition.x = mouse.x
      this.nodeMenuPosition.y = mouse.y
      this.editTarget = this._findNodeById(id)
      this.editState = 'open-node-menu'
    },
    _removeAllRelativeEdgesOfNode (id) {
      this.edges = this.edges.filter(edge => edge.source !== id && edge.target !== id)
    },
    _commitInput () {
      try {
        this._checkEditFieldInput(this.editState, this.editFieldInput)
        switch (this.editState) {
          case 'none': return
          case 'edit-edge-label':
            this.setEdge(this.editTarget.source, this.editTarget.target, {
              label: this.editFieldInput
            })
            break
          case 'edit-node-label':
            this.setNode(this.editTarget.id, {
              label: this.editFieldInput
            })
            break
          case 'open-node-menu':
            this.setNode(this.editTarget.id, {
              type: this.menuInput
            })
            break
        }
      } catch (e) {
        this.$emit('error', e)
      } finally {
        this._terminateInput()
      }
    },
    _terminateInput () {
      this.editState = 'none'
      this.editTarget = undefined
    },
    _checkEditFieldInput (state, input) {
      if (input === '' && state === 'edit-edge-label') {
        throw new Error('empty edge label')
      } else if (input === '' && state === 'edit-node-label') {
        throw new Error('empty node label')
      }
    },
    _setNodeType (type) {
      this.setNode(this.editTarget.id, { type })
    },

    addEdge (edge) {
      if (this._findEdgeById(edge.source, edge.target) !== undefined) {
        throw new Error('duplicate edge')
      }
      this.edges.push(new Edge(edge))
      this.$emit('add-edge', new Edge(edge))
    },
    addNode (node) {
      var options = {
        id: this.nodeCounter++,
        ...node
      }
      this.nodes.push(new Node(options))
      this.$emit('add-node', new Node(options))
    },
    removeEdge (source, target) {
      var index = this._findEdgeIndexById(source, target)
      var edge = this.edges[index]
      this.edges.splice(index, 1)
      this.$emit('remove-edge', new Edge(edge))
    },
    removeNode (id) {
      var index = this._findNodeIndexById(id)
      var node = this.nodes[index]
      this._removeAllRelativeEdgesOfNode(id)
      this.nodes.splice(index, 1)
      this.$emit('remove-node', new Node(node))
    },
    setNode (id, props) {
      var index = this._findNodeIndexById(id)
      var node = Object.assign({}, this.nodes[index], props)
      this.$set(this.nodes, index, new Node(node))
      this.$emit('set-node', node)
    },
    setEdge (source, target, props) {
      var index = this._findEdgeIndexById(source, target)
      var edge = Object.assign({}, this.edges[index], props)
      this.$set(this.edges, index, new Edge(edge))
      this.$emit('set-edge', edge)
    },
    getEdgeCount () {
      return this.edges.length
    },
    getNodeCount () {
      return this.nodes.length
    }
  },
  computed: {
    shouldShowOverlay () {
      return this.editState !== 'none'
    },
    shouldShowEditField () {
      return this.editState === 'edit-node-label' || this.editState === 'edit-edge-label'
    },
    shouldShowNodeMenu () {
      return this.editState === 'open-node-menu'
    }
  },
  components: {
    EditField, DropMenu
  }
}
</script>
<style scoped>
.base {
  position: relative;
  border: 2px brown solid;
}
.graph {
  width: 100%;
  height: 100%;
}
.edge {
  fill: transparent;
  stroke: black;
  stroke-width: 3;
}

.edge-overlay {
  fill: transparent;
  stroke:rgba(200, 200, 200, 0.3);
  stroke-width: 10;
}

.node {
  fill: #999999;
}

.node-start {
  stroke: #444444;
}

.node-finish {
  stroke: #880000;
}
.node-start-finish {
  stroke: #880000;
}

.edit-field {
  position: absolute;
  z-index: 1000;
}

.node-menu {
  position: absolute;
  z-index: 1000;
}

.overlay {
  position: absolute;
  z-index: 900;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
