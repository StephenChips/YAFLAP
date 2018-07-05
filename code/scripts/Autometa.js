"use strict";
/* STRUCTURE OF AUTOMETA
AUTOMETA = [{
  key: "node1",
  outEdges: [...],
  type: INITIAL,
}, {
  key: "node2",
  outEdges: [...],
  type: NORMAL,
},..., {
  key: "nodeN",
  outEdges: [...],
  type: FINAL,
}]

Each NODE has a UNIQUE NAME. the STRUCTURE of each EDGE shows below:
{ key: { source: ..., target: ...}, transition: [...]}.
The transition of a edge is a set of elements that either char or empty string.
The empty string represent epsilon transition.
e.g ['a', 'c', '$', '']
When matching, if given string satisfied characters in the list, the transition will
apply and the current state will be changed.
When comparing two nodes, only when both of their source and target are same,
can we consider them equals, besides, the transition doesnot effects the result of comparing.
*/

/*
The mutable object below records changes the autometa has performed, providing
functionalityof undo and redo. When a action completed, and generate a new
autometa, it will be added intothis object.
*/

define(['lib/ramda/ramda'], function (R)  {
  const nodeType = {
    NORMAL: 0,
    INITIAL: 1,
    FINAL: 2,
    INIT_FINAL: 3 /* I node that is both final and initial */
  };

/* Except empty autometa, if a autometa is valid (either nfa or dfa),
 * it must at least has a final node and a unique initial node. The number of
 * normal node (neither initial nor final) is unlimited.
 * If a autometa is a DFA, accepting a character will cause the autometa
 * transmiting to another UNIQUE node (or state). Otherwise, if there are multiple
 * eligible nodes, it shoulb be a NFA.
 * Every autometa implicitly has a fail node, that when none of character match
 * transition, it will be trapped into the fail node. Once the autometa transmits
 * into the fail node, there are not any character can help it escaping this node.
 * */

  const autometaType = {
    DFA: 0,
    NFA: 1,
    INVALID: 2,
    EMPTY: 3, /* autometa with zero edge and node. */
  };

  const matchResult = {
    OK: 0,
    FAILED: 1,
    UNKNOWN: 2
  };

  function Node(key, type) {
    this.key = key;
    this.type = type;
  };

  function Edge(source, target, transition) {
    this.key = {
      'source': source,
      'target': target
    },
    this.transition = transition
  };

  const _nodeAttrs = Object.keys(new Node());
  const _edgeAttrs = Object.keys(new Edge());
  const _nodeRecordAttrs = Object.keys(new NodeRecord());
  function NodeRecord(key, type, outEdges) {
    this.key = key;
    this.type = type;
    this.outEdges = outEdges;
  };
  NodeRecord.fromNode = function (node, outEdges) {
    return new NodeRecord(node.key, node.type, outEdges ? outEdges : []);
  };
  NodeRecord.prototype.toNode = function () {
    return new Node(this.key, this.type);
  };

  /* Test if two node equal by comparing their keys */
  const nodeEquals = (thatNode, thisNode) => R.eqProps('key', thatNode, thisNode);
  /* Test if two edge equal by comparing their keys */
  const edgeEquals = (thatEdge, thisEdge) =>
       R.eqProps('source', thatEdge.key, thisEdge.key)
    && R.eqProps('target', thatEdge.key, thisEdge.key);

  /**
  * add edge to autometa.
  * @param {object} autometa object of autometa
  * @param {object} newEdge  new edge, with properties source, target and transition
  * @return {object} a new autometa
  * @exception if edge exists, throw string 'Edge exists'.
  * @sig object -> object -> object | Error
  */
  const addEdge = (edge, autometa) => {
    if (hasEdge(edge.key, autometa)) {
      throw new Error('Edge exists');
    } else {
      return R.map(R.when(
        node => R.equals(node.key, edge.key.source),
        node => new NodeRecord(node.key, node.type, R.append(edge, node.outEdges)) // cannot create by assoc.
      ), autometa);
    }
  };

  /**
  * add node to autometa
  * @param {object} autometa [description]
  * @param {obejct} key  [description]
  * @return {object}
  * @exception if node exists, throw Error with string 'Edge exists'
  * @sig object -> object -> object | null
  */

  const addNode = (node, autometa) => {
    if (hasNode(node, autometa)) {
      throw new Error('Node exists.');
    }
    return R.append(NodeRecord.fromNode(node), autometa);
  };

  /**
  * Change a edge's properties
  * @param  {object} autometa  the autometa
  * @param  {object} key       the source and target of a edge
  * @param  {object} newAttr   new value of edge's attributes
  * @return {object}           A new autometa
  * @sig object -> object -> object -> object | error
  * @exception if either source or target does not exist, throw Error with msg 'No such node.'
  * @exception if no edge matches given key, throw Error with msg 'No such edge.'
  * @exception if 'newAttr' has attribute source or target, throw Error with msg 'Cannot change primary key.'
  * @note
  * The attributes ource and target are the primary key of a edge, so it cannot be changed once it is
  * inserted into the autometa. Before changing a edge, you should specify its
  * source and target by passing it to the argument 'key', so that the function know
  * what to find. MULTIPLE NODE AT A TIME IS NOT SUPPORTED YET. The
  * argument newAttr specifies which attributes will be change. It has following sturcture:
  * {
  *   attr1: <new value>,
  *   attr2: <new value>
  * }
  * @example
  */

  /* If any attribute does not in the attribute list, return false. */
  const hasUnknownAttribute = elAttrList => elObject => !R.all(R.contains(R.__, elAttrList), R.keys(elObject));

  const hasUnknownEdgeAttribute = hasUnknownAttribute(_edgeAttrs);
  const hasUnknownNodeAttribute = hasUnknownAttribute(_nodeAttrs);

// FIXME: Add uniq condition
  const changeEdge = (attrs, autometa) => {

    const updateEdge = edge => {
      if (attrs.key.target !== edge.key.target) {
        return edge;
      }
      let newEdge = new Edge();
      if (attrs.transition) {
        attrs.transition = R.uniq(R.filter(R.is(String), attrs.transition));
      }
      _edgeAttrs.forEach(function (key) {
        newEdge[key] = attrs.hasOwnProperty(key) ? attrs[key] : edge[key];
      });
      return newEdge;
    };
    const updateOutEdges = node => {
      if (node.key === attrs.key.source) {
        return new NodeRecord(node.key, node.type, R.map(updateEdge, node.outEdges));
      } else {
        return node;
      }
    }

    if (attrs.key === undefined) {
      throw new Error('Require edge\'s source and target.');
    } else if (hasUnknownEdgeAttribute(attrs)) {
      throw new Error('attribute unknown.');
    } else if (!hasEdge(attrs.key, autometa)) {
      throw new Error('No such edge');
    } else {
      return R.map(updateOutEdges, autometa);
    }
  };

  /**
  * @param  {object} autometa the autometa
  * @param  {string} key the key of a node
  * @param  {object} newAttr new value of node's attributes
  * @return {object} a new autometa
  * @exception if none of node matches given key, throw exception.
  * @exception if 'attrs' has unknown node attributes, throw exception.
  * @exception if key does not specified, throw exception.
  * @sig (object , Autometa) -> Autometa
  *
  * The attributes key is the primary key of a node, so it cannot be changed  it is
  * inserted into the autometa. Before changing a node, you should specify its
  * key by passing it to the argument 'key', so that the function know
  * what to find. CHANGING MULTIPLE NODE AT A TIME IS NOT SUPPORTED YET.
  */

  const changeNode = (attrs, autometa) => {
    const updateWhenNodeEquals = node => {
      let newNodeRecord = new NodeRecord();
      if (!nodeEquals(attrs, node)) {
        /* Because attrs has key attribute, and nodeEquals compares two object's
         * key attribute, so it works here. */
        return node;
      }
      _nodeRecordAttrs.forEach(key => {
        newNodeRecord[key] = attrs.hasOwnProperty(key) ? attrs[key] : node[key];
      });
      return newNodeRecord;
    };

    if (attrs.key === undefined) {
      throw new Error('Require node\'s key.');
    } else if (!hasNode(attrs, autometa)) {
      throw new Error('No such node.');
    } else if (hasUnknownNodeAttribute(attrs)) {
      throw new Error('Unknown node attributes.');
    } else {
      return R.map(updateWhenNodeEquals, autometa);
    }
  };
  /**
  * Find edges that match key
  * @param  {object} autometa the autometa
  * @param  {object} key the attribute to filter edges
  * @return {list}          list of edges
  * // TODO: implement stream instead of list
  * @sig object -> object -> object list | object
  * @node
  * If key equals string 'all', it will return all edges.
  * If only specify source, it will return all outgoing edges from that source.
  * If only specify target, it will return all incoming edges to that target.
  * If specify both, it will return a edge object rather than a list.
  * Otherwise return undefined.
  */

  const findEdge = (key, autometa) => {
    const byEdgeTarget = edge => edge.key.target === key.target;

    const findAllEdges = autometa => R.flatten(R.map(node => node.outEdges, autometa));
    const findEdgesBySource = (key, autometa) => {
      const ret = getNodeRecord(key.source, autometa);
      return ret ? ret.outEdges : undefined;
    }
    const findEdgeByKey = (key, autometa) => {
      const edges = findEdgesBySource(key, autometa);
      return edges ? R.find(byEdgeTarget, edges) : undefined;
    };
    const findEdgesByTarget = (key, autometa) => {
      const ret = R.map(node => R.filter(byEdgeTarget, node.outEdges), autometa);
      return R.flatten(ret);
    }

    let result;
    if (!key) {
      result = findAllEdges(autometa);
    } else if (key.source && key.target) {
      result = findEdgeByKey(key, autometa);
    } else if (key.source) {
      result = findEdgesBySource(key, autometa);
    } else if (key.target) {
      result = findEdgesByTarget(key, autometa);
    } else {
      return undefined;
    }

    if (result && result.length === 1) {
      result = result[0];
    }
    return result;
  };

  const getNodeRecord = R.curry((key, autometa) => R.find(R.propEq('key', key), autometa));
  const findNode = (key, autometa) => {
    if (!key) {
      return R.map(nodeRecord => nodeRecord.toNode(), autometa);
    } else {
      const nodeRecord = getNodeRecord(key, autometa);
      return nodeRecord ? nodeRecord.toNode() : undefined;
    }
  };

  // TODO: implement stream instead of list
  /**
  * Remove a edge
  * @param  {object} autometa  the autometa
  * @param  {object} key       the source and target of a edge
  * @return {object}           A new autometa
  * @sig object -> object -> object | error
  * @exception if no edge matches given key, throw Error with msg 'No such edge.'
  * @note
  * The attributes ource and target are the primary key of a edge, so it cannot be changed once it is
  * inserted into the autometa. Before remvoing a edge, you should specify its
  * source and target by passing it to the argument 'key', so that the function know
  * what to find. REMOVING MULTIPLE EDGE AT A TIME IS NOT SUPPORTED YET. The
  * argument newAttr specifies which attributes will be change. It has following sturcture:
  * {
  *   attr1: <new value>,
  *   attr2: <new value>
  * }
  */
  const removeEdge = (key, autometa) => {
    // Filter edge whose 'target' does not equals key's 'target'.
    const filterEdgeByTarget = R.reject(edge => edge.key.target === key.target);
    if (!hasEdge(key, autometa)) {
      throw new Error('No such edge.');
    } else {
      return R.map(R.when(
        node => R.equals(key.source, node.key),
        node => {
          const newOutEdges = filterEdgeByTarget(node.outEdges);
          return new NodeRecord(node.key, node.type, newOutEdges);
      }), autometa);
    }
  };

  /**
  * Remove a node
  * @param  {object} autometa  the autometa
  * @param  {string} key       the key of the node
  * @return {object}           A new autometa
  * @sig object -> object -> object | error
  * @exception if no node matches given key, throw Error with msg 'No such node.'
  * @note
  * The attributes key are the primary key of a node, so it cannot be changed once it is
  * inserted into the autometa. Before remvoing a node, you should specify its
  * source and target by passing it to the argument 'key', so that the function know
  * what to find. REMOVING MULTIPLE EDGE AT A TIME IS NOT SUPPORTED YET.
  * {
  *   attr1: <new value>,
  *   attr2: <new value>
  * }
  * @example
  */
  const removeNode = (key, autometa) => {
    if (!hasNode(key, autometa)) {
      throw new Error('No such node');
    } else {
      return R.reduce((acc, node) => {
        if (node.key === key) {
          return acc;
        } else {
          // NOTE: newOutEdges contains every nodes in the old list except those target equals the one of key.
          const newOutEdges = R.reject(edge => edge.key.target === key, node.outEdges);
          return new NodeRecord(node.key, node.type, newOutEdges);
        }
      }, [], autometa);
    }
  };


  /**
  * Check if autometa has given edge
  * @param  {Object}  autometa the autometa
  * @param  {String}  key  key of the edge
  * @return {Boolean}      return true if has that edge
  */
  const hasEdge = (key, autometa) => {
    const node = getNodeRecord(key.source, autometa);
    if (node) {
      return R.any(edge => edge.key.target === key.target, node.outEdges);
    } else {
      return false;
    }
  };
  /**
  * Check if autometa has given node
  * @param  {Object}  autometa the autometa
  * @param  {String}  key  key of the edge
  * @return {Boolean}      return true if has that node
  */
  const hasNode = (key, autometa) => {
    let _key;
    if (R.type(key) === "Object" && key.key) {
      _key = key.key;
    } else if (R.type(key) === "String") {
      _key = key;
    } else {
      return undefined;
    }

    return R.any(R.propEq('key', _key), autometa);
  };

  const getTransitionCharSet = R.pipe(
     R.prop('outEdges'),
     R.map(R.prop('transition')),
     R.flatten,
     R.uniq
  );

  const getDestinations = (char, nodeRecord) => {
    let eligibleEdges = R.filter(edge => R.contains(char, edge.transition), nodeRecord.outEdges);
    return R.map(R.prop('target'), eligibleEdges);
  };


  const isNodeRecordDeterministic = nodeRecord => {
    const solelyOneTargetEdge = char => getDestinations(char, nodeRecord).length === 1;
    const transCharSet = getTransitionCharSet(nodeRecord);
    return !R.contains('', transCharSet) && R.all(solelyOneTargetEdge, transCharSet);
  };

  const isDFA = R.all(isNodeRecordDeterministic);

  const isValidAutometa = autometa => {
    const typeIDList = R.values(autometaType);
    const numberOfEachType = R.reduce((numberOf, currentNodeRecord) => {
      let currentNumber = numberOf[currentNodeRecord.type];
      let newNumberOf = R.assoc(currentNodeRecord.type, currentNumber + 1, numberOf);
      return newNumberOf;
    }, R.repeat(0, typeIDList.length), autometa);
    const hasUniqueInitialNode =
      (numberOfEachType[nodeType.INITIAL] === 1 && numberOfEachType[nodeType.INIT_FINAL] === 0) ||
      (numberOfEachType[nodeType.INITIAL] === 0 && numberOfEachType[nodeType.INIT_FINAL] === 1);
    const hasFinalNode = numberOfEachType[nodeType.FINAL] > 0 || numberOfEachType[nodeType.INIT_FINAL] > 0;

    return hasUniqueInitialNode && hasFinalNode;
  };

  const findInitialNode = R.find(node => node.type === nodeType.INITIAL || node.type === nodeType.INIT_FINAL);
  const getAutometaType = autometa => {
    if (isValidAutometa(autometa)) {
      return isDFA(autometa) ? autometaType.DFA : autometaType.NFA;
    } else {
      return autometaType.INVALID;
    }
  }

  const epsilonClousure = (node, autometa) => {
    let visited = {};
    let nodeSet = [node];
    let result = [];
    while (!R.isEmpty(nodeSet)) {
      let currentNode = nodeSet.pop();
      result.push(currentNode);
      for (var edge of currentNode.outEdges) {
        if (!visited[edge.key.target]) {
          visited[edge.key.target] = true;
          if (R.contains('', edge.transition)) {
            nodeSet.push(getNodeRecord(edge.key.target, autometa));
          }
        }
      }
    }
    return result;
  }
  const matchWholeString = R.curry((string, autometa) => {
    const execute = (string, autometa, currentNode, path) => {
      if (R.contains(currentNode.key, path)) {
        return false;
      }
      if (R.isEmpty(string)) {
        let finalNodes = epsilonClousure(currentNode, autometa);
        return R.any(node => node.type === nodeType.FINAL || node.type === nodeType.INIT_FINAL, finalNodes)
      } else {
        let isMatched = false;
        for (var edge of currentNode.outEdges) {
          for (var char of edge.transition) {
            if (char === '') {
              isMatched = execute(
                string,
                autometa,
                getNodeRecord(edge.key.target, autometa),
                R.append(currentNode.key, path)
              );
            } else if (char === string[0]){
              isMatched = execute(
                string.slice(1),
                autometa,
                getNodeRecord(edge.key.target, autometa),
                []
              );
            } else {
              isMatched = false;
            }
            if (isMatched) {
              return true;
            }
          }
        }
        return false;
      }
    }
    if (isValidAutometa(autometa)) {
      let result = execute(string, autometa, findInitialNode(autometa), []);
      return result ? matchResult.OK : matchResult.FAILED;
    } else {
      return matchResult.UNKNOWN;
    }
  });

  var autometa = {
    _auto: [],
    nodeEquals: nodeEquals,
    edgeEquals: edgeEquals,
    nodeType: nodeType,
    autometaType: autometaType,
    matchResult: matchResult,
    Node: Node,
    Edge: Edge,
    NodeRecord: NodeRecord,
  };

  autometa.hasNode = function(node) { return hasNode(node, _auto); },
  autometa.hasEdge = function(edge) { return hasEdge(edge, _auto); },
  autometa.addNode = function(node) { this._auto = addNode(node, _auto); },
  autometa.addEdge = function(edge) { this._auto = addEdge(edge, _auto); },
  autometa.changeNode = function(node) { this._auto = changeNode(node, _auto); },
  autometa.changeEdge = function(edge) { this._auto = changeEdge(edge, _auto); },
  autometa.removeNode = function(node) { this._auto = removeNode(node, _auto); },
  autometa.removeEdge = function(edge) { this._auto = removeEdge(edge, _auto); },
  autometa.findNode = function (key) { return findNode(key, _auto); },
  autometa.findEdge = function (key) { return findEdge(key, _auto); },
  autometa.matchWholeString = function (string) { return matchWholeString(string, _auto); },
  autometa.getAutometaType = function () { return getAutometaType(_auto); }
  return { autometa: autometa };
});
