import D3 from 'd3'
import { eCode, Exception } from '@/utils/error'

export class LinkBehavior {
  constructor () {
    this._selection = null // D3 selection
    this._container = null // selection's container
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
  container (container) {
    if (!container) {
      return this._container
    } else if (container instanceof HTMLElement) {
      this._container = container
    }
    return this
  }
  enable (selection) {
    var that = this
    var end = that.listeners.end
    var link = that.listeners.link
    var start = that.listeners.start

    function finishLinking () {
      that.event.type = 'end'
      if (end.fn) end.fn(new Link(that.event))

      that.event = undefined
      that._selection.on('mousemove.link', null)
      that._selection.on('mouseup.link', null)
      that._selection.on('mouseenter.link', null)
      that._selection.on('mouseout.link', null)

      that._container.on('mousemove.link', null)
      that._container.on('mouseup.link', null)
    }
    function moveMouse () {
      var point = D3.mouse(that.getContainer(this))
      that.event.type = 'link'
      that.event.point = { x: point[0], y: point[1] }
      if (link.fn) link.fn(new Link(that.event))
    }
    function setTargetData (targetData) {
      that.evnet.target = targetData
    }
    function clearTargetData () {
      that.evnet.target = undefined
    }

    if (!this._container || !(this._container instanceof Element)) {
      throw new Exception(new Exception(eCode.CONFIG_ERROR))
    }
    this._selection = selection
    this._selection.on('mousedown.link', function (datum) {
      var elCoord = D3.mouse(this)

      /** Initialize linking events */
      that._selection.on('mouseenter.link', setTargetData)
      that._selection.on('mouseout.link', clearTargetData)
      that._selection.on('mousemove.link', moveMouse, link.capture)
      that._selection.on('mouseup.link', finishLinking, end.capture)

      that._container.on('mousemove.link', moveMouse, link.capture)
      that._container.on('mouseup.link', finishLinking, end.capture)

      that.event = new Link('start', datum, datum, { x: elCoord[0], y: elCoord[1] })
      if (start.fn) start.fn(new Link(that.event))
    })
  }
  disable () {
    this._selection.on('.link', null)
  }
}
class Link {
  constructor (type, source, target, point) {
    if (arguments.length === 1 && arguments[0] instanceof Link) {
      /** Copy constructor */
      this.type = arguments[0].type
      this.source = arguments[0].source
      this.target = arguments[0].target
      this.point = arguments[0].point
    } else {
      this.type = type
      this.source = source
      this.target = target
      this.point = point
    }
  }
}
