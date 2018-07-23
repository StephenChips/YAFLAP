import { autometa as _auto } from '@/Autometa'
import { messageBus } from '@/utils/bus'

export var autometa = {
  _auto: _auto,
  hasEdge (key) {
    return this._auto.hasEdge(key)
  },
  hasNode (key) {
    return this._auto.hasNode(key)
  },
  insertNode (node) {
    this._auto.insertNode(node)
    messageBus.$emit('update-node-count', this._auto.nodeCount)
    messageBus.$emit('update-autometa-type', this._auto.type)
  },
  insertEdge (edge) {
    this._auto.insertEdge(edge)
    messageBus.$emit('update-edge-count', this._auto.edgeCount)
    messageBus.$emit('update-autometa-type', this._auto.type)
  },
  updateNode (node) {
    this._auto.updateNode(node)
    messageBus.$emit('update-autometa-type', this._auto.type)
  },
  updateEdge (edge) {
    this._auto.updateEdge(edge)
    messageBus.$emit('update-autometa-type', this._auto.type)
  },
  deleteNode (key) {
    this._auto.deleteNode(key)
    console.log(this._auto.nodeCount)
    messageBus.$emit('update-node-count', this._auto.nodeCount)
    messageBus.$emit('update-autometa-type', this._auto.type)
  },
  deleteEdge (key) {
    this._auto.deleteEdge(key)
    messageBus.$emit('update-node-count', this._auto.edgeCount)
    messageBus.$emit('update-autometa-type', this._auto.type)
  },
  findNode (key) {
    return this._auto.findNode(key)
  },
  findEdge (key) {
    return this._auto.findEdge(key)
  },
  matchWholeString (string) {
    return this._auto.matchWholeString(string)
  },
  get type () {
    return this._auto.type
  },
  get nodeCount () {
    return this._auto.nodeCount
  },
  get edgeCount () {
    return this._auto.edgeCount
  }
}
