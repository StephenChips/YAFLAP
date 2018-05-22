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
NumberDisplay.prototype = {
  attach: function (selector) {

  },
  detach: function () {

  },
  set label(label) {

  },
  get label(label) {

  }
}

function LabelDisplay(label) {
  this._$el = undefined;
  this.label = label;
}
LabelDisplay.prototype = {
  attach: function (selector) {

  },
  detach: function () {

  },
  set label(number) {

  },
  get label() {

  },
};
const BOARD_MODE = {
  SELECTION: 0,
  ADDITION: 1,
  REMOVAL: 2
};

const BOARD_DEFAULT = {
  height: 1000,
  width: 1000
};

function EdgeElement(data, position) {
  this.selected = false;
}
function NodeElement(data, position) {
  this.selected = false;
}

var BOARD_CONTROLLER = {
    height: BOARD_DEFAULT["height"],
    width: BOARD_DEFAULT["width"],
    /* _autometa: ATOMA, */
    _edges: [],
    _nodes: [],
    _menu: {
      background: {},
      circle: {},
      path: {}
    },
    _overlay: null,
    _board: null,
    _circle: null,
    _path: null,
    _options: null,
    _panelOptions: {
      switchToSelectionMode: null,
      switchToAdditionMode: null,
      switchToRemovalMode: null,
    }
    choose: function (elType, elProp) {
      function chooseNode(elProp) {

      }
      function chooseLink(elProp) {

      }
    },

    add: function (elType, elProp) {
      function addNode(elProp) {

      }
      function addLink(elProp) {

      }
    },

    remove: function (elType, elProp) {
      function removeNode(elProp) {

      }
      function removeLink(elProp) {

      }
    },

    update: function (elType, elProp) {
      function updateNode(elProp) {

      }
      function updateLink(elProp) {

      }
    },
    edit: function(elType, elProp) {
      function editNode(elProp) {

      },
      function editLink(elProp) {

      }
    },
    doneEdit: function() {

    },
    /**
     * Bind different events here according to given mode.
     * @param  {integer} mode A string descript board's mode, valid value: selectiton, addition, removal
     * @return {undefined}  does not return value
     */
    selectMode: function (mode) {
      switch (mode) {

          break;
        case BOARD_MODE.ADDITION:

          break;
        case BOARD_MODE.REMOVAL:

          break;
        default:
          console.error('Unknown board mode!');
          break;

      }
    },
    /**
     * Let the controller controll the view selected by the selector, binds the data, initialize board's mode and events.
     * The selector must return just one element, otherwise, this method takes no effects and return false instead.
     * @param  {string} selector valid d3 selector
     * @return {boolean}         if seccess, return true, otherwise, return false;
     */
    attach: function(selector) {

    },
    /**
     * Make this view controller no longer effects the view
     * @param {object} options it has property 'depth', the controller will remove all element before detaching.
     * @return {undefined}
     */
    detach: function(options) {

    }
  };
}());


const MAIN_PANEL = {
   _$el: null,
   _$tags: null,
   _activeTagIndex: 0,
   _components: {},
   attach: function (selector) {

   },
   detach: function() {

   }
};

module.exports = BOARD;
module.exports = MAIN_PANEL;
module.exports = LabelDisplay;
module.exports = NumberDisplay;
