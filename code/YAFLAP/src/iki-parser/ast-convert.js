export function grammarTextToGrammarStructure (s) {
  var gra = []
  var left = ['jgallon']
  var arr = s.split('\n')
  var start = ''
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === '') continue
    var t = arr[i].trim()
    var res = isAss(t)
    if (res !== -1) {
      var l = t.slice(0, res).trim()
      var r = t.slice(res + 2, t.length).trim()
      if (l === '' || r === '') {
        throw new Error('Invalid grammar')
      } else {
        start = l
        r = resetBlank(r)
        var rarr = r.split(' ')
        rarr = replaceEpsilon(rarr)
        gra.push({left: start, right: rarr})
        left.push(start)
      }
    } else {
      if (t[0] === '|') {
        t = t.slice(1, t.length).trim()
        if (start === '') {
          throw new Error('invalid grammar')
        } else {
          resetBlank(t)
          var rarr = t.split(' ')
          rarr = replaceEpsilon(rarr)
          gra.push({left: start, right: rarr})
          left.push(start)
        }
      }
    }
  }
  return {grammar: gra, left: left}
}

function replaceEpsilon (arr) {
  var res = []
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === 'ε') {
      res.push(null)
    } else {
      res.push(arr[i])
    }
  }
  return res
}

function resetBlank (s) {
  var re = /\s+/g
  return s.replace(re, ' ')
}

function isAss (s) {
  for (var i = 0; i < s.length - 1; i++) {
    if (s[i] === '-' && s[i + 1] === '>') {
      return i
    }
  }
  return -1
}
