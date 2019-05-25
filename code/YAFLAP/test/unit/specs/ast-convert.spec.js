import { grammarTextToGrammarStructure } from '../../../src/iki-parser/ast-convert'

describe('convert grammar', function () {
  it('Case #1', function () {
    var result = grammarTextToGrammarStructure('S -> a b c;')
    expect(result).toEqual([
      { left: 'S', right: ['a', 'b', 'c'] }
    ])
  })

  it('Case #2', function () {
    var result = grammarTextToGrammarStructure('')
    expect(result).toEqual([])
  })

  it('Case #3', function () {
    var result = grammarTextToGrammarStructure('S -> a b c | A b c;')
    expect(result).toEqual([
      { left: 'S', right: ['a', 'b', 'c'] },
      { left: 'S', right: ['A', 'b', 'c'] }
    ])
  })

  it('Case #4', function () {
    var result = grammarTextToGrammarStructure(`
      S -> a b c
        |  A b c
        ;
    `)
    expect(result).toEqual([
      { left: 'S', right: ['a', 'b', 'c'] },
      { left: 'S', right: ['A', 'b', 'c'] }
    ])
  })
  it('Case #5', function () {
    var result = grammarTextToGrammarStructure(`
      Start -> a Alpha b;
      Alpha -> Beta word
            | Alpha Beta
            ;
      Beta -> e Beta
            | d
            ;
    `)
    expect(result).toEqual([
      { left: 'Start', right: ['a', 'Alpha', 'b'] },
      { left: 'Alpha', right: ['Beta', 'word'] },
      { left: 'Alpha', right: ['Alpha', 'Beta'] },
      { left: 'Beta', right: ['e', 'Beta'] },
      { left: 'Beta', right: ['d'] }
    ])
  })

  it('Case #6', function () {
    var result = grammarTextToGrammarStructure('Start -> ε;')
    expect(result).toEqual([
      { left: 'Start', right: [null] }
    ])
  })

  it('Case #7', function () {
    var result = grammarTextToGrammarStructure(`
      Start -> StartLeft;
      StartLeft -> left-parenthesis StartLeft right-parenthesis
            | ε
            ;
    `)
    expect(result).toEqual([
      { left: 'Start', right: ['StartLeft'] },
      { left: 'StartLeft', right: ['left-parenthesis', 'StartLeft', 'right-parenthesis'] },
      { left: 'StartLeft', right: [null] }
    ])
  })

  it('Case #8', function () {
    expect(function () {
      var result = grammarTextToGrammarStructure('Start ->  ')
    }).toThrow('Empty symbol list at right hand side of the production.')
  })

  it('Case #9', function () {
    expect(function () {
      grammarTextToGrammarStructure('Start -> e c d')
    }).toThrow('Expect \';\' at the end of a production.')
  })
})
