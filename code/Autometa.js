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
  SECCESS: "seccess",
  FAILED: "failed",
  UNKNOWN: "unknown"
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
/* Test ndoe's equality */
const isNodeEquals = (thisNode, thatNode) =>
  thisNode.name === thatNode.name;

/* Test edge's equality */
const isSourceEquals = thatEdge => R.equals(thatEdge.source);
const isTargetEquals = thatEdge => R.equals(thatEdge.target);
const isEdgeEquals = R.both(thisSourceEquals, isTargetEquals);

/* create new Object with outEdges property */
const wrapNode = R.assoc('outEdges', []);

/**
* add edge to autometa.
* @param {object} autometa object of autometa
* @param {object} newEdge  new edge, with properties source, target and transition
* @return {object} a new autometa
* @exception if edge exists, throw string 'Edge exists'.
* @sig object -> object -> object | Error
*/
const addEdge = R.uncurryN(2, edge => R.ifElse(
  hasEdge(edge),
  () => throw 'Edge exists.',
  R.map(R.when(
    node => node.name === edge.source,
    node => R.assoc('outEdges', R.append(edge, node.outEdges)))
  )));

/**
* add node to autometa
* @param {object} autometa [description]
* @param {obejct} key  [description]
* @return {object}
* @exception if node exists, throw Error with string 'Edge exists'
* @sig object -> object -> object | null
*/
const addNode = node => R.ifElse(
  hasNode(node),
  () => 'Node exists.',
  R.compose(wrapNode, R.concat)
);

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
const changeEdge = R.uncurryN(3, key => newAttr => {
  let updateEdge = R.when(
    edge => edge.target === key.target,
    R.merge(newAttr, edge));
  let updateNode = R.when(
    node => node.name === key.source,
    node => R.assoc('outEdge', R.map(updateEdge, R.prop('outEdges', node)), node);

  return R.cond([
    [() => !hasEdge(key), () => throw 'No such edge.'],
    [() => hasUnknownEdgeAttribute(newAttr), () => throw 'Unknown attribute.'],
    [() => hasEdgePrimaryKey(newAttr), () => throw 'Cannot change edge\'s source or target.'],
    [R.T, R.map(updateNode)],
  ]);
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
const changeNode = R.uncurryN(3, key => newAttr => R.cond([
  [hasNode(key), () => throw 'Node such node.'],
  [() => hasUnknownEdgeAttribute(newAttr), () => throw 'Unknown node attribute.'] ,
  [() => hasNodePrimaryKey(newAttr), () => throw 'Channot change node\'s name.'],
  [R.T, R.map(R.when(isNodeEquals(key), R.merge(newAttr)))]
]);
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

const findEdge = key => {
  const findAllEdges = R.compose(R.map(selectOutEdges), R.flatten);
  const findEdgesBySource = R.compose(R.find(isSourceEquals(key)), selectOutEdges);
  const findEdgesByKey = R.compose(_fNode, selectOutEdges, R.filter(isTargetEquals(key)));
  const findEdgesByTarget = R.compose(
    R.map(R.compose(selectOutEdges, R.filter(isTargetEquals(key)))),
    R.flatten);

  const _fEdge = R.cond([
    [R.equals("all"), findAllEdges] ,
    [R.both(R.has('source'), R.has('target')), findEdgeByKey],
    [R.has('source'), findEdgesBySource],
    [R.has('target'), findEdgesByTarget]
  ]);

  return autometa => {
    const result = _fEdge(autometa); /* result a list */
    return R.equals(result.length, 1) ? result[0] : result;
  };
}

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

const _fNode = key => find(isNodeEquals(key));
const findNode = R.uncurryN(2, key => R.compose(_fNode, R.omit('outEdges')));

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
const removeEdge = key => R.ifElse(
  R.complement(hasEdge(key)),
  () => throw 'No such edge.',
  R.map(R.when(
    R.equals(key.source)),
     R.assoc(
       'outEdges',
       R.compose(R.prop('outEdges'), R.filter(isTargetEquals(key))))));

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

const removeNode = key => {
  const _rmNode = R.reduce((acc, node) =>
    if (!isNodeEquals(key, node)) {
      const newOutEdges = R.filter(
        R.propSatisfies(target => target !== key, 'target'),
        node.outEdges);
      return R.assoc('outEdges', list, R.assoc('outEdges', newOutEdges, node));
    } else {
      return acc;
    });

    return R.ifElse(hasNode(key), _rmNode, () => throw 'No such node');
}


/**
* Check if autometa has given edge
* @param  {Object}  autometa the autometa
* @param  {String}  key  name of the edge
* @return {Boolean}      return true if has that edge
*/
const hasEdge = R.uncurryN(2, key => R.compose(
    R.find(node => R.equals(node.name, key.source),
    R.ifElse(
      node => node === undefined,
      R.F,
      (node) => R.any(isTargetEquals(key), node.outEdges)))));
/**
* Check if autometa has given node
* @param  {Object}  autometa the autometa
* @param  {String}  key  name of the edge
* @return {Boolean}      return true if has that node
*/
const hasNode = uncurryN(2, key => R.any(node => node.name === key));

const match = (autometa, string) => true;
