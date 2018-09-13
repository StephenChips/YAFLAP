<template>
  <div class="edit-board">
    <svg id="board">
      <!-- Definition of edge's arrow -->
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
      <!-- They are below all nodes, thus should be written above -->
      <g id="edges"></g>
      <g id="nodes"></g>
      <path id="aux-edge" class="aux-edge"/>
    </svg>
    <!-- Auxiliary elements: input field, context menu and auxiliary edge for creating new edge -->
    <input type="text" size="10" id="edit-field" class="edit-field" v-model="editFieldValue" />
    <drop-menu id="contextmenu" :item="item"></drop-menu>
  </div>
</template>
<script>
import DropMenu from '@/components/DropMenu'

// eslint-disable-next-line
import * as D3 from 'd3'
import { autometa, Edge, Node } from '@/Autometa'
import { EDIT_MODE, NODE_TYPE } from '@/utils/enum'
import { defaultValue, nodeStyle } from '@/utils/settings'
import { parseTransition, KeyGenerator } from '@/utils/helpers'

export default {
  name: 'edit-board',
  mounted () {
    let vue = this
    // This two properties are managed by D3. Thry record every nodes and edges' position.
    vue.nodePos = []
    vue.edgePos = []
    vue.$nextTick(function () {
      d3Main(vue)
    })
  },
  data () {
    return {
      nodeType: [ 'initial', 'final', 'normal', 'initFinal' ],
      editFieldValue: ''
    }
  },
  computed: {
    item () {
      return this.nodeType.map(type => 'Set as ' + type + 'type')
    },
    editMode () {
      return this.$store.state.editBoardStore.editMode
    }
  },
  components: { DropMenu }
}
function d3Main (vue) {
  let root = D3.select(vue.$el)
  let editField = root.select('#edit-field')
  let contextMenu = root.select('#context-menu')
  let board = root.select('#board')
  let nodes = board.select('#nodes').selectAll('g')
  let edges = board.select('#edges').selectAll('g')
  let auxEdge = board.select('#aux-edge')
  let forceSimulation = D3.forceSimulation()

  /**
   * Node's properties:
   *   key: String,
   *   label: String,
   *   type: String
   * Edge's property
   *   source: Node
   *   target: Node
   *   transition: Array<String>
   */
  let graph = {
    nodes: [],
    edges: []
  }
  let selectedNode, hoveredNode, rightClickedNode
  let selectedEdge
  let keyGen = new KeyGenerator()

  function setupVueEvents () {
    vue.$on('item-clicked', function (itemIndex) {
      updateNode({
        key: rightClickedNode.key,
        type: vue.nodeType[itemIndex]
      })
      hideMenu()
      restart()
    })
    vue.$watch('editMode', function () {
      restart()
    })
  }
  function getEdgeID (edge) {
    return `edge#'${edge.source.key}->${edge.target.key}`
  }
  function getNodeID (node) {
    return '' + node.key
  }
  function getEdgePath (edge) {
    let dx = edge.target.x - edge.source.x
    let dy = edge.target.y - edge.source.y
    let dr = Math.sqrt(dx * dx + dy * dy)
    return `
      M ${edge.source.x} ${edge.source.y}
      A ${dr} ${dr} 0 0 1 ${edge.target.x} ${edge.target.y}
    `
  }
  function insertSVGEdges (data) {
    /**
     * structure:
     * <g>
     *   <path></path>
     *   <text>
     *     <textPath></textPath>
     *   </text>
     * </g>
     */
    edges
      .data(data)
      .enter()
      .append('g')

    edges.selectAll('path')
      .data(data)
      .enter()
      .append('path')

    let edgeLabels = edges.selectAll('text')
      .data(data)
      .enter()
      .append('text')

    edgeLabels.selectAll('textPath')
      .data(data)
      .enter()
      .append('textPath')
  }
  function setSVGEdgeProperties () {
    edges
      .attr('id', g => getEdgeID(g))
      .attr('class', 'edge')

    edges.selectAll('path')
      .attr('class', 'edge-path')
      .attr('marker-end', 'url(#arrow)')
      .attr('d', e => getEdgePath(e))

    let edgeLabel = edges.selectAll('text')
      .attr('dy', '-12')
      .style('text-anchor', 'middle')
      .style('font', '16px sans-serif')

    edgeLabel.selectAll('textPath')
      .attr('href', edge => getEdgeID(edge))
      .attr('startOffset', '50%')
      .text(edge => edge.label)
  }
  function insertSVGNodes (nodes, data) {
    nodes
      .data(data)
      .enter()
      .append('g')

    nodes.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')

    nodes.selectAll('text')
      .data(data)
      .enter()
      .append('text')

    let initialNodes = nodes.filter(node =>
      node.type === NODE_TYPE.initial ||
      node.type === NODE_TYPE.initFinal)
    initialNodes
      .selectAll('path')
      .data(data)
      .enter()
      .append('path')

    return nodes
  }
  function setSVGNodeProperties () {
    nodes
      .attr('id', node => getNodeID(node))
      .attr('class', node => `node ${nodeClass(node)}`)

    nodes.selectAll('circle')
      .attr('class', node => 'node-circle')
      .attr('r', nodeStyle.nodeCircle.radius)
      .attr('cx', node => node.x)
      .attr('cy', node => node.y)

    nodes.selectAll('text')
      .attr('class', 'node-label')
      .attr('x', node => node.x)
      .attr('y', node => node.y + 2 * nodeStyle.nodeCircle.radius)
      .text(node => node.label)

    let initialNodes = nodes.filter(node =>
      node.type === NODE_TYPE.initial ||
      node.type === NODE_TYPE.initFinal)
    initialNodes
      .filter(node => node.type === NODE_TYPE.initial || node.type === NODE_TYPE.initFinal)
      .attr('d', node => getIndicatorPath(node))
  }
  function getIndicatorPath (node) {
    let radius = nodeStyle.nodeCircle.radius
    return `
      M ${node.x - radius} ${node.y}
      L ${node.x - 2 * radius} ${node.y - radius}
      L ${node.x - 2 * radius} ${node.y + radius}
      Z
    `
  }
  function nodeClass (type) {
    let classAttr
    switch (type) {
      case NODE_TYPE.initial:
        classAttr = 'initial'; break
      case NODE_TYPE.final:
        classAttr = 'final'; break
      case NODE_TYPE.normal:
        classAttr = 'normal'; break
      case NODE_TYPE.initFinal:
        classAttr = 'initial final'; break
    }
    return classAttr
  }
  function bindLinkNodeEvent () {
    function updateAuxEdgePath () {
      let cooridnate = D3.mouse(board.node())
      showAuxEdge(selectedNode.x, selectedNode.y, cooridnate[0], cooridnate[1])
    }
    function createNewEdge () {
      let newEdge = {
        source: selectedNode,
        target: hoveredNode,
        label: defaultValue.edgeLabel
      }
      graph.edges.push(newEdge)
      autometa.insertEdge(new Edge(newEdge.source.key, newEdge.target.key, parseTransition(newEdge.label)))
      vue.$store.commit('updateEdgeCount', autometa.edgeCount)
      vue.$store.commit('updateAutometaType', autometa.type)
      vue.$store.dispatch('matchString')
    }

    nodes.selectAll('node-circle').on('mousedown', function startLinking (node) {
      selectedNode = node
      showAuxEdge(selectedNode.x, selectedNode.y, selectedNode.x, selectedNode.y)

      /** Next step */
      board
        .on('mousemove', updateAuxEdgePath)
        .on('mouseup', () => {
          hideAuxEdge()
          clearEvents(board, 'mousemove', 'mouseup')
          clearEvents(nodes, 'mousemove', 'mouseup')
          selectedNode = null
        })
      nodes.selectAll('.node-circle')
        .on('mousemove', updateAuxEdgePath)
        .on('mouseup', () => {
          hideAuxEdge()
          createNewEdge()
          clearEvents(board, 'mousemove', 'mouseup')
          clearEvents(nodes, 'mousemove', 'mouseup')
          selectedNode = null
          restart()
        })
    })
  }
  function bindDragNodeEvent () {
    nodes.selectAll('node-circle').call(D3.drag()
      .container(board.node())
      .on('start', function pick (node) {
        if (!D3.event.active) forceSimulation.alphaTarget(0.3).restart()
        node.fx = node.x
        node.fy = node.y
      })
      .on('drag', function drag (node) {
        node.fx = D3.event.x
        node.fy = D3.event.y
      })
      .on('end', function drop (node) {
        node.fx = node.fy = null
      }))
  }
  function bindOpenContextMenuEvent () {
    nodes.selectAll('node-circle').on('contextmenu', showMenu)
  }
  function bindEditNodeLabelEvent () {
    nodes.selectAll('.node-label')
      .on('dblclick', function openEditField (node) {
        let radius = nodeStyle.nodeCircle.radius
        showEditField(node.x, node.y - 2 * radius)
        board.on('click', function closeEditField () {
          hideEditField()
          if (vue.editMode === EDIT_MODE.add) {
            bindAddNodeEvent()
          }
        })
      })
  }
  function bindEditEdgeLabelEvent () {
    edges.selectAll('.edge-path')
      .on('dblclick', function openEditField (edge) {
        selectedEdge = edge
        board.on('click', function closeEditField () {
          if (vue.editMode === EDIT_MODE.add) {
            updateEdge({
              source: selectedEdge.source,
              target: selectedEdge.target,
              label: vue.editFieldValue
            })
            selectedEdge = undefined
            hideEditField()
            bindAddNodeEvent()
          }
        })
      })
  }
  function bindAddNodeEvent () {
    board.on('click', function () {
      let cooridnate = D3.mouse(board.node())
      addNode(...cooridnate)
      restart()
    })
  }
  function bindDeleteNodeEvent () {
    nodes.selectAll('.node-circle')
      .on('click', function (node) {
        graph.nodes = graph.nodes.filter(n => n !== node)
        graph.edges = graph.edges.filter(edge =>
          edge.source !== node &&
          edge.target !== node)
        restart()
      })
  }
  function bindDeleteEdgeEvent () {
    edges.selectAll('.edge-path')
      .on('click', function () {
        let selectedEdge = D3.select(this.parentNode)
        // delete
        graph.edges = graph.edges.filter(e =>
          e.source !== selectedEdge.source ||
          e.target !== selectedEdge.target
        )
        restart()
      })
  }
  function showMenu (node) {
    rightClickedNode = node
    contextMenu
      .style('left', node.x + 'px')
      .style('right', node.y + 'px')
      .style('display', '')
      /** Next step */
    board.on('click', function () {
      hideMenu()
    })
  }
  function hideMenu () {
    // Vue event 'item-clicked' only become active when context menu is opened.
    contextMenu.style('display', 'none')

    // Because the event 'addNode' is replaced by the event 'hideContextMenu' when we open the menu
    // , we need to reset it here.
    bindAddNodeEvent()
  }
  function showAuxEdge (sourceX, sourceY, targetX, targetY) {
    let edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
    auxEdge
      .attr('d', edgePath)
      .style('display', edgePath)
  }
  function hideAuxEdge () {
    auxEdge.style('display', 'none')
  }
  function showEditField (x, y) {
    editField
      .style('left', x + 'px')
      .style('right', y + 'px')
      .style('display', '')
  }
  function hideEditField () {
    editField.style('display', 'none')
  }
  function bindGenericEvents () {
    nodes.selectAll('node-circle')
      .on('mouseover', function recordHoveredNode (node) {
        vue.hoveredNode = node
      })
      .on('mouseout', function eraseHoveredNode () {
        vue.hoveredNode = null
      })
  }

  function bindEventsOnAddMode () {
    bindLinkNodeEvent()
    bindAddNodeEvent()
  }
  function bindEventsOnEditMode () {
    bindDragNodeEvent()
    bindOpenContextMenuEvent()
    bindEditNodeLabelEvent()
    bindEditEdgeLabelEvent()
  }
  function bindEventsOnDeleteMode () {
    bindDeleteNodeEvent()
    bindDeleteEdgeEvent()
  }
  function addNode (x, y) {
    var newNode = {
      key: keyGen.generate(),
      x,
      y,
      label: defaultValue.nodeLabel,
      type: graph.nodes.length === 0 ? NODE_TYPE.initial : NODE_TYPE.normal
    }

    // Update
    graph.nodes.push(newNode)
    autometa.insertNode(new Node(newNode.key, newNode.type))
    vue.$store.commit('updateNodeCount', autometa.ndoeCount)
    vue.$store.commit('updateAutometaType', autometa.type)
    vue.$store.dispatch('matchString')
  }
  function updateNode (data) {
    let index = graph.nodes.findIndex(node => node.key === data.key)
    let node = graph.nodes[index]
    for (let prop in data) {
      node[prop] = data[prop]
    }
  }
  function updateEdge (data) {
    let index = graph.nodes.findIndex(edge => edge.source === data.source && edge.targt === data.target)
    let edge = graph.nodes[index]
    for (let prop in data) {
      edge[prop] = data[prop]
    }
  }
  function clearEvents (element) {
    if (element === 'all') {
      clearEvents(board, 'mousemove', 'mouseup', 'click')
      clearEvents(nodes.selectAll('.node-circle'), 'mousedown', 'mousemove', 'mouseup', 'contextmenu', 'click', '.drag')
      clearEvents(nodes.selectAll('.node-label'), 'dblclick')
      clearEvents(edges.selectAll('.edge-path'), 'click', 'dblclick')
    } else {
      let eventArray = Array.prototype.slice.call(arguments, 1)
      for (let event of eventArray) {
        element.on(event, null)
      }
    }
  }
  function bindEvents () {
    clearEvents('all')
    setupVueEvents()
    bindGenericEvents()
    switch (vue.editMode) {
      case EDIT_MODE.add:
        bindEventsOnAddMode(); break
      case EDIT_MODE.edit:
        bindEventsOnEditMode(); break
      case EDIT_MODE.delete:
        bindEventsOnDeleteMode(); break
    }
  }
  function drawGraph () {
    // First we just insert new elements into 'enter' set, but we don't setup their properties.
    insertSVGNodes(nodes, graph.nodes)
    insertSVGEdges(nodes, graph.edges)

    // Then, we update old elements' properties and setup new elements' properties at the same time.
    // Note that after we finish the first step, the 'enter' set become empty and the 'update' set is increased.
    setSVGNodeProperties(nodes)
    setSVGEdgeProperties(edges)

    // Finally, remove deleted data.
    nodes.exit().remove()
    edges.exit().remove()
  }
  function setupForceSimulation () {
    let boardRect = board.node().getBoundingClientRect()
    let forceLink = D3.forceLink()
      .links(graph.edges)
      .id(node => node.key)
    let forceManyBody = D3.forceManyBody()
    let forceCenter = D3.forceCenter((boardRect.right - boardRect.left) / 2, (boardRect.bottom - boardRect.top) / 2)

    forceSimulation
      .force('link', forceLink)
      .force('charge', forceManyBody)
      .force('center', forceCenter)

    forceSimulation
      .nodes(graph.nodes)
      .on('tick', drawGraph)

    forceSimulation.force('link')
      .links(graph.edges)
  }
  function restart () {
    setupForceSimulation()
    drawGraph()
    bindEvents()
  }
  restart()
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
