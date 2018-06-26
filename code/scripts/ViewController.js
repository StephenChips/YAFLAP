"use strict";

define([], function () {
  function ViewController(desc, initFn) {
    function appendAttr(target, object, attr) {
      if (object[attr]) {
        var attributes = object[attr].constructor === Function ? object[attr]() : object[attr];
        for (var key in attributes) {
          target[key] = attributes[key];
        }
      }
    }
    this.superController = null;
    this.subController = {};
    appendAttr(this, desc, 'data');
    appendAttr(this, desc, 'components');
    appendAttr(this, desc, 'events');

    if (initFn) {
      initFn(this);
    }
  }
  ViewController.prototype.register = function (name, controller) {
    this.subController[name] = controller;
    controller.superController = this;
  };

  return {
    ViewController: ViewController
  }
});
