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

const isNodeEquals = (thisNode, thatNode) =>
thisNode.name === thatNode.name
;

const isEdgeEquals = (thisEdge, thatEdge) =>
thisEdge.source === thatEdge.source &&
thisEdge.target === thatEdge.target
;

/* create new Object with outEdges property */
const wrapNode = (node) =>
Object.assign(node, { outEdges: [] });

/**
* add edge to autometa.
* @param {object} autometa object of autometa
* @param {object} newEdge  new edge, with properties source, target and transition
* @return {object} a new autometa
* @exception if edge exists, throw string 'Edge exists'.
* @sig object -> object -> object | Error
*/
const addEdge = (autometa, edge) => {
  if (hasEdge(autometa, edge)) {
    throw 'Edge exists.'
  } else {
    return autometa.map(node => {
      if (node.name === newEdge.source) {
        return node;
      } else {
        return Object.assign(node, {
          outEdges: node.outEdges.concat([newEdge]);
        });
      }
    });
  }
}
/**
* add node to autometa
* @param {object} autometa [description]
* @param {obejct} key  [description]
* @return {object}
* @exception if node exists, throw Error with string 'Edge exists'
* @sig object -> object -> object | null
*/
const addNode = (autometa, node) => {
  if (hasNode(autometa, node)) {
    throw 'Node exists';
  } else {
    return autometa.concat([wrapNode(node)]);
  }
}
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
const changeEdge = (autometa, key, newAttr) => {
  if (!hasEdge(key)) {
    throw 'No such edge';
  } else if (hasUnknownEdgeAttribute(newAttr)) {
    throw 'Unknown attribute.';
  } else if (hasEdgePrimaryKey(newAttr)) {
    throw 'Cannot change edge\'s source or target';
  } else {
    return autometa.map(node => {
      if (node.name === key.source) {
        const newOutEdges = node.outEdges.map(edge => {
          if (edge.target === key.target) {
            return Object.assign(edge, newAttr);
          } else {
            return edge;
          }
        });

        return Object.assign(node, { outEdges: newOutEdges });
      });
    } else {
      return node;
    }
  })
  return autometa.map((node) => matchNode(node) ? updateNode(node) : node);
};

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
const changeNode = (autometa, key, newAttr) => {
  if (!hasNode(autometa, key)) {
    throw 'No such node.';
  } else if (hasUnknownNodeAttribute(newAttr)) {
    throw 'Unknown node attribute.';
  } else if (hasNodePrimaryKey(newAttr)) {
    throw 'Cannot change node\'s name';
  } else {
    return autometa.map((node) =>
      isNodeEquals(node, key)
      ? Object.assign(node, newAttr)
      : node
    );
  }
}
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
const findEdge = (autometa, key) => {
  /* If key's undefined, return all edges. */
  /* If key object has source attribute, we can just filter specific adjcency list. */
  /* Otherwise, map each node by filtering their adjcency list, then concatenate them together. */
  const _fEdge = (autometa, key) => {
    if (key === undefined) {
      return Array.prototype.concat.apply([], autometa.map(node => node.outEdges));
    } else if (key.source) {
      const node = autometa.find(node => node.name === key.source);
      if (key.target) {
        return node.outEdges.filter(edge => edge.target === key.target);
      } else {
        return node.outEdges;
      }
    } else if (key.target) {
      return Array.prototype.concat.apply([], autometa.map(node =>
        node.outEdges.filter(edge => edge.target === key.target)
      ));
    } else {
      return [];
    }
  }

  const result = _fEdge(autometa, key);

  /* If there is only one edge in the resuit list, return itself rather than the list. */
  return result.length === 1 ? result[0] : result;
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
const findNode = R.uncurryN(2, key => R.compose(
    R.filter(node => node.name === key),
    R.omit('outEdges')
));

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
const removeEdge = (autometa, key) => {
  if (!hasEdge(autometa, key)) {
    throw 'No such edge.';
  } else {
    return autometa.map(node =>
      if (node.name !== key.source) {
        return node;
      } else {
        return Object.assign(node, {
          outEdges: node.outEdges.filter(edge => edge.target !== key.target)
        });
      }
    );
  }
};

/**
* Remove a node
* @param  {object} autometa  the autometa
* @param  {string} key       the name of the node
* @return {object}           A new autometa
* @sig object -> object -> object | error
* @exception if either source or target does not exist, throw Error with msg 'No such node.'
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
const removeNode = (autometa, key) => {
  return autometa.reduce((acc, node) => {
    if (node.name === key.source) {
      return acc;
    } else {
      return acc.concat(Object.assign(node, {
        outEdges: node.outEdges.filter(edge => edge.target !== key)
      });
    }
  });
};

/**
* Check if autometa has given edge
* @param  {Object}  autometa the autometa
* @param  {String}  key  name of the edge
* @return {Boolean}      return true if has that edge
*/
const hasEdge = (autometa, key) => {
  let node = autometa.find(node => node.name === key.source);
  if (node === undefined) {
    return false;
  } else {
    return node.outEdges.some(edge => edge.target === key.target);
  }
};

/**
* Check if autometa has given node
* @param  {Object}  autometa the autometa
* @param  {String}  key  name of the edge
* @return {Boolean}      return true if has that node
*/
const hasNode = (autometa, key) => {
  return autometa.some(node => node.name === key);
}

const match = (autometa, string) => true;
