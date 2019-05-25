export function grammarTextToGrammarStructure (strGrammar) {
  var result = []
  var cursor = skipWhitespaces(strGrammar, 0)
  while (cursor < strGrammar.length && isValidCharOfSymbol(strGrammar[cursor])) {
    var { productionList, end } = parseProduction(strGrammar, cursor)
    result = result.concat(productionList)
    cursor = skipWhitespaces(strGrammar, end)
  }
  return result
}

function parseProduction (strGrammar, cursor) {
  let lhs, rhs
  lhs = parseLHSOfProduction(strGrammar, cursor)
  cursor = skipWhitespaces(strGrammar, lhs.end) // TODO
  cursor = skipProductionSign(strGrammar, cursor)
  cursor = skipWhitespaces(strGrammar, cursor)
  rhs = parseRHSOfProduction(strGrammar, cursor)
  cursor = skipSemiColon(strGrammar, rhs.end)
  return {
    productionList: makeProductionList(lhs.symbol, rhs.listOfRhs),
    end: cursor
  }
}

// Parse left hand side of production
function parseLHSOfProduction (strGrammar, cursor) {
  if (!isUppercase(strGrammar[cursor])) {
    throw new SyntaxError('The left hand side of a production should be an terminator')
  } else {
    return parseSymbol(strGrammar, cursor)
  }
}

function skipProductionSign (strGrammar, cursor) {
  cursor = skipWhitespaces(strGrammar, cursor)
  if (cursor >= strGrammar.length - 1) {
    throw new SyntaxError('Incomplete produciton, missing prodcution sign and symbol list')
  } else if (strGrammar[cursor] === '-' && strGrammar[cursor + 1] === '>') {
    return cursor + 2
  } else {
    throw new SyntaxError('Expect production sign')
  }
}

function parseRHSOfProduction (strGrammar, cursor, lhsSymbol) {
  var parseResult = parseSymbolList(strGrammar, cursor)
  var listOfRhs = [parseResult.symbolList]
  cursor = parseResult.end

  while (cursor < strGrammar.length && strGrammar[cursor] === '|') {
    cursor = skipWhitespaces(strGrammar, ++cursor) // Skip "|" and the whitespaces after it
    parseResult = parseSymbolList(strGrammar, cursor)
    listOfRhs.push(parseResult.symbolList)
    cursor = parseResult.end
  }

  return {
    listOfRhs,
    end: cursor
  }
}

function skipSemiColon (strGrammar, cursor) {
  if (cursor >= strGrammar.length || strGrammar[cursor] !== ';') {
    throw new SyntaxError('Expect \';\' at the end of a production.')
  }
  return ++cursor
}

function parseSymbol (strGrammar, cursor) {
  var end = cursor
  while (end < strGrammar.length && isValidCharOfSymbol(strGrammar[end])) {
    end++
  }
  var symbol = strGrammar.substring(cursor, end)
  if (symbol === 'ε') {
    symbol = null
  }
  return { symbol, end }
}

function parseSymbolList (strGrammar, cursor) {
  var symbolList = []
  while (cursor < strGrammar.length && isValidCharOfSymbol(strGrammar[cursor])) {
    var { symbol, end } = parseSymbol(strGrammar, cursor)
    symbolList.push(symbol)
    cursor = skipWhitespaces(strGrammar, end)
  }
  if (symbolList.length === 0) {
    throw new SyntaxError('Empty symbol list at right hand side of the production.')
  }
  return { symbolList, end: cursor }
}

function isValidCharOfSymbol (char) {
  return /[A-Za-zε_']/.test(char)
}

function skipWhitespaces (strGrammar, cursor) {
  while (cursor < strGrammar.length && isWhitespace(strGrammar[cursor])) {
    cursor++
  }
  return cursor
}

function isWhitespace (char) {
  return /\s/.test(char)
}

function isUppercase (char) {
  return char.toUpperCase() === char
}

function makeProductionList (lhsSymbol, listOfRhs) {
  return listOfRhs.map(function (rhs) {
    return {
      left: lhsSymbol,
      right: rhs
    }
  })
}
