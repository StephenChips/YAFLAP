/** 
 * Node {
 *   name: string
 *   
 * }
 */
define([
    'require',
    './lib/d3js/d3js'
], function (require, D3) {
    'use strict';

    /** 'this' pointer refers to the view. */
    function Board(selector) {

        /** # EVENT
         *  - rightClick
         *  - keyPress(key)
         */
        this.board = D3.select(selector);

        /** # EVENT:
         *  ## Node
         *  - rightClick 
         *  - leftClick
         *  - doubleClick
         *  - beforeDrag 
         *  - afterDrag
         *  - beforeLink
         *  - afterLink
         * ## Links
         *  - rightClick
         *  - leftClick
         *  - doubleClick
         */
        this.graph = new Graph(this);

        /** Event: beforeShow, afterShow, beforeHide, afterHide */
        this.auxLink = board.select('.auxLink').enter().append('link');
        this.contextMenu = {};
        this.boardElView = [];
        this.dragEventHandler = D3.drag();
        this.events = {};

        /** Notice that some event cannot be set, since it is used for the internal actions,
         *  like opening a context menu, dragging, selecting, hovering e.g. */
        this.validEvent = {
            node: ['beforeDrag', 'afterDrag', 'beforeLink', 'afterLink'],
            editField: ['afterShow', 'beforeShow', 'afterHide', 'beforeHide'],
            auxLink: ['afterShow', 'beforeShow', 'afterHide', 'beforeHide']
        };

        this.hideContextMenu();
    };
    Board.prototype.contextMenu = function (which, defObj) {
        this.contextMenu[which] = defObj;
    };
    Board.prototype.setMode = function (mode) {
        /** Some invariable events or attributes */
        this._setGeneralAttrAndEvent();
        switch (mode) {
            case 'add':
                this._setToAddMode();
                break;
            case 'edit':
                this._setToEditMode();
                break;
            case 'remove':
                this._setToDeleteMode();
                break;
            default:
                break;
        }
    };
    Board.prototype._setGeneralAttrAndEvent = function () {
        Graph.prototype._setGeneralAttrAndEvent();
    }
    Board.prototype._setToAddMode = function () {
        this.graph.setAddMode();
    };
    Board.prototype._setToEditMode = function () {
        this.graph.setEditMode();
    };
    Board.prototype._setToDeleteMode = function () {
        this.graph.setDeleteMode();
    };
    Board.prototype.showContextMenu = function (which) {
        let menu = this.contextMenu[which];
        menu.classed('hide', false);
    };
    Board.prototype.setContextMenu = function (which, position) {
        let menu = this.contextMenu[which];
        menu.style('top', position.x);
        menu.style('left', position.y);
    };
    Board.prototype.hideContextMenu = function (which) {
        let menu = this.contextMenu[which];
        menu.classed('hide', true);
    };
    Board.prototype.showEditField = function () {
        if (this.events.editField.beforeShow) {
            this.events.editField.beforeShow(this);
        }
        this.editField.classed('hide', false);
        if (this.events.editField.afterShow) {
            this.events.editField.afterShow(this);
        }
    };
    Board.prototype.setEditField = function (position) {
        // FIXME
        this.editField.style('top', position.x);
        this.editField.style('left', position.y);
    };
    Board.prototype.hideEditField = function () {
        if (this.events.editField.beforeHide) {
            this.events.editField.beforeHide(this);
        }
        this.editField.classed('hide', true);
        if (this.events.editField.afterHide) {
            this.events.editField.afterHide(this);
        }
    };
    Board.prototype.showAuxLink = function () {
        let beforeShow = this.events.auxLink['beforeShow'];
        let afterShow = this.events.auxLink['afterShow'];

        if (beforeHide) {
            beforeShow(this, d3.event);
        }
        this.auxLink.classed('hide', false);
        if (afterShow) {
            afterShow(this, d3.event);
        }
    };
    Board.prototype.setAuxLink = function (linkAttrs) {
        if (linkAttrs.source) {
            this.auxLink
              .attr('x1', linkAttrs.source.x)
              .attr('y1', linkAttrs.source.y)
        }
        if (linkAttrs.target) {
            this.auxLink
              .attr('x2', linkAttrs.target.x)
              .attr('y2', linkAttrs.target.y);
        }
    }
    Board.prototype.hideAuxLink = function () {
        let beforeHide = this.events.auxLink['beforeHide'];
        let afterHide = this.events.auxLink['afterHide'];

        if (beforeHide) {
            beforeHide(this, d3.event);
        }
        this.auxLink.classed('hide', true);
        if (afterHide) {
            afterHide(this, d3.event);
        }
    };
    Board.prototype.render = function (data) {
        this.graph.render(R.pick(['circle', 'edge'], data));
    };
    /**
     * @param {string} elName 'circle' | 'edge'
     */
    Board.prototype.hovered = function (elName) {
        return this.graph.hovered(elName);
    };
    /**
     * @param {string} elName 'circle' | 'edge'
     */
    Board.prototype.selected = function (elName) {
        return this.graph.selected(elName);
    };
    /**
     * 
     * @param {string} whatEvent The event name.
     * @param {string} whichElement The element name, one of 'node', 'edge' or 'background'.
     * @param {function} willDoFunc The event callback function.
     */
    Board.prototype.on = function (whatEvent, whichElement, willDoFunc) {
        let validEventSet = this.validEvent[whichElement];
        if (validEventSet && validEventSet.includes(whatEvent)) {
            switch (whichElement) {
            case 'node': case 'edge':
                this.graph.on(whatEvent, whichElement, willDoFunc);                
                break;
            case 'board':
                this.events[whatEvent] = willDoFunc;
                break;
            }
        }
    };
    /** the nodes and edges on the board */
    function Graph(board) {
        this.board = board;
        this.elName = elName;
        this.nodes = this.board.selectAll('circle');
        this.edges = this.board.selectAll('line');
        this._canDrag = false;
        this._canClick = false;
        this.events = {};
        this.validEvent = {
            node: ['rightClick', 'leftClick', 'doubleClick', 'beforeDrag', 'afterDrag', 'beforeLink', 'afterLink'],
            link: ['rightClick', 'leftClick', 'doubleClick']
        };
        this.selectedNode = null;
        this.selectedEdge = null;
    };

    Graph.position._setDragNode = function (events) {
        let view = this;
        let started = null, dragged = null, ended = null;
        let _wrapper = function (fn) {
            let d3Callback = function (datum, index) {
                /** Here 'this' refers to the selected element (dom). */
                fn.call(view, datum, index, this);
            }
            return d3Callback;
        };
        if (events) {
            started = _wrapper(events['start']);
            dragged = _wrapper(events['drag']);
            ended = _wrapper(events['end']);
        }
        this.nodes.call(d3.drag()
          .on('start', started)
          .on('drag', dragged)
          .on('end', ended));
    };
    Graph.prototype._dragNodeStarted = function (datum, index, element) {
        D3.select(element).classed('dragging', true);
        this.events.node.beforeDrag(datum, index, this.board);
    };
    Graph.prototype._draggingNode = function (datum, index, element) {
        datum.x = D3.event.x;
        datum.y = D3.event.y;
        D3.select('.dragging')
          .attr('cx', datum.x)
          .attr('cy', datum.y);
        this._updateAdjacentEdges(datum);
    };
    Graph.prototype._dragNodeEnded = function (datum, index, element) {
        D3.select(element).classed('dragging', false);
        this.events.node.afterDrag(datum, index, this.board);
    };
    Graph.prototype._updateAdjacentEdges = function (datum) {
        links.filter(link => link.source === datum.key)
          .attr('x1', datum.x)
          .attr('y1', datum.y);
        links.filter(link => link.target === datum.key)
          .attr('x2', datum.x)
          .attr('y2', datum.y);
    }
    Graph.prototype._linkNodeStarted = function (datum, index, element) {
        this.board.setAuxLink({
            source: {x: datum.x, y: datum.y},
            target: {x: datum.x, y: datum.y}
        });
        this.board.showAuxLink();
        this.events.node.beforeLink(datum, index, this.board);
    };
    Graph.prototype._linkingNode = function (datum, index, element) {
        this.board.setAuxLink({
            target: {x: datum.x, y: datum.y}
        });
    };
    Graph.prototype._linkNodeEnded = function (datum, index, element) {
        this.board.hideAuxLink();
        this.events.node.afterLink(datum, index, this.board);
    };
    Graph.prototype.on = function (whatEvent, whichElement, willDoFunc) {
        let eventSet = this.validEvent[whichElement];
        if (eventSet && eventSet.includes(whatEvent)) {
            this.events[whichElement][whatEvent] = willDoFunc;
        }
    };
    Graph.prototype.setDragMode = function (el, mode) {
        if (el === 'node') {
            if (!mode) {
                this._setDragNode(null);
            }
            switch (mode) {
                case 'drag':
                    this._setDragNode({
                        start: this._dragNodeStarted.bind(this),
                        drag: this._draggingNode.bind(this),
                        end: this._dragNodeEnded.bind(this)
                    });
                    break;
                case 'link':
                    this._setDragNode({
                        start: this._linkNodeStarted.bind(this),
                        drag: this._linkingNode.bind(this),
                        end: this._linkNodeEnded.bind(this)
                    });
                    break;
            }
        } else if (el === 'edge') {
            /** TODO: change link's arc. */
        }
    };
    Graph.prototype.hovered = function (elName) {
        switch (elName) {
            case 'node':
                return this.hoveredNode; 
            case 'edge':
                return this.hoveredEdge;
        }
    }
    Graph.prototype.selected = function (elName) {
        switch (elName) {
            case 'node':
                return this.selectedNode; 
            case 'edge':
                return this.selectedEdge;
        }
    }
    Graph.prototype.setHovered = function (elName, el) {
        switch (elName) {
            case 'node':
                this.hoveredNode = el; 
                break;
            case 'edge':
                this.hoveredEdge = el;
                break;
        }
        
    }
    Graph.prototype.setSelected = function (elName, el) {
        switch (elName) {
            case 'node':
                this.selectedNode = el; 
                break;
            case 'edge':
                this.selectedEdge = el;
                break;
        }
    }
    Graph.prototype._setGeneralAttrAndEvent = function () {
        /** Hover event */
        this.circle
          .on('mouseover', function () { D3.select(this).classed('hovered', true); })
          .on('mouseout', function () { D3.select(this).classed('hovered', false); });
    }
    Graph.prototype.render = function (data) {
        this.updateData(data);
        this.updateElement();
        this.appendElement();
        this.removeElement();
    };
    Graph.prototype.updateData = function (data) {
        this.nodes.data = data.nodes;
    }
    Graph.prototype.updateElement = function () {
        this.updateNodes(this.nodes);
    };
    Graph.prototype.appendElement = function () {
        let newNodes = this.nodes.enter()
          .append('circle');
        this.updateNodes(newNodes);
    };
    Graph.prototype.removeElement = function () {
        this.nodes.exit().remove();
    };

    function ContextMenu () {
    };
    ContextMenu.prototype.render = function (data) {
        this.data = data;
    };
    ContextMenu.prototype.on = function (eventName, menuItemPath, eventFn) {

    };
});