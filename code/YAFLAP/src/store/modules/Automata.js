import { Automata } from '@/Automata.js'

var automata = new Automata()

/*
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
*/

/*
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
*/

export default {
  state: {
    nodeCount: 0,
    edgeCount: 0,
    automataType: 'empty',
    matchPair: { str: '', result: 'unknown' }
  },
  mutations: {
    updateNodeCount (state, count) {
      state.nodeCount = count
    },
    updateEdgeCount (state, count) {
      state.edgeCount = count
    },
    updateAutomataType (state, type) {
      state.automataType = type
    },
    updateMatchString (state, str) {
      state.matchPair.str = str
    },
    updateMatchResult (state, result) {
      state.matchPair.result = result
    }
  },
  actions: {
    matchString ({ commit }, str) {
      setTimeout(() => {
        commit('updateMatchString', str)
        commit('updateMatchResult', automata.matchWholeString(str))
      }, 0)
    },
    addNode ({ commit, state }, node) {
      setTimeout(() => {
        automata.insertNode(node)
        commit('updateNodeCount', state.nodeCount + 1)
        commit('updateAutomataType', automata.calculateType())
      }, 0)
    },
    removeNode ({ commit, state }, key) {
      setTimeout(() => {
        automata.deleteNode(key)
        commit('updateNodeCount', state.nodeCount - 1)
        commit('updateEdgeCount', automata.edgeCount)
        commit('updateAutomataType', automata.calculateType())
      }, 0)
    },
    addEdge ({ commit, state }, edge) {
      setTimeout(() => {
        automata.insertEdge(edge)
        commit('updateEdgeCount', state.edgeCount + 1)
        commit('updateAutomataType', automata.calculateType())
      }, 0)
    },
    removeEdge ({ commit, state }, key) {
      setTimeout(() => {
        automata.deleteEdge(key)
        commit('updateEdgeCount', state.edgeCount - 1)
        commit('updateAutomataType', automata.calculateType())
      }, 0)
    },
    setEdgeTransition ({ commit }, edge) {
      setTimeout(() => {
        automata.updateEdge(edge.key, {
          transition: edge.transition
        })
        commit('updateAutomataType', automata.calculateType())
      }, 0)
    },
    setNodeType ({ commit }, { key, type }) {
      setTimeout(() => {
        automata.updateNode(key, { type })
        commit('updateAutomataType', automata.calculateType())
      }, 0)
    }
  }
}
