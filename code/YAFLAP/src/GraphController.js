import { defaultValue } from '@/settings'
import { LinkBehavior } from '@/LinkBehavior'
import D3 from 'd3'
import { eCode, Exception } from '@/utils/error'

export const E_CODE = {
  invalidGraph: 'invlid graph'
}
export const NODE_TYPE = {
  dfa: 'dfa',
  nfa: 'nfa',
  invalid: 'invalid',
  empty: 'empty'
}
const PATH_TYPE = {
  straight: 'straight',
  curve: 'curve',
  ring: 'ring'
}

const helpers = {
  isInitialNode: node => node.type === NODE_TYPE.initFinal || node.type === NODE_TYPE.initial,
  callIfDefined: (fn, thisArg) => {
    let fnArgs = Array.prototype.slice.call(arguments, 2)
    if (fn !== undefined) {
      return fn.call(thisArg, fnArgs)
    }
  },
  setAttributes: (el, attrObj) => {
    for (let attr in attrObj) {
      el.setAttribute(attr, attrObj[attr])
    }
  },
  appendChilds: (parentEl, childEls) => {
    for (var child in childEls) {
      parentEl.appendChild(child)
    }
  }
}
class Node {
  constructor (key, type, label, pos) {
    this.key = key
    this.type = type
    this.label = label
    this.pos = pos
  }
  get id () {
    return this.key
  }
}

class Edge {
  /**
   * @param {Object} key object with source node and target node
   * @param {String} label Edge's label
   * @param {String} pathType optional, path's type of the edge
   */
  constructor (key, label) {
    this.key = key
    this.label = label
  }
  // Property accessors
  get id () {
    return this.key.source.key + '->' + this.key.target.key
  }
}

class Graph {
  constructor (nodes, edges) {
    if (Graph.isGraphValid()) {
      this.nodes = nodes
      this.edges = edges
    } else {
      throw new Exception(eCode.invalidGraph)
    }
  }
  isGraphValid () {
    return this.edges.any(edge =>
      this.nodes.includes(edge.key.source) &&
      this.nodes.includes(edge.key.target)
    )
  }
  addNode (node) {
    if (this.findNode(node.key) !== undefined) {
      throw new Exception(eCode.NODE_EXISTS)
    } else {
      this._nodes.push(new Node(node))
    }
  }
  /**
   * @param {Object} edge Plain object with edge's properties
   */
  addEdge (edge) {
    if (this.findEdge(edge.key) !== undefined) {
      throw new Exception(eCode.EDGE_EXISTS)
    } else {
      this._edges.push(edge)
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
      this._edges.filter(edge =>
        edge.key.source !== deletedNode &&
        edge.key.target !== deletedNode
      )
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
      this._edges.splice(index, 1)
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
    }
  }
  setGraph (graph) {
    this.nodes = graph.nodes
    this.edges = graph.edges
  }
}

export class VisualGraph {
  constructor (root, props) {
    // VisualGraph's Properties
    this._root = root
    this._graph = new Graph(props.nodes, props.edges)
    this._props = props
    this._mouseEventHdlrs = {
      node: { click: undefined, dblcilck: undefined, contextmenu: undefined, dragstart: undefined, dragend: undefined },
      edge: { click: undefined, dblcilck: undefined, contextmenu: undefined },
      board: { click: undefined, dblcilck: undefined, contextmenu: undefined },
      link: { start: undefined, end: undefined }
    }
    this._idOf = {
      root: 'board',
      edgeGroup: 'edge-group',
      nodeGroup: 'node-group',
      auxPath: 'aux-path',
      indicatorMarker: 'indicator-marker',
      indicator: 'indicator',
      node: n => `node#${n.key}`,
      edge: e => `edge#${e.key.source.key}->${e.key.target.key}`
    }
    this._classOf = {
      node: 'node',
      edge: 'edge',
      nodeLabel: 'node-label',
      nodeCircle: 'node-circle',
      nodeOverlay: 'node-overlay',
      nodeIndicator: 'node-indicator',
      edgePath: 'edge-path',
      edgePathText: 'edge-path-text'
    }
    this._edgePathStyleOf = {}
    this._isEventChanged = false
    this._isDataChanged = false
    this._linkBehavior = new LinkBehavior()

    this._initEdgePathStyle()
    this._redraw()

    // Setup events after we create all graph's elements
    this._initMouseEvents()
    if (props.canDrag) this._enableDragging()
    if (props.canLink) this._enableLinking()
  }
  addNode (node) {
    this._graph.addNode(new Node(node.key, node.type, node.label, node.pos))
    this._redraw()
  }
  /**
   * @param {Object} edge Plain object with edge's properties
   */
  addEdge (edge) {
    this._graph.addEdge(new Edge(edge.key, edge.label))
    this._redraw()
  }
  /**
   * @param {String | Number} arg Either node's key or index
   * @returns undefined if not found
   * @returns node if found
   */
  deleteNode (args) {
    this._graph.deleteNode(args)
    this._redraw()
  }
  /**
   * @param {Object | Number} arg Either edge's key or index
   */
  deleteEdge (args) {
    this._graph.deleteEdge(args)
    this._redraw()
  }
  findNode (args) {
    this._graph.findNode(args)
  }
  findEdge (args) {
    this._graph.findEdge(args)
  }
  updateEdge (args, props) {
    this._graph.updateEdge(args, props)
    this._redraw()
  }
  updateNode (args, props) {
    this._graph.updateNode(args, props)
    this._redraw()
  }
  setGraph (graph) {
    this._graph.setGraph(graph)
    this._redraw()
  }
  canDrag (val) {
    if (val !== undefined && val !== this._canDrag) {
      this._canDrag = val
      if (val) {
        this._enableDragging()
      } else {
        this._disableDragging()
      }
    }
    return this._canDrag
  }
  canLink (val) {
    if (val !== undefined && val !== this._canDrag) {
      this._canLink = val
      if (val) {
        this._enableLinking()
      } else {
        this._disableLinking()
      }
    }
    return this._canLink
  }
  on (elName, eventName, eventFn) {
    if (VisualGraph._VALID_EVENTS[elName][eventName]) {
      this._mouseEventHdlrs[elName][eventName] = eventFn
      this._isEventChanged = true
    }
  }

  _getNodeStyle (node) {
    var stroke = '#333333'
    var strokeWidth = '10px'
    var fill, indicator
    switch (this.type) {
      case 'initial':
        fill = '#003344'
        break
      case 'final':
        fill = '#330044'
        break
      case 'normal':
        fill = '#334400'
        break
      case 'initFinal':
        fill = '#003344'
        indicator = this._getNodeIndicatorStyle(node)
        break
    }
    return { fill, stroke, strokeWidth, indicator }
  }
  _getEdgeStyle (edge) {
    return {
      pathFn: this._edgePath.bind(this),
      stroke: '#000',
      strokeWidth: '10px',
      d: this._edgePath(edge)
    }
  }
  _getEdgePath (edge) {
    function _distance (source, target) {
      var dx = target.x - source.x
      var dy = target.y - source.y
      return Math.sqrt(dx * dx + dy * dy)
    }

    var sourceNodePos = edge.key.source.pos
    var targetNodePos = edge.key.target.pos
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
  _getNodeIndicatorStyle (node) {
    var hasIndicator = node =>
      node.type === NODE_TYPE.initial &&
      node.type === NODE_TYPE.initFinal

    return hasIndicator(node) ? {
      style: {
        d: `
          M ${this.pos.x - defaultValue.node.radius} ${this.pos.y}
          L ${this.pos.x - 2 * defaultValue.node.radius} ${this.pos.y - defaultValue.node.radius}
          L ${this.pos.x - 2 * defaultValue.node.radius} ${this.pos.y + defaultValue.node.radius}
          Z
        `,
        fill: '#000'
      }
    } : undefined
  }
  // Helpers
  _initEdgePathStyle () {
    var bucketOfEdges = []
    function edgeArrayToEdgeBucket (edge) {
      var isSamePair = (thisPair, thatPair) => thisPair.includes(thatPair[0]) && thisPair.includes(thatPair[1])
      for (let entry of this) {
        let nodePair = Object.values(edge.key).map(node => node.key)
        if (isSamePair(entry.nodePair, nodePair)) {
          entry.edges.push(edge)
        } else {
          bucketOfEdges.push({ nodePair, edges: [ edge ] })
        }
      }
    }
    function toEdgePathStyleObj ({ nodePair, edges }, acc) {
      var firstEdge = edges[0]
      var secondEdge = edges[1]
      if (edges.length === 1) {
        return Object.assign(acc, {
          [firstEdge.id]: (nodePair.source === nodePair.target) ? PATH_TYPE.ring : PATH_TYPE.straight
        })
      } else {
        return Object.assign(acc, {
          [firstEdge.id]: PATH_TYPE.curve,
          [secondEdge.id]: PATH_TYPE.curve
        })
      }
    }

    this._edgePathStyleOf =
      this._graph.edges
        .map(edgeArrayToEdgeBucket)
        .reduce(toEdgePathStyleObj, {})
  }
  _enableDragging () {
    var that = this
    var dragStarted = function (node) {
      D3.select(this).raise().classed('draging', true)
      helpers.callIfDefined(that._mouseEventHdlrs.drag.start, this, {
        node,
        sourceDOM: this
      })
    }
    var dragging = function (node) {
      node.pos = { x: D3.event.x, y: D3.event.y }
      this._redraw()
    }
    var dragFinished = function (node) {
      D3.select(this).raise().classed('dragging', false)
      helpers.callIfDefined(that._mouseEventHdlrs.drag.end, this, {
        node,
        sourceDOM: this
      })
    }

    this._d3Elements.nodes.call(this._d3Drag
      .on('start', dragStarted)
      .on('drag', dragging)
      .on('end', dragFinished))
  }
  _disableDragging () {
    this._d3Elements.nodes.on('.drag', null)
  }
  _enableLinking () {
    var that = this

    function linkStarted (event) {
      that._d3Elements.auxPath
        .attr('d', `M ${event.point.x} ${event.point.y} Z`)
        .style('display', '')
      helpers.callIfDefined(this._mouseEventHdlrs.link.start, that, event)
    }
    function linking (event) {
      let sourceNodePos = event.source.pos
      let currentMousePos = event.point
      that._d3Elements.auxPath
        .attr('d', `M ${sourceNodePos.x} ${sourceNodePos.y} L ${currentMousePos.x} ${currentMousePos.y}`)
    }
    function linkFinished (event) {
      that._d3Elements.auxPath.style('display', 'none')
      helpers.callIfDefined(this._mouseEventHdlrs.link.end, that, event)
    }
    this._linkBehavior
      .subject(this._d3Elements.nodes)
      .container(this._d3Elements.board)
      .on('start', linkStarted)
      .on('link', linking)
      .on('end', linkFinished)
      .enable()
  }
  _disableLinking () {
    this._linkBehavior.disable()
  }
  _createGroups () {
    /*
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refx="0" refy="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#f00" />
        </marker>
      </defs>
      <g :id="${this._id.node}"></g>
      <g :id="${this._id.edge}"></g>
      <path :id="${this._id.auxPath}" />
    */
    var root = document.getElementById(this.id.root)

    var fragment = document.createDocumentFragment()
    var indicatorDefs = document.createElement('defs')
    var indicatorMarker = document.createElement('marker')
    var indicatorPath = document.createElement('path')
    var nodeGroup = document.createElement('g')
    var edgeGroup = document.createElement('g')
    var auxPath = document.createElement('path')

    indicatorMarker.id = this._idOf['indicatorMarker']
    nodeGroup.id = this._idOf['nodeGroup']
    edgeGroup.id = this._idOf['edgeGroup']
    auxPath.id = this._idOf['auxPath']

    indicatorDefs.appendChild(indicatorMarker).append(indicatorPath)

    helpers.appendChilds(fragment, [indicatorDefs, nodeGroup, edgeGroup, auxPath])
    helpers.setAttributes(indicatorMarker, {
      markerWith: 10,
      refx: 0,
      refy: 3,
      orient: 'auto',
      markerUnits: 'strokeWidth'
    })
    helpers.setAttributes(indicatorPath, {
      d: 'M0,0 L0,6 L9,3 z',
      fill: '#000'
    })
    root.appendChild(fragment)
  }
  _redraw () {
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
  /*
   * <g>
   *   <circle cx="" cy"" r="" /> <!-- transparent overlay, for binding events ->
   *   <text x="" y="" text-anchor="middle">{{ text }}</text>
   *   <circle cx="" cy="" r="" stroke="" fill="" />
   * </g>
   */
    let newNodes = selection.enter().append('g')
    newNodes.append('circle').classed(this._classOf['nodeOverlay']) // Overlay for event binding
    newNodes.append('text').classed(this._classOf['nodeLabel']) // Label
    newNodes.append('circle').classed(this._classOf['nodeShape']) // Actual Shape
    newNodes.filter(helpers.isInitialNode)
      .append('path').classed('node-indicator', true) // Indicator

    this.updateNodeElement(newNodes)
  }
  _updateNodeElement (selection) {
    selection.each(function (datum) {
      var node = this
      var nodeLabel = this.getElementsByClassName(this._classOf['nodeLabel'])[0]
      var nodeCircle = this.getElementsByClassName(this._classOf['nodeShape'])[0]
      var nodeOverlay = this.getElementByClassName(this._classOf['nodeOverlay'])[0]
      var nodeIndicator = helpers.isInitialNode(datum)
        ? this.getElementByClassName(this._classOf['nodeIndicator'])[0]
        : undefined

      node.id = `node-${datum.key}`
      nodeLabel.textContent = node.label

      helpers.setAttributes(nodeOverlay, {
        'cx': datum.pos.x,
        'cy': datum.pos.y,
        'r': defaultValue.node.radius
      })
      helpers.setAttributes(nodeCircle, {
        'cx': datum.pos.x,
        'cy': datum.pos.y,
        'r': defaultValue.node.radius,
        'fill': datum.style.fill,
        'stroke': datum.style.stroke,
        'strokeWidth': datum.style.strokeWidth
      })
      helpers.setAttributes(nodeLabel, {
        'text-anchor': 'middle',
        'x': datum.pos.x,
        'y': datum.pos.y
      })

      if (nodeIndicator !== undefined) {
        var indicatorStyle = this._getNodeIndicatorStyle()
        helpers.setAttributes({
          'd': indicatorStyle.d,
          'fill': indicatorStyle.fill
        })
      }
    })
  }
  _removeNodeElement (selection) {
    selection.exit().remove()
  }
  _redrawEdge () {
    var changedSelection = this._d3Elements.edges.data(this._edges, edge => edge.id)
    this._createEdgeElement(changedSelection)
    this._updateEdgeElement(changedSelection)
    this._removeEdgeElement(changedSelection)

    // The old selection is expired once new items are inserted
    // or the joined data changed, thus we need to select it again.
    this._d3Elements.edges = this._d3Elements.edgeGroup.selectAll('g')
      .data(this._nodes, node => node.id)
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
    newEdges.append('path').classed(this._classOf['edgePath'], true)
    newEdges.append('text').append('textPath').classed(this._classOf['edgeTextPath'], true)

    this._updateEdgeElement(newEdges)
  }
  _updateEdgeElement (selection) {
    selection.each(function (datum) {
      var edge = this
      var path = this.getElementByClassName(this._classOf['edgePath'])[0]
      var textPath = this.getElementByClassName(this._classOf['edgeTextPath'])[0]

      edge.id = `edge#${datum.id}`
      path.id = `path#${datum.id}`
      path.setAttribute('d', this._getEdgePath(path))
      path.setAttribute('marker-end', `url(#${this._idOf['indicator']})`)

      textPath.setAttribute('href', 'path#' + datum.id)
      textPath.textContent = datum.label
    })
  }
  _removeEdgeElement (selection) {
    selection.exit().remove()
  }
  _initMouseEvents () {
    var that = this
    var mouseEventNames = ['click', 'dblclick', 'contextmenu']
    var involvedElements = ['nodes', 'edges', 'board']

    for (let el of involvedElements) {
      for (let event of mouseEventNames) {
        this._d3Elements[el].on(event, function (data) {
          let eventObj, mouse

          switch (el) {
            case 'nodes':
              eventObj = { sourceDOM: this, node: data }
              break
            case 'edges':
              eventObj = { sourceDOM: this, edge: data }
              break
            case 'board':
              mouse = D3.mouse(that._d3Elements.board.node())
              eventObj = {
                sourceDOM: this,
                pos: { x: mouse[0], y: mouse[1] }
              }
              break
          }
          helpers.callIfDefined(that._mouseEventHdlrs.nodes[event], that, eventObj)
        })
      }
    }
    for (let eventName in this._mouseEventHdlrs['node']) {
      this._d3Elements.nodes.on(eventName, function (node) {
        helpers.callIfDefined(that._mouseEventHdlrs.nodes[eventName], that, {
          node: Object.assign({}, node),
          sourceDOM: this
        })
      })
    }
  }
}

/**
 * Callback function parameters
 */
VisualGraph._VALID_EVENTS = {
  node: ['click', 'dblclick', 'contextmenu', 'dragstart', 'dragend'], // node srcEvent
  edge: ['click', 'dblclick', 'contextmenu'], // edge (with source and target ndoe info copy fron list), srcEvent
  board: ['click', 'dblclick', 'contextmenu'], // pos (clicked pos), srcEvent
  link: ['start', 'end'] // source, target, mouse, srcEvent link.start
}
