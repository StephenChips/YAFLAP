/*
### DEFINITION OF Automata
Automata = List<NodeRecord>

### DEFINITION OF NodeRecord
NodeRecord = { key: String, outEdges: List<Edge> type: NODE_TYPE }
Each BodeRecord should has a UNIQUE KWY.

### DEFINITION OF NODE
A node is just a node record without `outEdges` property.
Node = { key: String type: NODE_TYPE }
Just like a NodeRecord, each node should have a unique key too.

### DEFINITION OF EDGE
Edge = { key: { source: String, target: String }, trainsition: List<String> }
A edge's transition is either a single-char string or a empty string.
An empty string represent the epsilon transition (ε).

### SOME NECCESSARY ENUM TYPE
NODE_TYPE, AUTOMETA_TYPE, MATCH_RESULT, which are are defined below.
*/

export const NODE_TYPE = {
  normal: 'normal',
  initial: 'initial',
  final: 'final',
  initFinal: 'init final' // A node that is both final and initial
}

export const AUTOMETA_TYPE = {
  dfa: 'dfa',
  nfa: 'nfa',
  invalid: 'invalid',
  empty: 'empty' // Automata with no node and edge.
}

export const MATCH_RESULT = {
  ok: 'ok',
  failed: 'failed',
  // If automata cannot get the correct matching result, return this value.
  // For example, when the automata is invalid, it always return unknown.
  unknown: 'unknown'
}

export class Node {
  constructor (key, type) {
    this.key = key
    this.type = type
  }
}

export class Edge {
  constructor (source, target, transition) {
    this.key = { source, target }
    this.transition = transition || new Set()
  }
}

class NodeRecord {
  constructor (key, type, outEdges) {
    this.key = key
    this.type = type
    this.outEdges = outEdges
  }
  toNode () {
    return new Node(this.key, this.type)
  }
  static fromNode (node, outEdges) {
    return new NodeRecord(node.key, node.type, outEdges || [])
  }
}

const _NODE_PROPERTY_SET = new Set(Object.keys(new Node()))
const _EDGE_PROPERTY_SET = new Set(Object.keys(new Edge()))

export class Automata {
  constructor () {
    this._nodeRecords = []
    this._edgeCount = 0
    this._nodeCount = 0
  }
  hasNode (key) {
    return this._indexOfNodeRecord(key) !== -1
  }
  hasEdge (key) {
    let edgeIndex = this._indexOfEdge(key)
    return edgeIndex.nodeRecordIndex !== -1 && edgeIndex.outEdgeIndex !== -1
  }
  insertNode (node) {
    if (this.hasNode(node.key)) {
      throw new Error('Node exists.')
    } else {
      this._validateNodeProperties(node, 'insert')
      this._nodeRecords.push(NodeRecord.fromNode(node))
    }
    this._nodeCount++
  }
  insertEdge (edge) {
    let indexOfEdge = this._indexOfEdge(edge.key)
    if (indexOfEdge.nodeRecordIndex === -1) {
      throw new Error('No such source node.')
    } else if (indexOfEdge.outEdgeIndex !== -1) {
      throw new Error('Edge exists')
    } else {
      this._validateEdgeProperies(edge, 'insert')
      let nodeRecord = this._nodeRecords[indexOfEdge.nodeRecordIndex]
      nodeRecord.outEdges.push(edge)
    }
    this._edgeCount++
  }
  updateNode (key, propObj) {
    let nodeRecordIndex = this._indexOfNodeRecord(key)
    if (nodeRecordIndex === -1) {
      throw new Error('Node does not exists.')
    } else {
      let node
      this._validateNodeProperties(propObj, 'update')

      /** If all properties are valid, update them. */
      node = this._nodeRecords[nodeRecordIndex]
      for (let prop in propObj) {
        node[prop] = propObj[prop]
      }
    }
  }
  updateEdge (key, propObj) {
    let indexOfEdge = this._indexOfEdge(key)
    if (indexOfEdge.nodeRecordIndex === -1) {
      throw new Error('No such source node.')
    } else if (indexOfEdge.outEdgeIndex === -1) {
      throw new Error('Edge does not exists.')
    } else {
      this._validateEdgeProperies(propObj, 'update')

      /** If all properties are valid, update them. */
      let nodeRecord = this._nodeRecords[indexOfEdge.nodeRecordIndex]
      let edge = nodeRecord.outEdges[indexOfEdge.outEdgeIndex]
      for (let prop in propObj) {
        edge[prop] = propObj[prop]
      }
    }
  }
  deleteNode (key) {
    if (!this.hasNode(key)) {
      throw new Error('No such node.')
    } else {
      // Delete the node record first (include the node and its outgoing edges),
      // then filter out its all incomming edges.
      let indexOfNodeRecord = this._indexOfNodeRecord(key)
      this._nodeRecords.splice(indexOfNodeRecord, 1)
      for (let nodeRecord of this._nodeRecords) {
        nodeRecord.outEdges = nodeRecord.outEdges.filter(edge => edge.key.target !== key)
      }
    }
    this._nodeCount--

    var count = 0
    for (var record of this._nodeRecords) {
      count += record.outEdges.length
    }
    this._edgeCount = count
  }
  deleteEdge (key) {
    if (!this.hasEdge(key)) {
      throw new Error('Edge does not exists.')
    } else {
      let indexOfEdge = this._indexOfEdge(key)
      let nodeRecord = this._nodeRecords[indexOfEdge.nodeRecordIndex]
      nodeRecord.outEdges.splice(indexOfEdge.outEdgeIndex, 1)
    }
    this._edgeCount--
  }
  findNode (key) {
    let index = this._indexOfNodeRecord(key)
    if (index === -1) {
      return undefined
    } else {
      return this._nodeRecords[index].toNode()
    }
  }
  findEdge (key) {
    let indexOfEdge = this._indexOfEdge(key)
    if (indexOfEdge.nodeRecordIndex === -1 || indexOfEdge.outEdgeIndex === -1) {
      return undefined
    } else {
      let nodeRecord = this._nodeRecords[indexOfEdge.nodeRecordIndex]
      return nodeRecord.outEdges[indexOfEdge.outEdge]
    }
  }
  matchWholeString (str) {
    let automata = this
    let epsilonPath = []
    function isStrMatch (string, currentNode) {
      function epsilonClosure (nodeRef) {
        // Using BFS scheme
        let result = []
        let visitedNodeRecordKeySet = new Set()
        let nodeRecordQueue = [nodeRef]

        while (nodeRecordQueue.length > 0) {
          let currentNode = nodeRecordQueue.pop()
          result.unshift(currentNode)
          for (let edge of currentNode.outEdges) {
            if (edge.transition.has('') && !visitedNodeRecordKeySet.has(edge.key.target)) {
              let node = automata._findNodeRecord(edge.key.target)
              nodeRecordQueue.unshift(node)
              visitedNodeRecordKeySet.add(node.key)
            }
          }
        }
        return result
      } // end function epsilonClosure

      // Main body of function execute
      if (epsilonPath.includes(currentNode.key)) {
        return false
      } else if (string === '') {
        return epsilonClosure(currentNode).some(node =>
          node.type === NODE_TYPE.final ||
          node.type === NODE_TYPE.initFinal
        )
      } else {
        for (let edge of currentNode.outEdges) {
          let targetNode = automata._findNodeRecord(edge.key.target)
          console.log(currentNode, targetNode)
          if (edge.transition.has('')) {
            epsilonPath.push(currentNode.key)
            if (isStrMatch(string, targetNode)) return true
            epsilonPath.pop()
          }
          if (edge.transition.has(string[0])) {
            if (isStrMatch(string.slice(1), targetNode)) return true
          }
        }
        return false
      }
    } // End function isStrMatch
    // Main body of function matchWholeString
    var type = this.calculateType()
    if (type === AUTOMETA_TYPE.invalid || type === AUTOMETA_TYPE.empty) {
      return MATCH_RESULT.unknown
    } else if (isStrMatch(str, this._initialNode)) {
      return MATCH_RESULT.ok
    } else {
      return MATCH_RESULT.failed
    }
  }
  _findNodeRecord (key) {
    var nodeRec = this._nodeRecords.find(nodeRecord => nodeRecord.key === key)
    return nodeRec
  }

  calculateType () {
    function initialNodeCount (automata) {
      var count = 0;
      for (var record of automata._nodeRecords) {
        if (record.type === NODE_TYPE.initial || record.type === NODE_TYPE.initFinal) {
          count++;
        }
      }
      return count;
    }
    function hasFinalNode (automata) {
      return automata._nodeRecords.findIndex(nodeRecord =>
        nodeRecord.type === NODE_TYPE.initFinal ||
        nodeRecord.type === NODE_TYPE.final
      ) !== -1
    } // End function hasFinalNode
    function isNodeRecordDeterministic (nodeRecord) {
      let transitionSet = new Set()
      for (let edge of nodeRecord.outEdges) {
        for (let char of edge.transition) {
          if (char === '' || transitionSet.has(char)) {
            return false
          } else {
            transitionSet.add(char)
          }
        }
      }
      return true
    } // End function isNodeRecordDeterministic
    if (this._nodeRecords.length === 0) {
      return AUTOMETA_TYPE.empty
    } else if (initialNodeCount(this) !== 1 || !hasFinalNode(this)) {
      return AUTOMETA_TYPE.invalid
    } else if (this._nodeRecords.every(isNodeRecordDeterministic)) {
      return AUTOMETA_TYPE.dfa
    } else {
      return AUTOMETA_TYPE.nfa
    }
  }
  _hasMoreThanOneInitialNodes () {
    return this._nodeRecords
  }
  get nodeCount () {
    return this._nodeCount
  }
  get edgeCount () {
    return this._edgeCount
  }

  // This private property return the first initial node
  // it find, dispite if the automata is valid.
  // If it cannot find a initial node record, it will return
  // undefined instead.
  get _initialNode () {
    return this._nodeRecords.find(nodeRecord =>
      nodeRecord.type === NODE_TYPE.initFinal ||
      nodeRecord.type === NODE_TYPE.initial
    )
  }
  _indexOfNodeRecord (key) {
    return this._nodeRecords.findIndex(nodeRecord => nodeRecord.key === key)
  }
  _indexOfEdge (key) {
    let nodeRecordIndex = this._indexOfNodeRecord(key.source)
    let outEdgeIndex
    if (nodeRecordIndex !== -1) {
      let nodeRecord = this._nodeRecords[nodeRecordIndex]
      outEdgeIndex = nodeRecord.outEdges.findIndex(edge => edge.key.target === key.target)
    } else {
      nodeRecordIndex = outEdgeIndex = -1
    }
    return { nodeRecordIndex, outEdgeIndex }
  }
  _validateEdgeProperies (edge, oprKind) {
    /** Check if there are unknown properties in the propObj. */
    let unknownProp = Object.keys(edge).find(prop => !_EDGE_PROPERTY_SET.has(prop))
    if (unknownProp) throw new Error(`Unknown edge's property ${unknownProp}`)
    if (oprKind === 'update' && edge.key) throw new Error('Cannot update edge\'s key.')
    if (edge.transition) {
      for (let entry of edge.transition) {
        if (typeof entry !== 'string') {
          throw new Error(`Invalid edge's transition ${entry}, which should be a string`)
        } else if (entry !== '' && entry.length !== 1) {
          throw new Error(`Invalid edge's transiiton ${entry}, whose length should be 1.`)
        }
      }
    }
  }
  _validateNodeProperties (node, oprKind) {
    let unknownProp = Object.keys(node).find(prop => !_NODE_PROPERTY_SET.has(prop))
    if (unknownProp) throw new Error(`Unknown node's property ${unknownProp}`)
    if (oprKind === 'update' && node.key) throw new Error('Cannot update node\'s key')
  }
}