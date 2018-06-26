require.config({
  paths: {
    materialize: [ './lib/materialize/materialize' ],
    d3: ['./lib/d3js/d3']
  },
  shim: {
    materialize: { deps: [], exports: 'M' },
    d3: { deps: [], exports: 'D3' },
  }  
});
require(['./Controller', 'materialize'], function (Controller, M) {
});
