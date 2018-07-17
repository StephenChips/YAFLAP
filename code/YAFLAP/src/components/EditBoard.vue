<template>
  <div class="edit-board">
    <svg id="board"
      :style="boardStyle"
      @click="boardClicked">
      <!-- Definition of edge's shape: line with arrow -->
        <defs>
          <marker
              orient="auto"
              markerHeight="12"
              markerWidth="12"
              refY="0"
              refX="9"
              viewBox="0 -5 10 10"
              id="arrow"
              style="fill: red; fill-opacity: 0.5;">
              <path d="M0, -5L10, 0L0, 5"></path>
          </marker>
        </defs>
      <!-- Group of edges  -->
      <!-- They lay below all nodes, thus should be written above -->
      <g id="edges">
        <g v-for="edge in edgeData" :key="edge.key"
          @click="removeElement"
          @dblclick="showEditField">
          <path
            style="edge-style"
            marker-mid="url(#arrow)"
            :key="edge.key"
            :id="'edge-' + edge.key"
            :d="edge.d"
          ></path>
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
        </g>
      </g>

      <!-- Group of nodes -->
      <g id="nodes">
        <g v-for="node in nodeData" :key="node.key"
            @mousedown="mouseDownHandler"
            @mousemove="mouseMoveHandler"
            @mouseup="mouseUpHandler"
            @mouseover="nodeMouseOver"
            @mouseout="nodeMouseOut"
            @click="removeElement"
            @dblclick="showEditField"
            @contextmenu="nodeRightClicked">
          <circle
            :id="'node-' + node.key"
            radius="20"
            :cx="node.posX"
            :cy="node.posY"
            :style="['node', node.type]"
          ></circle>
          <text class="node-label" text-anchor="middle" opacity="1"
            :x="node.posX"
            :y="node.posY">{{ node.label }}</text>
        </g>
      </g>
    </svg>

    <!-- Helper elements: input field, context menu and auxiliary edge for creating new edge -->
    <input v-show="editFieldShowed" type="text" id="editfield-editfield" v-model="editFieldValue"/>
    <drop-menu
      id="contextmenu-contextmenu"
      :visible="contextMenuOpened"
      :style="dropMenuStyle"
      @click-item="itemClicked"></drop-menu>
    <path v-show="auxiliaryEdgeShowed" id="auxedge-auxedge" :style="edgeStyle" :d="auxiliaryEdgePath"></path>
  </div>
</template>
<script>
import DropMenu from '@/components/DropMenu'
import D3 from '@/lib/d3js/d3'

/**
 * ----------------------------------
 * -- Custom event may be emitted  --
 * ----------------------------------
 *
 * Event Name: 'create'
 * Args: { type: 'edge' | 'node', attrs: {...} }
 * --
 * Event Name: 'update'
 * Args: { type: 'edge' | 'node', attrs: {...} }
 * --
 * Event Name: 'delete'
 * Args: { type: 'edge' | 'node', attrs: {...} }
 *
 * These opreations have to handle by the parent componet, since they may effect other sibling component.
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
 * ## DELETE ##
 * Node:
 *   key: node's identifier/key (mandatory)
 * Edge:
 *   key: edge's identifier/key (mandatory)
 *
 * ## UPDATE ##
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
  props: {
    boardStyle: Object, // define the style of the svg #board element
    editMode: {
      type: String,
      default: 'edit'
    },
    nodeData: {
      type: Array,
      default: () => []
    },
    edgeData: {
      type: Array,
      default: () => []
    }
  },
  name: 'edit-board',
  data () {
    return {
      /**
       * Property editing records 'type' and 'key' of current editing element
       *
       * Possible value:
       * 'updateNode'
       *   effect: To show the edit field on the node and update its name
       *   key: editted node's key
       * 'updateEdge'
       *   To show the edit field on the edge and update its transition
       *   key: editted edge's key
       * 'contextmenu'
       *   To show the context menu at current mouse position
       *   key: 'contextmenu'
       * 'dragNode'
       *   When dragging a node, set this property's type to 'drag'
       *   key: dragged node
       * 'addEdge'
       *   To show the auxiliary link then create a new edge from a node
       *   key: 'auxedge'
       */
      editing: { editType: undefined, elType: undefined, elKey: undefined }, /** a object that record the editing element's type and key */
      editFieldValue: '',
      auxliiaryEdgePath: '',
      hoveredNodeKey: undefined,
      dropMenuStyleValue: {
        left: 0,
        top: 0,
        position: 'absolute'
      },
      editFieldStyleValue: {
        left: 0,
        top: 0,
        position: 'absolute'
      }
    }
  },
  methods: {
    boardClicked (event) {
      /** Set attribute 'editing' to null will hide:
      *   1. Edit field
      *   2. Auxiliary link
      *   3. Context menu.
      * */
      var position = this.getRelativeMousePosition(event)
      switch (this.editMode) {
        case 'add':
          /** Add node */
          this.$emit('insert', {
            type: 'node',
            attrs: {
              posX: position.x,
              posY: position.y
            }
          })
          break
        case 'edit':
          if (this.editFieldShowed) {
            /** Update node's name or edge's name */
            this.$emit('update', {
              type: this.editing.elType,
              attrs: {
                key: this.editing.elKey,
                label: this.editFieldValue
              }
            })
          }
          this.editing = {} // Close edit field
          break
      }
    },
    removeElement (event) {
      if (this.editMode === 'delete') {
        var typeKeyObj = this.getElementTypeAndKey(event.target)
        if (typeKeyObj.type === 'node' || typeKeyObj.type === 'edge') {
          this.$emit('delete', {
            type: typeKeyObj.type,
            attrs: { key: typeKeyObj.key }
          })
        }
      }
    },
    nodeMouseOver (event) {
      this.hoveredNodeKey = this.getElementTypeAndKey(event.target).key
    },
    nodeMouseOut (event) {
      this.hoveredNodeKey = undefined
    },
    mouseDownHandler (event) {
      let key = this.getElementTypeAndKey(event.target).key
      if (this.editMode === 'edit') {
        this.editing = { editType: 'dragNode', elType: 'node', key: key }
      } else if (this.editMode === 'add') {
        this.editing = { editType: 'linkNode', elType: 'node', key: key }
      }
    },
    mousemoveHandler (event) {
      var position = this.getRgetRelativeMousePosition(event)
      if (this.editing.editType === 'dragNode') {
        /** Move selected node */
        this.$emit('update', {
          type: 'node',
          attrs: {
            key: this.editing.elKey,
            posX: position.x,
            posY: position.y
          }
        })
      } else if (this.editing.type === 'addEdge') {
        this.auxliiaryEdgePath = this.calculateStraightPath({
          x0: this.selectedNode.posX,
          y0: this.selectedNode.posY,
          x1: position.x,
          y1: position.y
        })
      }
    },
    mouseUpHandler () {
      // No need to check edit mode, because if editing type is 'link', the edit board must be in edit mode
      if (this.editing.editType === 'addEdge' && this.hoveredNode) {
        /** Add edge */
        this.$emit('insert', {
          type: 'edge',
          attrs: {
            source: this.editing.elKey,
            target: this.hoveredNodeKey
          }
        })
      }
      this.editing = {}
    },
    nodeRightClicked (event) {
      var position = this.getRelativeMousePosition(event)
      if (this.editMode === 'edit') {
        /** Show the context menu at the current mouse position */
        this.dropMenuStyleValue = {
          top: position.y,
          left: position.x,
          position: 'absolute'
        }
        this.editing = { editType: 'contextmenu', elType: 'contextmenu', elKey: 'contextmenu' }
      }
    },
    showEditField (event) {
      if (this.editMode === 'edit') {
        let typeKeyObj = this.getElementTypeAndKey(event.target)
        let position, editType
        if (this.typeKeyObj.type === 'node') {
          editType = 'updateNode'
          position = this.getRelativeMousePosition(event)
        } else if (this.typeKeyObj.type === 'edge') {
          editType = 'updateEdge'
          position = this.getPathMiddlePosition(event.target)
        } else {
          return
        }
        this.editFieldStyleValue = {
          top: position.y,
          left: position.x,
          position: 'absolute'
        }
        this.editing = { editType: editType, elType: this.typeKeyObj.type, elKey: typeKeyObj.key }
      }
    },
    getElementTypeAndKey ($el) {
      let matchResult = $el.id.match(/(\w+)-(.+)/)
      return {
        type: matchResult[1],
        key: matchResult[2]
      }
    },
    getRelativeMousePosition (event) {
      return {
        x: this.$el.offsetLeft,
        y: this.$el.offsetTop
      }
    },
    calculateStraightPath (edge) {
      /** TODO: calculate path according to edge's properties */
      return D3.path()
        .moveTo(edge.x0, edge.y0)
        .lineTo(edge.x1, edge.y1)
        .toString()
    },
    getPathMiddlePosition (path) {
      let length = path.getTotalLength()
      let midPoint = path.getPointAtLength(length / 2)
      return { x: midPoint.x, y: midPoint.y }
    }
  },
  computed: {
    auxiliaryEdgeShowed () {
      return this.editing.editType === 'addEdge'
    },
    contextMenuOpened () {
      return this.editing.editType === 'contextmenu'
    },
    editFieldShowed () {
      return ['updateNode', 'updateEdge'].includes(this.editing.editType)
    },
    dropMenuStyle () {
      return {
        left: this.dropMenuStyleValue.left + 'px',
        top: this.dropMenuStyleValue.top + 'px',
        position: this.dropMenuStyleValue.position
      }
    },
    selectedNode () {
      return this.nodeData.find(node => this.editing.key === node.key)
    },
    hoveredNode () {
      return this.nodeData.find(node => this.hoveredNodeKey === node.key)
    }
  },
  components: { DropMenu }
}
</script>
<style  scoped>
#board {
  position: relative;
}
.node {
  stroke: black;
  stroke-width: 3px;
}
.initial {
  fill: rgb(43, 161, 152);
}
.final {
  fill: rgb(230, 59, 16);
}
.normal {
  fill: #f7f7f7;
}
.node:hover {
  stroke: slateblue
}
</style>
