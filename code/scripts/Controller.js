define(['./ViewController', './Autometa', 'd3', 'materialize'], function (ViewCtrl, Autometa, D3, M) {
  let editMode = {
    EDITION: 0,
    ADDITION: 1,
    REMOVAL: 2
  }

  let mainController = new ViewCtrl.ViewController({
    data: {
      currentEditMode: editMode['EDITION'],
      autometa: Autometa.autometa,
    },
    components: {
      sideNav: M.Sidenav.init(document.querySelector('.sidenav')),

      tabPanel: M.Tabs.init(document.querySelector('#panel-tab')),

      fabModeSelecting: M.FloatingActionButton.init(document.querySelectorAll('.fixed-action-btn')),

      btnCurrentMode: document.querySelector('#mode-btn'),
      btnAdditionMode: document.querySelector('#addition-mode-btn'),
      btnEditionMode: document.querySelector('#edition-mode-btn'),
      btnRemovalMode: document.querySelector('#removal-mode-btn'),
      btnSideNav: document.querySelector('#sidenav-trigger'),

      lblAutometaType: document.querySelector('#autometa-type'),
      lblNodeCount: document.querySelector('#node-count'),
      lblEdgeCount: document.querySelector('#edge-count')
    },
    events: {
      updateType: function (type) {
      },
      updateNodeCount: function (count) {
      },
      updateEdgeCount: function (count) {
      }
    }
  });

  let boardController = new ViewCtrl.ViewController({
    data: {
      circleProp: {
        radius: 20,
        stroke: '#666666',
        strokeWidth: 5
      },
      nodeData: [],
      edgeData: [],
      autometa: Autometa.autometa,
      selectedElement: null
    },
    components: function () {
      let board = D3.select('#board');
      let circles = board.selectAll('circle');
      let links = board.selectAll('links');
      let auxiliaryLink = board.append('a');
      return {
        board: board,
        circles: circles,
        links: links,
        hoveredCircle: null,
        selectedCircle: null
      };
    },
    events: {
      _drawCircles: function () {
        let dragEventHandler;
        this.circles.data(this.nodeData)
          .enter()
          .append('circle')
          .classed('fill', '#123456')
          .attr('stroke', this.circleProp['stroke'])
          .attr('stroke-width', this.circleProp['strokeWidth'])
          .attr('r', this.circleProp['radius'])
          .attr('cx', datum => datum.position.x)
          .attr('cy', datum => datum.position.y)
        
        dragEventHandler = this._getDragCircleHandler(); 
        if (dragEventHandler) {
          this.circles.call(dragEventHandler);
        }
      },
      _drawLinks: function () {
    
      },
      _drawBoard: function () {
        this._drawCircles();
        this._drawLinks();
      },
      select: function (el, event) {
    
      },
      addNode: function () {
        let coordinate = D3.mouse(this.board.node());
        this.nodeData.push({
          position: { x: coordinate[0], y: coordinate[1] }
        });
        this._drawCircles();
      },
      addLink: function (el, event) {
    
      },
      removeNode: function (el, event) {
    
      },
      removeLink: function (el, event) {
    
      },
      updateNode: function (el, event) {
    
      },
      updateEdge: function (el, event) {
    
      },
      enterEditMode: function(el, event) {
    
      },
      exitEditMode: function(el, event) {
    
      },
      setMode: function (count) {
        switch (count) {
          case editMode.ADDITION:
            this._setModeAdditon();
            break;
          case editMode.EDITION:
            this._setModeEdition();
            break;
          case editMode.REMOVAL:
            this._setModeRemoval();
            break;
          default:;
        }
      },
      _setModeEdition: function () {
        let controller = this;
    
      },
      _setModeAdditon: function () {
        let controller = this;
        controller.board.on('click', function () {
          if (!D3.event.defaultPrevented) {
            controller.addNode();
          }
        });
      },
      _setModeRemoval: function () {
        let controller = this;
      },
      _getClickCircleHandler: function () {
        let controller = this;
        switch (controller.currentEditMode) {
          case editMode.ADDITION:
            return function (datum, index) {
            }
          case editMode.EDITION:
            return function (datum, index) {
            }
          case editMode.REMOVAL:
            return function (datum, index) {

            }
        }
      },
      _getDblClickCircleHandler: function () {
        let controller = this;
        switch (controller.currentEditMode) {
          case editMode.ADDITION:
            return function (datum, index) {
            }
          case editMode.EDITION:
            return function (datum, index) {
            }
          case editMode.REMOVAL:
            return function (datum, index) {

            }
        }
      },
      _getDragCircleHandler: function () {
        function _clamp(number, a, b) {
          if (number < a) {
            return a;
          } else if (number > b) {
            return b;
          } else {
            return number;
          }
        }
        let controller = this;
        let dragStarted = null, dragged = null, dragEnded = null;
        let dragEventHandler;
        switch (controller.currentEditMode) {
          case editMode.ADDITION:
            dragStarted =  function () {

            };
            dragged = function () {

            };
            dragEnded = function () {

            };
            break;
          case editMode.REMOVAL:
            dragEventHandler = null;
            break;
          case editMode.EDITION:
            dragStarted = function () {
              D3.event.sourceEvent.preventDefault();
              controller.selectedElement = this;
            };
            dragged = function () {
              let draggedEl = D3.select(this);
              let boardWidth = parseFloat(controller.board.style('width'));
              let boardHeight = parseFloat(controller.board.style('height'));
              let coordinate = D3.mouse(controller.board.node());
  
              datum.position.x = _clamp(coordinate[0], 0, boardWidth);
              datum.position.y = _clamp(coordinate[1], 0, boardHeight);
              draggedEl.attr('cx', datum.position.x).attr('cy', datum.position.y);
            };
            dragEnded = function () {
              controller.selectedElement = null;
            };
            break;
        }
        dragEventHandler = D3.drag();
        if (dragStarted) {
          dragEventHandler.on('start', dragStarted);
        }
        if (dragged) {
          dragEventHandler.on('drag', dragged);
        }
        if (dragEnded) {
          dragEventHandler.on('end', dragEnded);
        }
        return dragEventHandler;
      }
    }
  }, function (controller) {
    controller.setMode(editMode.ADDITION);
  });
  mainController.register('boardController', boardController);

  return {
    mainController: mainController,
    boardController: boardController,
    editMode: editMode
  };
});
