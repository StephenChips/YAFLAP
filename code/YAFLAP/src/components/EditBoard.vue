<template>
  <div class="edit-board">
    <svg :id="editBoardProps.boardId">
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refx="0" refy="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#f00" />
        </marker>
      </defs>
      <!-- Elements will be prepared when d3 controller is initialized.  -->
      <g :id="editBoardProps.nodeGroupId"></g>
      <g :id="editBoardProps.edgeGroupId"></g>
      <path :id="editBoardProps.auxPathId" />
    </svg>

    <edit-field ref="edgeEditField"
      v-show="edgeEditFieldProps.visible"
      :x="edgeEditFieldProps.pos.x"
      :y="edgeEditFieldProps.pos.y"
      v-model="edgeEditFieldProps.value" />
    <edit-field ref="nodeEditField"
      v-show="edgeEditFieldProps.visible"
      :x="nodeEditFieldProps.pos.x"
      :y="nodeEditFieldProps.pos.y"
      v-model="edgeEditFieldProps.value" />
    <menu ref="nodeMenu" v-show="nodeMenuProps.visible">
      <menu-item :caption="'Set as Initial Node'" ref="optionSetInitial"/>
      <menu-item :caption="'Set as Final Node'" ref="optionSetFinal" />
      <menu-item :caption="'Set as Normal Node'" ref="optionSetNormal"/>
      <menu-item :caption="'Set as Initial-Final Node'" ref="optionSetInitFinal"/>
    </menu>
    <div ref="overlay" class="overlay" v-show="overlayProps.visible"></div>
</template>
<script>
import Menu from '@/components/Menu'
import EditField from '@/components/EditField'

// eslint-disable-next-line
import * as D3 from 'd3'
import { GraphController } from '@/GraphController'

export default {
  name: 'edit-board',
  mounted () {
    let vue = this
    this.$nextTick(function () {
      vue.$board = new GraphController(vue)
    })
  },
  data () {
    return {
      editBoardProps: {
        boardId: 'board',
        nodeGroupId: 'nodes',
        edgeGroupId: 'edges',
        auxPathId: 'auxPath',
        nodeEditFieldId: 'node-edit-field',
        edgeEditFieldId: 'edge-edit-field',
        menuId: 'menu',
        overlayId: 'overlay'
      },
      nodeEditFieldProps: {
        pos: {x: 0, y: 0},
        visible: false,
        value: '',
        target: undefined
      },
      edgeEditFieldProps: {
        pos: {x: 0, y: 0},
        visible: false,
        value: '',
        target: undefined
      },
      nodeMenuProps: {
        pos: {x: 0, y: 0},
        visible: false,
        target: undefined
      },
      overlayProps: {
        visible: false
      }
    }
  },
  computed: {
    editMode () {
      return this.$store.state.editBoardStore.editMode
    },
    isOverlayVisible () {
      return this.nodeEditFieldProp.visible || this.edgeEditFieldProp.visible || this.nodeMenuProps.visible
    }
  },

  components: { Menu, EditField }
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
