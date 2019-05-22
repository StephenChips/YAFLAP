import ohm from 'ohm-js'
import * as Ast from './ast'

export const grammarText = `
Iki {
  Program     =  Block
  Block       =  (Stmt ";")+
  Stmt        =  "var" id ":" Type               -- decl
              |  VarExp "=" Exp                  -- assignment
              |  "read" VarExp ("," VarExp)*     -- read
              |  "write" Exp ("," Exp)*          -- write
              |  "while" Exp "loop" Block "end"  -- while
  Type        =  "int" | "bool"
  Exp         =  Exp "or" Exp1                   -- binary
              |  Exp1
  Exp1        =  Exp1 "and" Exp2                 -- binary
              |  Exp2
  Exp2        =  Exp2 relop Exp3                 -- binary
              |  Exp3
  Exp3        =  Exp3 addop Exp4                 -- binary
              |  Exp4
  Exp4        =  Exp4 mulop Exp5                 -- binary
              |  Exp5
  Exp5        =  prefixop Exp6                   -- unary
              |  Exp6
  Exp6        =  boollit
              |  intlit
              |  VarExp
              |  "(" Exp ")"                     -- parens
  VarExp      = id

  keyword     =  ("var" | "read" | "write" | "while" | "loop"
              |  "end" | "int" | "bool" | "true" | "false") ~idrest
  id          =  ~keyword letter idrest*
  idrest      =  "_" | alnum
  intlit      =  digit+
  boollit     =  "true" | "false"
  addop       =  "+" | "-"
  relop       =  "<=" | "<" | "==" | "!=" | ">=" | ">"
  mulop       =  "*" | "/" | "%"
  prefixop    =  ~"--" "-" | "not"

  space      +=  comment
  comment     =  "--" (~"\\n" any)* "\\n"
}
`

export const grammars = ohm.grammar(grammarText)
export const sematics = grammars.createSemantics()

var makeElement = function (tagName) {
  var element = document.createElement(tagName)
  var child
  for (var i = 1; i < arguments.length; i++) {
    if (Array.isArray(arguments[i])) {
      for (var j = 0; j < arguments[i].length; j++) {
        child = typeof arguments[i][j] === 'string'
          ? document.createTextNode(arguments[i][j])
          : arguments[i][j]
        element.appendChild(child)
      }
    } else {
      child = typeof arguments[i] === 'string'
        ? document.createTextNode(arguments[i])
        : arguments[i]
      element.appendChild(child)
    }
  }
  return element
}

sematics.addOperation('ast', {
  Program: function (b) {
    return new Ast.Program(b.ast())
  },
  Block: function (s, _) {
    return new Ast.Block(s.ast())
  },
  Stmt_decl: function (v, id, _, type) {
    return new Ast.VariableDeclaration(id.sourceString, type.ast())
  },
  Stmt_assignment: function (varexp, _, exp) {
    return new Ast.AssignmentStatement(varexp.ast(), exp.ast())
  },
  Stmt_read: function (r, varexp, c, more) {
    return new Ast.ReadStatement([varexp.ast()].concat(more.ast()))
  },
  Stmt_write: function (w, e, c, more) {
    return new Ast.WriteStatement([e.ast()].concat(more.ast()))
  },
  Stmt_while: function (w, e, d, b, _) {
    return new Ast.WhileStatement(e.ast(), b.ast())
  },
  Type: function (typeName) {
    return Ast.Type.forName(typeName.sourceString)
  },
  Exp_binary: function (e1, _, e2) {
    return new Ast.BinaryExpression('or', e1.ast(), e2.ast())
  },
  Exp1_binary: function (e1, _, e2) {
    return new Ast.BinaryExpression('and', e1.ast(), e2.ast())
  },
  Exp2_binary: function (e1, op, e2) {
    return new Ast.BinaryExpression(op.sourceString, e1.ast(), e2.ast())
  },
  Exp3_binary: function (e1, op, e2) {
    return new Ast.BinaryExpression(op.sourceString, e1.ast(), e2.ast())
  },
  Exp4_binary: function (e1, op, e2) {
    return new Ast.BinaryExpression(op.sourceString, e1.ast(), e2.ast())
  },
  Exp5_unary: function (op, e) {
    return new Ast.UnaryExpression(op.sourceString, e.ast())
  },
  Exp6_parens: function (l, e, r) {
    return e.ast()
  },
  boollit: function (b) {
    return new Ast.BooleanLiteral(this.sourceString)
  },
  intlit: function (n) {
    return new Ast.IntegerLiteral(this.sourceString)
  },
  VarExp: function (i) {
    return new Ast.VariableExpression(this.sourceString)
  }
})
sematics.addOperation('toTree', {
  Program: function (b) {
    return makeElement('Program', b.toTree())
  },
  Block: function (s, _) {
    return makeElement('Block', s.toTree())
  },
  Stmt_decl: function (v, id, _, type) {
    return makeElement('VariableDeclaration', v.toTree(), id.toTree(), type.toTree())
  },
  Stmt_assignment: function (varexp, _, exp) {
    return makeElement('AssignmentStatement', varexp.toTree(), _.toTree(), exp.toTree())
  },
  Stmt_read: function (r, varexp, c, more) {
    return makeElement('ReadStatement', r.toTree(), varexp.toTree(), more.toTree())
  },
  Stmt_write: function (w, e, c, more) {
    return makeElement('WriteStatement', w.toTree(), e.toTree(), more.toTree())
  },
  Stmt_while: function (w, e, d, b, _) {
    return makeElement('WhileStatement', w.toTree(), e.toTree(), 'loop', b.toTree(), 'end')
  },
  Type: function (typeName) {
    return makeElement('Type', typeName.toTree())
  },
  Exp_binary: function (e1, _, e2) {
    return makeElement('BinaryExpression', 'or', e1.toTree(), e2.toTree())
  },
  Exp: function (e) {
    return makeElement('BinaryExpression', e.toTree())
  },
  Exp1_binary: function (e1, _, e2) {
    return makeElement('BinaryExpression', 'and', e1.toTree(), e2.toTree())
  },
  Exp1: function (e) {
    return makeElement('BinaryExpression', e.toTree())
  },
  Exp2_binary: function (e1, op, e2) {
    return makeElement('BinaryExpression', op.toTree(), e1.toTree(), e2.toTree())
  },
  Exp2: function (e) {
    return makeElement('BinaryExpression', e.toTree())
  },
  Exp3_binary: function (e1, op, e2) {
    return makeElement('BinaryExpression', op.toTree(), e1.toTree(), e2.toTree())
  },
  Exp3: function (e) {
    return makeElement('BinaryExpression', e.toTree())
  },
  Exp4_binary: function (e1, op, e2) {
    return makeElement('BinaryExpression', op.toTree(), e1.toTree(), e2.toTree())
  },
  Exp4: function (e) {
    return makeElement('BinaryExpression', e.toTree())
  },
  Exp5_unary: function (op, e) {
    return makeElement('UnaryExpression', op.toTree(), e.toTree())
  },
  Exp5: function (e) {
    return makeElement('Expression', e.toTree())
  },
  Exp6_parens: function (l, e, r) {
    return makeElement('Parens', l.toTree(), e.toTree(), r.toTree())
  },
  Exp6: function (e) {
    return makeElement('Expression', e.toTree())
  },
  boollit: function (b) {
    return makeElement('BooleanLiteral', this.sourceString)
  },
  intlit: function (n) {
    return makeElement('IntegerLiteral', this.sourceString)
  },
  id: function (k, l) {
    return makeElement('ID', this.sourceString)
  },
  VarExp: function (i) {
    return makeElement('VariableExpression', i.toTree())
  },
  _terminal: function () {
    return this.primitiveValue
  }
})

sematics.addAttribute('token', {
  Program: function (b) {
    // return new Program(b.ast());
    return [b.token]
  },
  Block: function (s, _) {
    // return new Block(s.ast());
    var tmp = s.token
    var res = []
    if (Array.isArray(tmp)) {
      for (var i = 0; i < tmp.length; i++) {
        res = res.concat(tmp[i].concat(['SEMICOLON']))
      }
    }
    // return [s.token, 'SEMICOLON'];
    return [res]
  },
  Stmt_decl: function (v, id, _, type) {
    // return new VariableDeclaration(id.sourceString, type.ast());
    return ['VAR', 'ID(' + id.token + ')', 'COLON', 'TYPE(' + type.token + ')']
  },
  Stmt_assignment: function (varexp, _, exp) {
    // return new AssignmentStatement(varexp.ast(), exp.ast());
    return [varexp.token, 'EQUAL', exp.token]
  },
  Stmt_read: function (r, varexp, c, more) {
    // return new ReadStatement([varexp.ast()].concat(more.ast()));
    var tmp = more.token
    var arr = []
    if (Array.isArray(tmp)) {
      for (var i = 0; i < tmp.length; i++) {
        arr = arr.concat(['COMMA'].concat(tmp[i]))
      }
    }
    return ['READ', varexp.token].concat(arr)
  },
  Stmt_write: function (w, e, c, more) {
    // return new WriteStatement([e.ast()].concat(more.ast()));
    var tmp = more.token
    var arr = []
    if (Array.isArray(tmp)) {
      for (var i = 0; i < tmp.length; i++) {
        arr = arr.concat(['COMMA'].concat(tmp[i]))
      }
    }
    return ['WRITE', e.token].concat(arr)
  },
  Stmt_while: function (w, e, d, b, _) {
    // return new WhileStatement(e.ast(), b.ast());
    return ['WHILE', e.token, 'LOOP', b.token, 'END']
  },
  Type: function (typeName) {
    // return Type.forName(typeName.sourceString);
    var str = typeName.sourceString
    if (str === 'int') {
      str = 'INT'
    } else if (str === 'bool') {
      str = 'BOOL'
    }
    return str
  },
  Exp_binary: function (e1, _, e2) {
    // return new BinaryExpression("or", e1.ast(), e2.ast());
    return [e1.token, 'OR', e2.token]
  },
  Exp1_binary: function (e1, _, e2) {
    // return new BinaryExpression("and", e1.ast(), e2.ast());
    return [e1.token, 'AND', e2.token]
  },
  Exp2_binary: function (e1, op, e2) {
    // return new BinaryExpression(op.sourceString, e1.ast(), e2.ast());
    var str = op.sourceString
    if (str === '<=') { str = 'LE' } else if (str === '<') { str = 'L' } else if (str === '==') { str = 'E' } else if (str === '!=') { str = 'NE' } else if (str === '>=') { str = 'GE' } else if (str === '>') { str = 'G' }
    return [e1.token, str, e2.token]
  },
  Exp3_binary: function (e1, op, e2) {
    // return new BinaryExpression(op.sourceString, e1.ast(), e2.ast());
    var str = op.sourceString
    if (str === '+') { str = 'ADD' } else if (str === '-') { str = 'SUB' }
    return [e1.token, str, e2.token]
  },
  Exp4_binary: function (e1, op, e2) {
    // return new BinaryExpression(op.sourceString, e1.ast(), e2.ast());
    var str = op.sourceString
    if (str === '*') { str = 'MUL' } else if (str === '/') { str = 'DIV' } else if (str === '%') { str = 'MOD' }
    return [e1.token, str, e2.token]
  },
  Exp5_unary: function (op, e) {
    // return new UnaryExpression(op.sourceString, e.ast());
    var str = op.sourceString
    if (str === '-') { str = 'MINUS' } else if (str === 'not') { str = 'NOT' }
    return [str, e.token]
  },
  Exp6_parens: function (l, e, r) {
    // return e.ast();
    return ['LP', e.token, 'RP']
  },
  boollit: function (b) {
    // return new BooleanLiteral(this.sourceString);
    return ['BOOL(' + this.sourceString + ')']
  },
  intlit: function (n) {
    // return new IntegerLiteral(this.sourceString);
    return ['NUM(' + this.sourceString + ')']
  },
  VarExp: function (i) {
    // return new VariableExpression(this.sourceString);
    return ['ID(' + this.sourceString + ')']
  },
  id: function (k, l) {
    return [this.sourceString]
  },
  _nonterminal: function (children) {
    if (children.length === 1) {
      // If this node has only one child, just return the Lisp-like tree of its child. This lets us
      // avoid writing semantic actions for the `Exp`, `AddExp`, `MulExp`, `ExpExp`, and `PriExp`
      // rules.
      return children[0].token
    } else {
      // If this node doesn't have exactly one child, we probably should have handled it specially.
      // So we'll throw an exception to let us know that we're missing a semantic action for this
      // type of node.
      throw new Error('Uh-oh, missing semantic action for ' + this.constructor)
    }
  }
})
