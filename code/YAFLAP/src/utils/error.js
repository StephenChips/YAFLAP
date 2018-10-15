export var eCode = {
  EDGE_EXISTS: 'edge exists',
  EDGE_NOT_EXISTS: 'edge not exists',
  NODE_EXISTS: 'ndoe exists',
  NODE_NOT_EXISTS: 'node not exists',
  CONFIG_ERROR: 'config error'
}

export function Exception (eCode) {
  this.eCode = eCode
}
