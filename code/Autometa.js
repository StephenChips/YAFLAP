"use strict";
/* STRUCTURE OF AUTOMETA
AUTOMETA = [{
  name: "node1",
  outEdges: [...],
  type: INITIAL,
}, {
  name: "node2",
  outEdges: [...],
  type: NORMAL,
},..., {
  name: "nodeN",
  outEdges: [...],
  type: FINAL,
}]

Each NODE has a UNIQUE NAME. the STRUCTURE of each EDGE shows below:
{ source: ..., target: ..., transition: [...]}.
The transition of a edge is a set of elements that either char or empty string.
The empty string represent epsilion transition.
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

const MATCH_RESULT = {
  SECCESS: 0,
  FAILED: 1,
  UNKNOWN: 2 2
};

const HISTORY = {
  log: [[]],
  current: 0,
  historyNumber: 1,
  capacity: 300
};

HISTORY.current = function () { return this.history[this.current]; }
HISTORY.undo = function() {
  return this.history[this.current--];
}
HISTORY.redo = function() {
  return this.history[this.current++];
}
HISTORY.push = function(autometa) {
  this.current++;
  this.history[this.current] = autometa;
}

const selectOutEdges = R.prop('outEdges');
/* Test node's equality */
const nodeEquals = R.curry((thatNode, thisNode) => R.eqProps('name', thatNode, thisNode));
/* Test edge's equality */
const edgeEquals = R.curry((thatEdge, thisEdge) =>
     R.eqProps('source', thatEdge, thisEdge)
  && R.eqProps('target', thatEdge, thisEdge));

/* create new Object with outEdges property */
const addOutEdgeList = R.assoc('outEdges', []);
const removeOutEdgeList = R.omit('outEdge');

/**
* add edge to autometa.
* @param {object} autometa object of autometa
* @param {object} newEdge  new edge, with properties source, target and transition
* @return {object} a new autometa
* @exception if edge exists, throw string 'Edge exists'.
* @sig object -> object -> object | Error
*/
const addEdge = R.curry((edge, autometa) => {
  if (hasEdge(edge)) {
    throw 'Edge exists';
  } else {
    return R.map(R.when(
      node => R.equals(node.name, edge.source),
      node => R.assoc('outEdge', R.append(edge, node.outEdges), node);
    ), autometa);
  }
});

/**
* add node to autometa
* @param {object} autometa [description]
* @param {obejct} key  [description]
* @return {object}
* @exception if node exists, throw Error with string 'Edge exists'
* @sig object -> object -> object | null
*/

const addNode = R.curry((node, autometa) => {
  if (hasNode(node, autometa)) {
    throw 'Node exists.';
  }
  return R.concat(addOutEdgeList(node), autometa);
})

/**
* Change a edge's properties
* @param  {object} autometa  the autometa
* @param  {object} key       the source and target of a edge
* @param  {object} newAttr   new value of edge's attributes
* @return {object}           A new autometa
* @sig object -> object -> object -> object | error
* @exception if either source or target does not exist, throw Error with msg 'No such node.'
* @exception if no edge matches given key, throw Error with msg 'No such edge.'
* @exception if 'newAttr' has unknown attribute, throw Error with msg 'Unknown attribute.'
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
const changeEdge = R.curry((key, newAttr, autometa) => {
  const updateEdge = R.when(
    R.propEq('target', key),
    R.merge(newAttr, edge));
  const updateNodeEdges = R.when(
    R.propEq('name', key.source),
    node => R.assoc('outEdge', R.map(updateEdge, node.outEdges), node)
  );

  if (hasUnknownEdgeAttribute(newAttr)) {
    throw 'Unknown attribute.';
  } else if (hasEdgePrimaryKey(newAttr)) {
    throw 'Cannot change edge\'s source or target.';
  } else if (!hasEdge(key)) {
    throw 'No such edge';
  } else {
    return R.map(updateNodeEdges, autometa);
  }
});

/**
* @param  {object} autometa the autometa
* @param  {string} key the name of a node
* @param  {object} newAttr new value of node's attributes
* @return {object} a new autometa
* @exception if no node matches given key, throw Error with msg 'No such node.'
* @exception if 'newAttr' has unknown attribute, throw Error with msg 'Unknown attribute.'
* @exception if 'newAttr' has attribute name, throw string 'Cannot change primary key.'
* @sig object -> string -> object -> object
* The attributes name is the primary key of a node, so it cannot be changed once it is
* inserted into the autometa. Before changing a node, you should specify its
* name by passing it to the argument 'key', so that the function know
* what to find. CHANGING MULTIPLE NODE AT A TIME IS NOT SUPPORTED YET. The
* argument newAttr specifies which attributes will be change. It has following sturcture:
* {
*   attr1: <new value>,
*   attr2: <new value>
* }
* @exception
*/

const changeNode = R.curry((key, newAttr, autometa) => {
  const updateWhenNodeEquals = R.when(nodeEquals(key), R.merge(newAttr));
  if (hasNode(key)) {
    throw 'Node such node.';
  } else if (hasUnknownNodeAttribute(newAttr)) {
    throw 'Cannot change node\'s attribute.';
  } else if (hasNodePrimaryKey(newAttr)) {
    throw 'Cannot change node\'s name.';
  } else {
    return R.map(updateWhenNodeEquals, autometa);
  }
});
/**
* Find edges that match key
* @param  {object} autometa the autometa
* @param  {object} key the attribute to filter edges
* @return {list}          list of edges
* // TODO: implement stream instead of list
* @sig object -> object -> object list | object
* @node
* If key equals undefined or null, it will return all edges.
* If only specify source, it will return all outgoing edges from that source.
* If only specify target, it will return all incoming edges to that target.
* If specify both, it will return a edge object rather than a list.
* Otherwise filter those satisfied key and put it into the result list.
*/

const findEdge = R.curry((key, autometa) => {
  const filterByEdgeTarget = R.filter(R.eqProps('target', key));

  const findAllEdges = R.pipe(R.map(selectOutEdges), R.flatten);
  const findEdgesBySource = R.pipe(getNode(key.source), selectOutEdges); // NOTE: REFERENCE TO A MUTABLE ARRAY
  const findEdgesByKey = R.pipe(findEdgesBySource, R.find(R.eqProps('target', key)));
  const findEdgesByTarget = R.pipe(
    R.map(R.pipe(selectOutEdges, filterByEdgeTarget)),
    R.flatten);

  let result;
  if (R.equals("all", key)) {
    result = findAllEdges(autometa);
  } else if (R.has('source', key) && R.has('target', key)) {
    result = findEdgeByKey(autometa);
  } else if (R.has('source', key)) {
    result = findEdgeBySource(autometa);
  } else if (R.has('target', key)) {
    result = findEdgesByTarget(autometa);
  } else {
    return undefined;
  }

  return result.length === 1 ? result[0] : result;
});

// TODO: implement stream instead of list
/**
* Find nodes that match key
* @param  {object} autometa the autometa
* @param  {object} key the attributeject list
*
@node *
If key equals undefined or n
* @return {list}          list of nodes
* @exception If key contains any unknown attributes, throw Error with msg 'Unknown attribute'
* @sig object -> object -> object list
* @node
* If key equals undefined or null, it will return all nodes.
* Otherwise filter those satisfied key and put it into the result list.
*/
const getNode = R.curry((key, autometa) => R.find(nodeEquals(key), autometa));
const findNode = R.curry((key, autometa) => removeOutEdgeList(getNode(key, autometa)));

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
* what to find. REMOVING EULTIPLE EDGE AT A TIME IS NOT SUPPORTED YET. The
* argument newAttr specifies which attributes will be change. It has following sturcture:
* {
*   attr1: <new value>,
*   attr2: <new value>
* }
*/
const removeEdge = R.curry((key, autometa) => {
  // Filter edge whose 'target' does not equals key's 'target'.
  const filterEdge = R.filter(R.complement(R.eqProps('target', key)));
  if (!hasEdge(key)) {
    throw 'No such edge.';
  } else {
    return R.map(R.when(
      node => R.equals(key.source, node.name),
      node => R.assoc('outEdges', filterEdge(node.outEdges), node))
    , autometa);
  }
});

/**
* Remove a node
* @param  {object} autometa  the autometa
* @param  {string} key       the name of the node
* @return {object}           A new autometa
* @sig object -> object -> object | error
* @exception if no node matches given key, throw Error with msg 'No such node.'
* @note
* The attributes name are the primary key of a node, so it cannot be changed once it is
* inserted into the autometa. Before remvoing a node, you should specify its
* source and target by passing it to the argument 'key', so that the function know
* what to find. REMOVING MULTIPLE EDGE AT A TIME IS NOT SUPPORTED YET.
* {
*   attr1: <new value>,
*   attr2: <new value>
* }
* @example
*/
const removeNode = R.curry((key, autometa) => {
  if (!hasNode(key, autometa)) {
    throw 'No such node';
  } else {
    return R.reduce((acc, node) => {
      if (R.equals(node.name, key.source)) {
        return acc;
      } else {
        // NOTE: newOutEdges contains every nodes in the old list except those target equals the one of key.
        const newOutEdges = R.filter(R.complement(R.eqProps('target', key), node.outEdges));
        return R.assoc('outEdges', newOutEdges, node);
      }
    }, autometa);
  }
});


/**
* Check if autometa has given edge
* @param  {Object}  autometa the autometa
* @param  {String}  key  name of the edge
* @return {Boolean}      return true if has that edge
*/
const hasEdge = R.curry((key, autometa) => {
  const node = getNode(key.source);
  if (node === undefined) {
    return R.any(R.eqProps('target', key), node.outEdges);
  } else {
    return false;
  }
});
/**
* Check if autometa has given node
* @param  {Object}  autometa the autometa
* @param  {String}  key  name of the edge
* @return {Boolean}      return true if has that node
*/
const hasNode = R.curry((key, autometa) => R.any(R.propEq('name', key), autometa));

const match = (autometa, string) => true;
