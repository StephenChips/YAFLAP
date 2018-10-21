import D3 from 'd3'
import { eCode, Exception } from '@/utils/error'

export class LinkBehavior {
  constructor () {
    this._subject = null // The target to be linked.
    this._container = null // subject's container
    this.listeners = {
      start: { fn: undefined, capture: false },
      link: { fn: undefined, capture: false },
      end: { fn: undefined, capture: false }
    }
  }
  on (name, callback, capture) {
    if (this.hasOwnProperty(name)) {
      this.listeners[name].fn = callback
      this.listeners[name].capture = capture
    }
    return this
  }
  subject (subject) {
    this._subject = subject
    return this
  }
  container (container) {
    if (!container) {
      return this._container
    } else {
      this._container = container
    }
    return this
  }
  enable () {
    var that = this
    var end = that.listeners.end
    var link = that.listeners.link
    var start = that.listeners.start

    var finishLinking = function () {
      that.event.type = 'end'
      that.event.originEvent = D3.event
      if (end.fn) end.fn(Object.assign({}, that.event))

      that.event = undefined
      that._subject.on('mousemove.link', null)
      that._subject.on('mouseup.link', null)
      that._subject.on('mouseenter.link', null)
      that._subject.on('mouseout.link', null)

      that._container.on('mousemove.link', null)
      that._container.on('mouseup.link', null)
    }
    var moveMouse = function () {
      var point = D3.mouse(that._container.node())
      that.event.type = 'link'
      that.event.point = { x: point[0], y: point[1] }
      that.event.originEvent = D3.event
      if (link.fn) link.fn(Object.assign({}, that.event))
    }
    var setTarget = function (target) {
      that.event.target = target
      that.event.targetDOM = this
    }
    var clearTarget = function () {
      that.event.target = undefined
      that.event.targetDOM = undefined
    }

    if (!this._container || this._container.size() !== 1 || !this._subject) {
      throw new Exception(eCode.CONFIG_ERROR)
    }
    this._subject.on('mousedown.link', function (node) {
      var elCoord = D3.mouse(that._container.node())

      /** Initialize linking events */
      that._subject.on('mouseenter.link', setTarget)
      that._subject.on('mouseout.link', clearTarget)
      that._subject.on('mousemove.link', moveMouse, link.capture)
      that._subject.on('mouseup.link', finishLinking, end.capture)

      that._container.on('mousemove.link', moveMouse, link.capture)
      that._container.on('mouseup.link', finishLinking, end.capture)

      that.event = new Link('start', node, node, this, this, that._container.node(), { x: elCoord[0], y: elCoord[1] }, D3.event)
      if (start.fn) start.fn(Object.assign({}, that.event))
    })
  }
  disable () {
    this._subject.on('.link', null)
    this._container.on('.link', null)
  }
}
class Link {
  constructor (type, source, target, sourceDOM, targetDOM, containerDOM, point, originEvent) {
    this.type = type
    this.source = source
    this.target = target
    this.sourceDOM = sourceDOM
    this.targetDOM = targetDOM
    this.containerDOM = containerDOM
    this.point = point
    this.originEvent = originEvent
  }
}
