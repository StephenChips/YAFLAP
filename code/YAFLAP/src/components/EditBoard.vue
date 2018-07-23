<template>
  <div class="edit-board">
    <svg id="board"
      :style="boardStyle"
      @mousemove="boardMouseMoveHandler"
      @mouseup="boardMouseUpHandler">
      <!-- Definition of edge's shape: line with arrow -->
      <defs>
        <marker
          orient="auto"
          markerHeight="12"
          markerWidth="12"
          refY="0"
          refX="9"
          viewBox="0 -5 10 10"
          id="arrow">
          <path d="M0, -5L10, 0L0, 5" fill="red" fill-opacity="0.5"></path>
        </marker>
      </defs>
      <!-- Group of edges  -->
      <!-- They lay below all nodes, thus should be written above -->
      <g id="edges">
        <g v-for="edge in edgeData"
          :key="edge.key">
          <path
            class="edge"
            marker-mid="url(#arrow)"
            :key="edge.key"
            :d="edge.d"
            :id="'edge-' + edge.key"
            @mousedown="edgeMouseDownHandler"
            @dblclick="edgeDblClickHandler"
          />
          <!-- path's label -->
          <text
            style="text-anchor:middle; font: 16px sans-serif;"
            dy="-12">
            <textPath
                :href="'#' + 'edge-' + edge.key"
                startOffset="50%">
                {{ edge.label }}
            </textPath>
          </text>
          <!-- TODO: Add click layout -->
        </g>
      </g>

      <!-- Group of nodes -->
      <g id="nodes">
        <g v-for="node in nodeData"
            :key="node.key">
          <circle
            :r="nodeRadius"
            :cx="node.posX"
            :cy="node.posY"
            :class="['node', _nodeClass(node.type)]"
            :id="'node-' + node.key"
            @mouseover.stop="nodeMouseOverHandler"
            @mousedown.stop="nodeMouseDownHandler"
            @mouseup.stop="nodeMouseUpHandler"
            @mousemove.stop="nodeMouseMoveHandler"
            @mouseout.stop="nodeMouseOutHandler"
            @dblclick.stop="nodeDblClickHandler"
            @contextmenu.stop.prevent="nodeContextMenuHandler"
          ></circle>
          <text text-anchor="middle"
            :x="node.posX"
            :y="node.posY + 2 * nodeRadius">
             {{ node.label }}
          </text>
          <path
            v-if="node.type === NODE_TYPE.initial || node.type === NODE_TYPE.initFinal"
            :d="_getInitialNodeIndicatorPath(node.posX, node.posY)"
          ></path>
        </g>
      </g>

      <path v-show="showedAuxElement === AUX_ELEMENT.auxEdge" id="auxedge-auxedge" class="aux-edge" :d="auxEdgePath" />
    </svg>

    <!-- Auxiliary elements: input field, context menu and auxiliary edge for creating new edge -->
    <input v-show="showedAuxElement === AUX_ELEMENT.editField" type="text" size="10" id="editfield-editfield" class="edit-field" v-model="editFieldText" :style="editFieldStyle"/>
    <drop-menu
      v-if="showedAuxElement === AUX_ELEMENT.contextMenu"
      id="contextmenu-contextmenu"
      :style="dropMenuStyle"
      @set-node-type="setNodeTypeHandler"
    ></drop-menu>
  </div>
</template>
<script>
import DropMenu from '@/components/DropMenu'
import * as D3Path from 'd3-path'
import { BOARD_ELEMENT, AUX_ELEMENT, EDIT_MODE, NODE_TYPE } from '@/utils/enum'

/**
 * ----------------------------------------------
 * -- Custom event on operating graph elements --
 * ----------------------------------------------
 *
 * Event Name: 'insert-node', 'insert-edge', 'update-node', 'update-edge', 'delete-node', 'delete-edge'
 *
 * --------------------------------------------------------------------
 * -- Arguments providing to the parent component when emiting event --
 * --------------------------------------------------------------------
 * ## INSERT ##
 * Node:
 *   posX: X coordinate of the node (mandatory)
 *   posY: Y coordinate of the node (mandatory)
 *   label: node's label (optional)
 *   type: node's type (optional)
 * Edge:
 *   sourceKey: Source node's key (mandatory)
 *   targetKey: Target node's key (mandatory)
 *   label: edge's label (optional)
 *
 * ## DELETE ##
 * Node:
 *   key: node's identifier/key (mandatory)
 * Edge:
 *   key: edge's identifier/key (mandatory)
 *
 * ## UPDATE ##
 * MENTION:
 *   The key cannot be changed once the element inserted.
 *   It is used to find the corespondence data in the array.
 *   If you really want to change it, please delete the element
 *   then insert it again to the array.
 * Node:
 *   key: node's identifier/key (mandatory)
 *   posX: X coordinate of the node (optional)
 *   posY: Y coordinate of the node (optional)
 *   label: node's label (optional)
 *   type: node's type (optional)
 * Edge:
 *   key: edge's identifier/key (mandatory)
 *   label: Edge's label (optional)
 *
 * --------------------------------------------------------------------
 * -- Properties for Nodes and Edges that parent component supported --
 * --------------------------------------------------------------------
 * Node:
 *   key, posX, posY, label, type
 *
 * Edge:
 *   key, d, label
 *
 * The parent conponent will take the argument after emiting event, process them and update the
 * node's data and edge's data. The child component will be synchronize once the data is finish
 * update.
 */

export default {
  name: 'edit-board',
  props: {
    boardStyle: Object, // define the style of the svg #board element
    editMode: {
      type: String
    },
    nodeData: {
      type: Array
    },
    edgeData: {
      type: Array
    }
  },
  created () {
    this.AUX_ELEMENT = AUX_ELEMENT
    this.BOARD_ELEMENT = BOARD_ELEMENT
    this.EDIT_MODE = EDIT_MODE
    this.NODE_TYPE = NODE_TYPE
  },
  data () {
    return {
      editingElement: undefined,
      selectedNodeKey: undefined,
      hoveredNodeKey: undefined,
      showedAuxElement: undefined,
      draggingNodeKey: undefined,
      editFieldText: '',
      nodeRadius: 20,
      auxEdgeCoordinate: { x0: 0, y0: 0, x1: 0, y1: 0 },
      dropMenuPosition: { x: 0, y: 0 },
      editFieldPosition: { x: 0, y: 0 }
    }
  },
  computed: {
    auxEdgePath () {
      let path = D3Path.path()
      path.moveTo(this.auxEdgeCoordinate.x0, this.auxEdgeCoordinate.y0)
      path.lineTo(this.auxEdgeCoordinate.x1, this.auxEdgeCoordinate.y1)
      return path.toString()
    },
    auxEdgeShowed () {
      return this.editMode === EDIT_MODE.add && this.showedAuxElement === AUX_ELEMENT.auxEdge
    },
    contextMenuOpened () {
      return this.editMode === EDIT_MODE.edit && this.showedAuxElement === AUX_ELEMENT.contextMenu
    },
    editFieldShowed () {
      return this.editMode === EDIT_MODE.edit && this.showedAuxElement === AUX_ELEMENT.editField
    },
    dropMenuStyle () {
      return {
        left: this.dropMenuPosition.x + 'px',
        top: this.dropMenuPosition.y + 'px',
        position: 'absolute'
      }
    },
    editFieldStyle () {
      return {
        left: this.editFieldPosition.x + 'px',
        top: this.editFieldPosition.y + 'px',
        position: 'absolute'
      }
    }
  },
  methods: {
    /** Board's handlers */
    boardMouseMoveHandler (event) {
      if (this.auxEdgeShowed) {
        let mousePosition = this._getRelativeMousePosition(event)
        this._updateAuxEdge(
          this.auxEdgeCoordinate.x0,
          this.auxEdgeCoordinate.y0,
          mousePosition.x,
          mousePosition.y
        )
      }
    },
    boardMouseUpHandler (event) {
      if (this.editMode === EDIT_MODE.add) {
        if (!this.auxEdgeShowed) {
          let mousePosition = this._getRelativeMousePosition(event)
          this.$emit('insert-node', {
            posX: mousePosition.x,
            posY: mousePosition.y
          })
        }
      } else if (this.editMode === EDIT_MODE.edit) {
        if (this.editFieldShowed) {
          if (this.editingElement.type === BOARD_ELEMENT.node) {
            this.$emit('update-node', {
              key: this.editingElement.key,
              label: this.editFieldText
            })
          } else if (this.editingElement.type === BOARD_ELEMENT.edge) {
            this.$emit('update-edge', {
              key: this.editingElement.key,
              label: this.editFieldText
            })
          }
        }
      }
      this.hideAuxElement()
    },

    /* Edge's handlers */
    edgeMouseDownHandler (event) {
      if (this.editMode === EDIT_MODE.delete) {
        var typeAndKey = this._getElementTypeAndKey(event.target)
        this.$emit('delete-edge', {
          key: typeAndKey.key
        })
      }
    },
    edgeDblClickHandler (event) {
      let typeAndKey = this._getElementTypeAndKey(event.target)
      let mousePosition = this._getRelativeMousePosition(event)
      let edge = this.edgeData.find(edge => edge.key === typeAndKey.key)
      this.editFieldText = edge.label
      this.editingElement = { type: BOARD_ELEMENT.edge, key: typeAndKey.key }
      this.showEditField(mousePosition.x, mousePosition.y)
    },

    /* Node's handlers */
    nodeMouseDownHandler (event) {
      let typeAndKey = this._getElementTypeAndKey(event.target)
      let mousePosition = this._getRelativeMousePosition(event)
      if (this.editMode === EDIT_MODE.add) {
        // start linking node
        this.selectedNodeKey = typeAndKey.key
        this.showAuxEdge(mousePosition.x, mousePosition.y)
      } else if (this.editMode === EDIT_MODE.edit) {
        this.draggingNodeKey = typeAndKey.key
      } else if (this.editMode === EDIT_MODE.delete) {
        this.$emit('delete-node', {
          key: typeAndKey.key
        })
      }
    },
    nodeMouseMoveHandler (event) {
      if (this.draggingNodeKey) {
        let mousePosition = this._getRelativeMousePosition(event)
        this.$emit('update-node', {
          key: this.draggingNodeKey,
          posX: mousePosition.x,
          posY: mousePosition.y
        })
      }
    },
    nodeMouseOverHandler (event) {
      let typeAndKey = this._getElementTypeAndKey(event.target)
      this.hoveredNodeKey = typeAndKey.key
    },
    // 1. If auxiliary edge is showed, the board must be in the add mode.

    // 2. Before triggering the event, the mouse must be over a node, therefore,
    // the attribute 'selectedNodeKey' will not be undefined.

    // 3. If the auxiliary edge is showed, there must be a selected node,
    // which is the one that previous clicked (triggered mousedown event)
    // before linking.

    // Evidence 1 shows that it is not nesseccery to check the current board's mode.
    nodeMouseUpHandler () {
      if (this.auxEdgeShowed) {
        // Evidences 2 and 3 show that the safety checking can be omitted.
        this.$emit('insert-edge', {
          sourceKey: this.selectedNodeKey,
          targetKey: this.hoveredNodeKey
        })
        this.hideAuxElement()
      } else if (this.draggingNodeKey) {
        this.draggingNodeKey = undefined
      }
    },
    nodeMouseOutHandler () {
      this.hoveredNodeKey = undefined
    },
    nodeDblClickHandler (event) {
      if (this.editMode === EDIT_MODE.edit) {
        let typeAndKey = this._getElementTypeAndKey(event.target)
        let node = this.nodeData.find(node => node.key === typeAndKey.key)
        this.editingElement = { type: BOARD_ELEMENT.node, key: node.key }
        this.editFieldText = node.label
        this.showEditField(node.posX, node.posY)
      }
    },
    nodeContextMenuHandler (event) {
      if (this.editMode === EDIT_MODE.edit) {
        let mousePosition = this._getRelativeMousePosition(event)
        let typeAndKey = this._getElementTypeAndKey(event.target)
        this.editingElement = { type: BOARD_ELEMENT.node, key: typeAndKey.key }
        this.showContextMenu(mousePosition.x, mousePosition.y)
      }
    },

    /** Drop Menu's handlers */
    setNodeTypeHandler (nodeType) {
      this.$emit('update-node', {
        key: this.editingElement.key,
        type: nodeType
      })
      this.hideAuxElement()
    },
    nodeMouseOver (event) {
      this.hoveredNodeKey = this.getElementTypeAndKey(event.target).key
    },
    nodeMouseOut (event) {
      this.hoveredNodeKey = undefined
    },
    _updateAuxEdge (x0, y0, x1, y1) {
      if (arguments.length === 2) {
        this.auxEdgeCoordinate = { x0, y0, x1: x0, y1: y0 }
      } else {
        this.auxEdgeCoordinate = { x0, y0, x1, y1 }
      }
    },
    showAuxEdge (x, y) {
      this._updateAuxEdge(x, y)
      this.showedAuxElement = AUX_ELEMENT.auxEdge
    },
    showContextMenu (x, y) {
      this.dropMenuPosition = { x, y }
      this.showedAuxElement = AUX_ELEMENT.contextMenu
    },
    showEditField (x, y) {
      this.editFieldPosition = { x, y }
      this.showedAuxElement = AUX_ELEMENT.editField
    },
    hideAuxElement () {
      this.showedAuxElement = this.editingElement = undefined
    },
    _getElementTypeAndKey ($el) {
      let matchResult = $el.id.match(/(\w+)-(.+)/)
      let type = matchResult[1]
      let key = matchResult[2]
      return { type, key }
    },
    _getRelativeMousePosition (event) {
      return {
        x: event.pageX - this.$el.offsetLeft,
        y: event.pageY - this.$el.offsetTop
      }
    },
    _getPathMiddlePosition (path) {
      let length = path.getTotalLength()
      let midPoint = path.getPointAtLength(length / 2)
      return { x: midPoint.x, y: midPoint.y }
    },
    _nodeClass (nodeType) {
      if (nodeType === NODE_TYPE.initial) {
        return 'initial-node'
      } else if (nodeType === NODE_TYPE.final) {
        return 'final-node'
      } else if (nodeType === NODE_TYPE.normal) {
        return 'normal-node'
      } else if (nodeType === NODE_TYPE.initFinal) {
        return 'initial-final-node'
      }
    },
    _getInitialNodeIndicatorPath (initialNodePosX, initialNodePosY) {
      let path = D3Path.path()
      path.moveTo(initialNodePosX - this.nodeRadius, initialNodePosY)
      path.lineTo(initialNodePosX - 2 * this.nodeRadius, initialNodePosY + this.nodeRadius)
      path.lineTo(initialNodePosX - 2 * this.nodeRadius, initialNodePosY - this.nodeRadius)
      path.closePath()
      return path.toString()
    }
  },
  components: { DropMenu }
}
</script>
<style scoped>
.edit-board {
  position: relative;
  padding: 0;
}
#board {
  position: relative;
  height: 100%;
  width: 100%;
  background-color: #EDEDED;
}
.node {
  stroke-width: 3px;
}
.final-node, .initial-final-node {
  stroke: #55456e;
  fill: rgb(43, 161, 152);
}
.initial-node {
  stroke: #55456e;
  fill: #f7f7f7
}
.normal-node {
  fill: #f7f7f7;
  stroke: #232323;
}
.node-label {
  font-size: 14px;
}
.node:hover {
  stroke: slateblue;
}
.aux-edge, .edge {
  stroke: #232323;
  stroke-width: 3px;
  fill-opacity: 0;
}
</style>
