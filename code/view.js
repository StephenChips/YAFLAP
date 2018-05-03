"use strict";

function NumberDisplay(number, title) {
  this._$el = undefined;
  this.number = number;
  this.title = title;
}

NumberDisplay.prototype = {
  set number(number) {

  },
  get number() {

  },
  set title(title) {

  },
  get title() {

  }
};
NumberDisplay.bind = function(selector) {

};
NumberDisplay.detach = function() {

};

function LabelDisplay(label) {
  this._$el = undefined;
  this.label = label;
}
LabelDisplay.prototype = {
  set label(number) {

  },
  get label() {

  },
};
const BOARD = (function() {
  const BOARD_MODE = {
    "SELECT": 0,
    "ADD": 1,
    "REMOVE": 2
  };
  var _height = 1000;
  var _width = 1000;
  var _links = [];
  var _nodes = [];
  var _menu = {
    background: {},
    circle: {},
    path: {}
  };

  var _root = d3.select('#board');
  var _panelOptions = d3.select('#panel').selectAll('.panelOption');
  var _circle = d3.select(root).selectAll('circle')
  var _path = d3.select(root).selectAll('circle');

  var _selected = null;
  var _events = {
    click: {
      background: function(d) {},
      circle: function(d) {},
      path: function(d) {}
    },
    contextMenu: {
      background: function(d) {},
      circle: function(d) {},
      path: function(d) {}
    },
    drag: {
      background: function(d) {},
      circle: function(d) {},
      path: function(d) {}
    },
    drop: {
      background: function(d) {},
      circle: function(d) {},
      path: function(d) {}
    }
  }.bind(this);
  var _forceLayout =
    d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(_width / 2, _height / 2))
      .force('link', d3.forceLink().links(links))
      .on('tick', updateBoard);

  function changeMode(mode) {

  }

  function choose(elType, value) {

  }
  /**

  */
  function addNode(node, position) {

  }
  function addLink(link) {

  }
  function removeNode(node) {

  }
  function removeLink(link) {

  }
  function updateLink(prop, data) {

  }

/*
# desc
Change the selected node's property
# _changeNode(prop: String, optional data: String) : undefined
## param
1.prop
  - desc: the property of node to be changed.
  - value: only {'name', 'type'}
2. data
value: node's new name or new type

## exception:
when operation's unknowned, throw OperationException('unknowned node property')
when type's unknowned, throw OperationException('unknowned node type')
when no node's selected, throw OperationException('No node\'s selected')
on seceess, return undefined
*/
  function updateNode(prop, data) {
    function _updateNodeName(name) {

    }
    function _changeNodeType(type) {

    }
  }
  function _updateBoard(d) {

  }

  return {
    set width(w)  { _width = w; },
    get width()   { return _width; },
    set height(h) { _height = h; },
    get height()  { return _height; },
    addNode: addNode,
    addLink: addLink,
    removeNode: removeNode,
    removeLink: removeLink,
    updateNode: updateNode,
    updateLink: updateLink,
    updateNode: updateNode,
  };
}());

const MAIN_PANEL = (function() {
  let _$tags = $('.panel-tag');
  let _activeTagIndex = 0;
  let components = {
    "stateDisplay": new LabelDisplay("Unknown").bind("#state-display");
    "linkCountDisplay": new NumberDisplay(0, "Edge Count").bind("#edgeCountDisplay");
    "nodeCountDisplay": new NumberDisplay(0, "Node Count").bind("#nodeCountDisplay");
  };

  _$tags.click(function() {

  });

  return {
    getComponent: function (compName) {

    },
    switchTag: function(index) {

    }
  }
}());

module.exports = BOARD;
module.exports = MAIN_PANEL;
module.exports = LabelDisplay;
module.exports = NumberDisplay;
