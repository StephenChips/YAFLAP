import { defaultValue } from '@/settings'
import { LinkBehavior } from '@/LinkBehavior'
import D3 from 'd3'
import { eCode, Exception } from '@/utils/error'
import { NODE_TYPE, PATH_TYPE } from '@/utils/enum'
import { KeyGenerator } from '@/utils/helpers'

const keyGenerator = new KeyGenerator()

class Node {
  constructor (key, type, pos, label) {
    this.key = key
    this.type = type
    this.pos = pos
    this.label = label
  }
  get indicator () {
    if (this.type !== 'initial' && this.type !== 'initFinal') {
      return undefined
    } else {
      return {
        style: {
          d: `
            M ${this.pos.x - defaultValue.node.radius} ${this.pos.y}
            L ${this.pos.x - 2 * defaultValue.node.radius} ${this.pos.y - defaultValue.node.radius}
            L ${this.pos.x - 2 * defaultValue.node.radius} ${this.pos.y + defaultValue.node.radius}
            Z
          `,
          fill: '#000'
        }
      }
    }
  }
  get style () {
    var stroke = '333333'
    var strokeWidth = 10
    switch (this.type) {
      case 'initial':
        return { fill: '#003344', stroke, strokeWidth }
      case 'final':
        return { fill: '#330044', stroke, strokeWidth }
      case 'normal':
        return { fill: '#334400', stroke, strokeWidth }
      case 'initFinal':
        return { fill: '#003344', stroke, strokeWidth }
    }
  }
}

class Edge {
  /**
   * @param {Object} key object with source node and target node
   * @param {String} label Edge's label
   * @param {String} pathType optional, path's type of the edge
   */
  constructor (key, label, pathType) {
    this.key = {
      ...key,
      toString () {
        return this.key.source.key + '->' + this.key.target.key
      }
    }
    this.label = label
    this.pathType = pathType
  }
  get path () {
    function _distance (source, target) {
      var dx = target.x - source.x
      var dy = target.y - source.y
      return Math.sqrt(dx * dx + dy * dy)
    }

    var sourceNodePos = this.key.source.pos
    var targetNodePos = this.key.target.pos
    var rx, ry

    switch (this.pathType) {
      case PATH_TYPE.straight:
        return `
          M ${sourceNodePos.x} ${targetNodePos.y}
          L ${targetNodePos.x} ${targetNodePos.y}
        `
      case PATH_TYPE.curve:
        rx = ry = _distance(sourceNodePos, targetNodePos)
        return `
          M ${sourceNodePos.x} ${sourceNodePos.y}
          A ${rx} ${ry} 0 0,1 ${targetNodePos.x} ${targetNodePos.y}
        `
      case PATH_TYPE.ring:
        return `
           M ${sourceNodePos.x} ${sourceNodePos.y}
           l -5 -8
           a 6 6 0 1 1 10 0
           z
        `
    }
    return undefined
  }
}

export class Position {
  constructor (x, y) {
    this.x = x
    this.y = y
  }
}

export class GraphController {
  constructor (vue, editMode) {
    this._vue = vue
    this._editingNode = null
    this._editingEdge = null
    this._d3Elements = {}
    this._vueComponents = {}
    this._listeners = {}
    this._linkBehavior = new LinkBehavior()
    this._dragEvent = D3.drag()

    this._nodes = []
    this._edges = []

    this._init(editMode)
  }

  get editMode () {
    return this._editMode
  }
  set editMode (mode) {
    this._editMode = mode
    this._setupEventsAgain()
  }
  addNode (node) {
    if (this.findNode(node) !== undefined) {
      throw new Exception(eCode.NODE_EXISTS)
    } else {
      this._nodes.push(new Node(node))
      this._redraw()
    }
  }
  /**
   * @param {Object} edge Plain object with edge's properties
   */
  addEdge (edge) {
    if (this.findEdge(edge) !== undefined) {
      throw new Exception(eCode.EDGE_EXISTS)
    } else {
      let reversedEdge = this._edges.find(e =>
        e.key.source === edge.key.target &&
        e.key.target === edge.key.source)
      let pathType
      if (reversedEdge) {
        pathType = edge.pathType = PATH_TYPE.curve
      } else {
        pathType = PATH_TYPE.straight
      }
      this._edges.push(new Edge({ ...edge, pathType }))
      this._redraw()
    }
  }
  /**
   * @param {String | Number} arg Either node's key or index
   * @returns undefined if not found
   * @returns node if found
   */
  deleteNode (arg) {
    let index
    if (typeof arg === 'string') {
      index = this._findIndexOfNode(arg) // return -1 if not found
    } else if (typeof arg === 'number') {
      index = arg < this._nodes.length ? index : -1
    }

    if (index === -1) {
      throw new Exception(eCode.NODE_NOT_EXISTS)
    } else {
      let deletedNode = this._nodes.splice(index, 1)[0]
      this._edges.filter(edge => edge.key.source !== deletedNode && edge.key.target !== deletedNode)
      this._redraw()
    }
  }
  /**
   * @param {Object | Number} arg Either edge's key or index
   */
  deleteEdge (arg) {
    let index
    if (typeof arg === 'number') {
      index = arg < this._edges.length ? arg : -1
    } else if (arg && arg.source && arg.target) {
      index = this._edges.findIndex(edge =>
        edge.key.source === arg.source &&
        edge.key.target === arg.target
      )
    }

    if (index === -1) {
      throw new Exception(eCode.EDGE_NOT_EXISTS)
    } else {
      let deletedEdge = this._edges.splice(index, 1)[0]
      let reversedEdge = this._edges.find(edge =>
        edge.key.source === deletedEdge.key.target &&
        edge.key.target === deletedEdge.key.source)
      if (reversedEdge) {
        reversedEdge.pathType = PATH_TYPE.straight
      }
      this._redraw()
    }
  }
  findNode (arg) {
    if (typeof arg === 'string') { // Find by key
      return this._nodes.find(node => node.key === arg)
    } else if (typeof arg === 'number') { // Find by index
      return this.nodes[arg]
    }
  }
  findEdge (arg) {
    if (typeof arg === 'object' && arg.key && arg.target) { // Find by key
      return this._edges.find(edge =>
        edge.key.source === arg.source &&
        edge.key.target === arg.target
      )
    } else if (typeof arg === 'number') { // Find by index
      return this.edges[arg]
    }
  }
  updateEdge (args, props) {
    let edge = this.findEdge(args)
    if (edge === undefined) {
      throw new Exception(eCode.EDGE_NOT_EXISTS)
    } else {
      Object.keys(edge).forEach(function (propName) {
        if (props.hasOwnProperty(propName)) {
          edge[propName] = props[propName]
        }
      })
      this._redraw()
    }
  }
  updateNode (args, props) {
    let node = this.findNode(args) // args could be an node's key, string or an number (index)
    if (node === undefined) {
      throw new Exception(eCode.NODE_NOT_EXISTS)
    } else {
      Object.keys(node).forEach(function (propName) {
        if (props.hasOwnProperty(propName)) {
          node[propName] = props[propName]
        }
      })
      this._redraw()
    }
  }
  _selectD3Element () {
    this._d3Elements.board = D3.select('#' + this.vue.editBoardProps.boardId)
    this._d3Elements.nodeGroup = D3.select('#' + this.vue.editBoardProps.nodeGroupId)
    this._d3Elements.edgeGroup = D3.select('#' + this.vue.editBoardProps.edgeGroupId)
    this._d3Elements.nodes = this._d3Elements.nodeGroup.selectAll('svg:g')
    this._d3Elements.edges = this._d3Elements.edgeGroup.selectAll('svg:g')
    this._d3Elements.auxPath = D3.select('#' + this.vue.editBoardProps.auxPathsId)

    this._redraw()
  }
  _selectVueElement () {
    this._vueComponents = {}
    for (let refName in this.vue.$ref) {
      this._vueComponents[refName] = this.vue.$ref[refName]
    }
  }

  _enableGeneralEvents () {
    var that = this
    function selectMenuItem (value) {
      /* Property nodeMenuProps.target should be not undefined */
      if (value in NODE_TYPE) {
        let targetKey = that.vue.nodeMenuProps.target.key
        that.updateNode(targetKey, { type: value })
      }
      /* Close menu after update */
      that.vue.nodeMenuProps = {
        pos: { x: 0, y: 0 },
        visible: false,
        target: undefined
      }
      that.vue.nodeMenuProps.visible = false
    }
    this._vueComponents.optionSetInitial.$on('submit', selectMenuItem)
    this._vueComponents.optionSetFinal.$on('submit', selectMenuItem)
    this._vueComponents.optionSetNormal.$on('submit', selectMenuItem)
    this._vueComponents.optionSetInitFinal.$on('submit', selectMenuItem)
  }
  _enableDraggingNode () {
    function beforeDragging () {
      D3.select(this).raise().classed('draging', true)
    }
    function dragging (node) {
      node.pos = { x: D3.event.x, y: D3.event.y }
      this._redraw()
    }
    function endDragging () {
      D3.select(this).raise().classed('dragging', false)
    }
    this._dragEvent
      .on('start', beforeDragging)
      .on('drag', dragging)
      .on('end', endDragging)
    this._d3Elements.nodes.call(this._dragEvent)
  }
  _enableLinkingNode () {
    var that = this
    function linkStarted (evt) {
      that._d3Elements.auxPath
        .attr('d', `M ${evt.point.x} ${evt.point.y} Z`)
        .style('display', '')
    }
    function linking (evt) {
      let sourceNodePos = evt.source.pos
      let currentMousePos = evt.point
      that._d3Elements.auxPath
        .attr('d', `M ${sourceNodePos.x} ${sourceNodePos.y} L ${currentMousePos.x} ${currentMousePos.y}`)
    }
    function linkFinished (evt) {
      that._d3Elements.auxPath.style('display', 'none')
      if (evt.target) {
        that.addEdge({
          key: { source: evt.source, target: evt.target },
          label: defaultValue.edge.label
        })
      }
    }
    this._linkBehavior
      .container(document.getElementById(this.vue.editBoardProps.boardId))
      .on('start', linkStarted)
      .on('link', linking)
      .on('end', linkFinished)
  }
  _enableChangingNodeType () {
    var that = this
    new Promise(function rightClickAndOpenMenu (resolve) {
      this._d3Elements.nodes.on('contextmenu', function (node) {
        that.vue.nodeMenuProps = {
          pos: { x: node.pos.x, y: node.pos.y },
          visible: true,
          target: node
        }
        that.vue.overlayProps.visible = true
        resolve()
      })
    }).then(function clickOverlayAndCloseMenu () {
      that.vue._vueComponents.overlay.$once('click', function () {
        that.vue.nodeMenuProps = {
          pos: { x: 0, y: 0 },
          visible: false,
          target: undefined
        }
        that.vue.overlayProps.visible = false
        that.vue.nodeMenuProps.visible = false
      })
    })
  }
  _enableEditingNode () {
    var that = this
    this._d3Elements.nodes.on('dblclick.board', function (datum) {
      /* Show edit field above the node */
      let point = D3.mouse(document.getElementById(that.vue.editBoardProps.boardId))
      that.vue.nodeEditFieldProps = {
        target: datum,
        value: '',
        pos: { x: point[0], y: point[1] },
        visible: true
      }

      /* Update node */
      this._vueComponents.overlay.$once('click', function () {
        var targetKey = that.vue.nodeEditFieldProps.target.key
        that.updateNode(targetKey, {
          label: that.vue.nodeEditFieldProps.value
        })
        that.vue.overlayProps.visible = false
        that.vue.nodeEditFieldProps.visible = false
      })
    })
  }
  _enableEditingEdge () {
    let that = this
    new Promise(function showEdgeEditField (resolve) {
      let that = this
      this._d3Elements.edges.on('dblclick.board', function (edge) {
        /* Show edit field above the edge */
        let point = D3.mouse(document.getElementById(that.vue.editBoardProps.boardId))
        that.vue.edgeEditFieldProps = {
          target: edge,
          value: '',
          pos: { x: point[0], y: point[1] },
          visible: true
        }
        that.vue.overlayProps.visible = true
        resolve(edge)
      })
    }).then(function closeEditFieldAndUpdateEdge () {
      this._vueComponents.overlay.$once('click', function () {
        var targetKey = that.vue.edgeEditFieldProps.target.key
        var label = that.vue.edgeEditFieldProps.value

        this.updateEdge(targetKey, { label })
        that.vue.edgeEditFieldProps.visible = false
        that.vue.overlayProps.visible = false
      })
    })
  }
  _enableAddingNode () {
    var that = this
    this._d3Elements.board.on('click', function () {
      let mouse = D3.mouse(document.getElementById(that.vue.editBoardProps.boardId))
      this.addNode({
        key: keyGenerator.generate(),
        label: defaultValue.node.label,
        type: NODE_TYPE.normal,
        pos: { x: mouse[0], y: mouse[1] }
      })
    })
  }
  _enableAddingEdge () {
    this._linkBehavior.enable()
  }
  _enableDeletingNode () {
    let that = this
    this._d3Elements.nodes.on('click.board', function (node) {
      that.deleteNode(node.key)
    })
  }
  _enableDeletingEdge () {
    let that = this
    this._d3Elements.edges.on('click.board', function (edge) {
      that.deleteEdge(edge.key)
    })
  }
  _redraw () {
  /*
   * <g>
   *   <circle cx="" cy"" r="" /> <!-- transparent overlay, for binding events ->
   *   <text x="" y="" text-anchor="middle">{{ text }}</text>
   *   <circle cx="" cy="" r="" stroke="" fill="" />
   * </g>
   */
    this._redrawNode()
    this._redrawEdge()
  }
  _redrawNode () {
    var changedSelection = this._d3Elements.nodes.data(this._nodes, node => node.key) // Bind data again
    this._createNodeElement(changedSelection)
    this._updateNodeElement(changedSelection)
    this._removeNodeElement(changedSelection)

    // The old selection is expired once new items are inserted
    // or the joined data changed, thus we need to select it again.
    this._d3Elements.nodes = this._d3Elements.nodeGroup.selectAll('g')
      .data(this._nodes, node => node.key)
  }
  _createNodeElement (selection) {
    let newNodes = selection.enter().append('g')
    newNodes.append('circle').classed('node-overlay') // Overlay for event binding
    newNodes.append('text').classed('node-label') // Label
    newNodes.append('circle').classed('node-shape') // Actual Shape
    newNodes.filter(node => node.type === 'initial').append('path').classed('node-indicator') // Indicator

    this.updateNodeElement(newNodes)
  }
  _updateNodeElement (selection) {
    selection.each(function (datum) {
      var node = this
      var nodeLabel = this.getElementsByClassName('.node-label')[0]
      var nodeCircle = this.getElementsByClassName('.node-shape')[0]
      var nodeOverlay = this.getElementByClassName('.node-overlay')[0]
      var nodeIndicator
      if (datum.type === 'initial' || datum.type === 'initFinal') {
        nodeIndicator = this.getElementByClassName('.node-indicator')[0]
      }

      node.id = `node-${datum.key}`
      nodeLabel.textContent = node.label

      nodeOverlay.setAttribute('cx', datum.pos.x)
      nodeOverlay.setAttribute('cy', datum.pos.y)
      nodeOverlay.setAttribute('r', defaultValue.node.radius)

      nodeCircle.setAttribute('cx', datum.pos.x)
      nodeCircle.setAttribute('cy', datum.pos.y)
      nodeCircle.setAttribute('r', defaultValue.node.radius)
      nodeCircle.setAttribute('fill', datum.style.color)
      nodeCircle.setAttribute('stroke', datum.style.stroke)
      nodeCircle.setAttribute('stroke-width', datum.style.strokeWidth)

      nodeLabel.setAttribute('text-anchor', 'middle')
      nodeLabel.setAttribute('x', datum.pos.x)
      nodeLabel.setAttribute('y', datum.pos.y)

      nodeIndicator.setAttribute('p', datum.indicator.style.p)
      nodeIndicator.setAttribute('fill', datum.indicator.style.fill)
    })
  }
  _removeNodeElement (selection) {
    selection.exit().remove()
  }
  _redrawEdge () {
    var changedSelection = this._d3Elements.edges.data(this._edges, edge => edge.key.toString())
    this._createEdgeElement(changedSelection)
    this._updateEdgeElement(changedSelection)
    this._removeEdgeElement(changedSelection)

    // The old selection is expired once new items are inserted
    // or the joined data changed, thus we need to select it again.
    this._d3Elements.edges = this._d3Elements.edgeGroup.selectAll('g')
      .data(this._nodes, node => node.key.toString())
  }
  _createEdgeElement (selection) {
    /*
     * <g id="edge-k">
     *   <path id="path-k" d="" marker-end="url(#arrow)" />
     *   <text>
     *     <textPath href="path-k" class="edge-text-path">{{ content }}</textPath>
     *   </text>
     * </g>
     */
    let newEdges = selection.enter().append('g')
    newEdges.append('path').classed('edge-path', true)
    newEdges.append('text').append('textPath').classed('edge-text-path', true)

    this._updateEdgeElement(newEdges)
  }
  _updateEdgeElement (selection) {
    selection.each(function (datum) {
      var edge = this
      var path = this.getElementByClassName('.edge-path')[0]
      var textPath = this.getElementByClassName('.edge-text-path')[0]

      edge.id = `edge#${datum.key.toString()}`
      path.id = `path#${datum.key.toString()}`
      path.setAttribute('d', datum.path)
      path.setAttribute('marker-end', 'url(#arrow)')

      textPath.setAttribute('href', `path#${datum.key.toString()}`)
      textPath.textContent = datum.label
    })
  }
  _removeEdgeElement (selection) {
    selection.exit().remove()
  }
  _setupEventsAgain () {
    this.disableAllEvents()
    this._setupEvents()
  }
  _disableAllEvents () {
    Object.keys(this._d3Elements).forEach(key => {
      this._d3Elements[key].on('.board', null)
    })
    this._d3Elements.nodes.on('.drag', null)
    this._linkBehavior.disable()
  }
  _setupEvents () {
    this._enableGeneralEvents()
    switch (this.editMode) {
      case 'edit':
        this._enableDraggingNode()
        this._enableAddingNode()
        break
      case 'add':
        this._enableLinkingNode()
        this._enableEditingNode()
        this._enableEditingEdge()
        break
      case 'delete':
        this._enableDeletingNode()
        this._enableDeletingEdge()
        break
    }
  }
  _init (editMode) {
    this._selectD3Element()
    this._selectVueElement()
    this._editMode = editMode || defaultValue.editMode
    this._setupEvents()
  }
}
