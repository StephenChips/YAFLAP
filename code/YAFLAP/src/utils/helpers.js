export function parseTransition (str) {
  let transitionArray = str
    .split(',')
    .map(function (str) {
      let trimmed = str.trim()
      return trimmed === 'ε' ? '' : trimmed
    })
  return new Set(transitionArray)
}

export class KeyGenerator {
  constructor () {
    this.count = 0
  }
  generate () {
    return this.count++
  }
}
