// error

var errorStr = ''
var errorCnt = 0

var error = function (message, location) {
  if (location && location.line) {
    message += ' at line ' + location.line
    if (location.col) {
      message += ', column ' + location.col
    }
  }
  if (!error.quiet) {
    // console.log("Error: " + message);
    errorStr += ('Semantic Error: ' + message + '\n')
    errorCnt += 1
  }
  return error.count++
}

export var getSemanticErrors = function () {
  return errorStr
}

export var getSemanticErrorsCount = function () {
  return errorCnt
}

error.quiet = false

error.count = 0

// Type

var cache = {}

export function Type (name) {
  this.name = name
  cache[this.name] = this
}

Type.BOOL = new Type('bool')

Type.INT = new Type('int')

Type.ARBITRARY = new Type('<arbitrary_type>')

Type.prototype.toString = function () {
  return this.name
}

Type.prototype.mustBeInteger = function (message, location) {
  return this.mustBeCompatibleWith(Type.INT, message, location)
}

Type.prototype.mustBeBoolean = function (message, location) {
  return this.mustBeCompatibleWith(Type.BOOL, message, location)
}

Type.prototype.mustBeCompatibleWith = function (otherType, message, location) {
  if (!this.isCompatibleWith(otherType)) {
    return error(message, location)
  }
}

Type.prototype.mustBeMutuallyCompatibleWith = function (otherType, message, location) {
  if (!(this.isCompatibleWith(otherType || otherType.isCompatibleWith(this)))) {
    return error(message, location)
  }
}

Type.prototype.isCompatibleWith = function (otherType) {
  return this === otherType || this === Type.ARBITRARY || otherType === Type.ARBITRARY
}

Type.forName = function (name) {
  return cache[name]
}

// VariableExpression

export function VariableExpression (name) {
  this.name = name
}

VariableExpression.prototype.toString = function () {
  return this.name
}

VariableExpression.prototype.analyze = function (context) {
  this.referent = context.lookupVariable(this.name)
  return this.type = this.referent.type
}

VariableExpression.prototype.optimize = function () {
  return this
}

// IntegerLiteral

export function IntegerLiteral (value) {
  this.value = value
}

IntegerLiteral.prototype.toString = function () {
  return this.value
}

IntegerLiteral.prototype.analyze = function (context) {
  return this.type = Type.INT
}

IntegerLiteral.prototype.optimize = function () {
  return this
}

// BooleanLiteral

export function BooleanLiteral (name) {
  this.name = '' + name
}

BooleanLiteral.prototype.value = function () {
  return this.name === 'true'
}

BooleanLiteral.prototype.toString = function () {
  return this.name
}

BooleanLiteral.prototype.analyze = function (context) {
  return this.type = Type.BOOL
}

BooleanLiteral.prototype.optimize = function () {
  return this
}

// BinaryExpression

export function BinaryExpression (op, left, right) {
  this.op = op
  this.left = left
  this.right = right
}

BinaryExpression.prototype.toString = function () {
  return '(' + this.op + ' ' + this.left + ' ' + this.right + ')'
}

BinaryExpression.prototype.analyze = function (context) {
  var op
  this.left.analyze(context)
  this.right.analyze(context)
  op = this.op
  switch (op) {
    case '<':
    case '<=':
    case '>=':
    case '>':
      this.mustHaveIntegerOperands()
      return this.type = Type.BOOL
    case '==':
    case '!=':
      this.mustHaveCompatibleOperands()
      return this.type = Type.BOOL
    case 'and':
    case 'or':
      this.mustHaveBooleanOperands()
      return this.type = Type.BOOL
    default:
      this.mustHaveIntegerOperands()
      return this.type = Type.INT
  }
}

BinaryExpression.prototype.optimize = function () {
  this.left = this.left.optimize()
  this.right = this.right.optimize()
  if (this.left instanceof IntegerLiteral && this.right instanceof IntegerLiteral) {
    return foldIntegerConstants(this.op, +this.left.value, +this.right.value)
  } else if (this.left instanceof BooleanLiteral && this.right instanceof BooleanLiteral) {
    return foldBooleanConstants(this.op, this.left.value(), this.right.value())
  } else {
    switch (this.op) {
      case '+':
        if (isIntegerLiteral(this.right, 0)) {
          return this.left
        }
        if (isIntegerLiteral(this.left, 0)) {
          return this.right
        }
        break
      case '-':
        if (isIntegerLiteral(this.right, 0)) {
          return this.left
        }
        if (sameVariable(this.left, this.right)) {
          return new IntegerLiteral(0)
        }
        break
      case '*':
        if (isIntegerLiteral(this.right, 1)) {
          return this.left
        }
        if (isIntegerLiteral(this.left, 1)) {
          return this.right
        }
        if (isIntegerLiteral(this.right, 0)) {
          return new IntegerLiteral(0)
        }
        if (isIntegerLiteral(this.left, 0)) {
          return new IntegerLiteral(0)
        }
        break
      case '/':
        if (isIntegerLiteral(this.right, 1)) {
          return this.left
        }
        if (sameVariable(this.left, this.right)) {
          return new IntegerLiteral(1)
        }
    }
  }
  return this
}

BinaryExpression.prototype.mustHaveIntegerOperands = function () {
  var error
  error = '' + this.op + ' must have integer operands'
  this.left.type.mustBeCompatibleWith(Type.INT, error, this.op)
  return this.right.type.mustBeCompatibleWith(Type.INT, error, this.op)
}

BinaryExpression.prototype.mustHaveBooleanOperands = function () {
  var error
  error = '' + this.op + ' must have boolean operands'
  this.left.type.mustBeCompatibleWith(Type.BOOL, error, this.op)
  return this.right.type.mustBeCompatibleWith(Type.BOOL, error, this.op)
}

BinaryExpression.prototype.mustHaveCompatibleOperands = function () {
  var error
  error = '' + this.op + ' must have mutually compatible operands'
  return this.left.type.mustBeMutuallyCompatibleWith(this.right.type, error, this.op)
}

var isIntegerLiteral = function (operand, value) {
  return operand instanceof IntegerLiteral && operand.value === value
}

var sameVariable = function (exp1, exp2) {
  return exp1 instanceof VariableExpression && exp2 instanceof VariableExpression && exp1.referent === exp2.referent
}

var foldIntegerConstants = function (op, x, y) {
  switch (op) {
    case '+':
      return new IntegerLiteral(x + y)
    case '-':
      return new IntegerLiteral(x - y)
    case '*':
      return new IntegerLiteral(x * y)
    case '/':
      return new IntegerLiteral(x / y)
    case '<':
      return new BooleanLiteral(x < y)
    case '<=':
      return new BooleanLiteral(x <= y)
    case '==':
      return new BooleanLiteral(x === y)
    case '!=':
      return new BooleanLiteral(x !== y)
    case '>=':
      return new BooleanLiteral(x >= y)
    case '>':
      return new BooleanLiteral(x > y)
  }
}

var foldBooleanConstants = function (op, x, y) {
  switch (op) {
    case '==':
      return new BooleanLiteral(x === y)
    case '!=':
      return new BooleanLiteral(x !== y)
    case 'and':
      return new BooleanLiteral(x && y)
    case 'or':
      return new BooleanLiteral(x || y)
  }
}

// UnaryExpression

export function UnaryExpression (op, operand) {
  this.op = op
  this.operand = operand
}

UnaryExpression.prototype.toString = function () {
  return '(' + this.op + ' ' + this.operand + ')'
}

UnaryExpression.prototype.analyze = function (context) {
  this.operand.analyze(context)
  switch (this.op) {
    case 'not':
      this.operand.type.mustBeBoolean('The "not" operator requires a boolean operand', this.op)
      return this.type = Type.BOOL
    case '-':
      this.operand.type.mustBeInteger('The "negation" operator requires an integer operand', this.op)
      return this.type = Type.INT
  }
}

UnaryExpression.prototype.optimize = function () {
  this.operand = this.operand.optimize()
  if (this.op === 'not' && this.operand instanceof BooleanLiteral) {
    return new BooleanLiteral(!this.operand.value)
  } else if (this.op === '-' && this.operand instanceof IntegerLiteral) {
    return new IntegerLiteral(-this.operand.value)
  } else {
    return this
  }
}

// WhileStatement

export function WhileStatement (condition, body) {
  this.condition = condition
  this.body = body
}

WhileStatement.prototype.toString = function () {
  return '(While ' + this.condition + ' ' + this.body + ')'
}

WhileStatement.prototype.analyze = function (context) {
  this.condition.analyze(context)
  this.condition.type.mustBeBoolean('Condition in "while" statement must be boolean')
  return this.body.analyze(context)
}

WhileStatement.prototype.optimize = function () {
  this.condition = this.condition.optimize()
  this.body = this.body.optimize()
  if (this.condition instanceof BooleanLiteral && this.condition.value() === false) {
    return null
  }
  return this
}

// WriteStatement

export function WriteStatement (expressions) {
  this.expressions = expressions
}

WriteStatement.prototype.toString = function () {
  return '(Write ' + (this.expressions.join(' ')) + ')'
}

WriteStatement.prototype.analyze = function (context) {
  var e, _i, _len, _ref, _results
  _ref = this.expressions
  _results = []
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    e = _ref[_i]
    e.analyze(context)
    _results.push(e.type.mustBeInteger('Expressions in "write" statement must have type integer'))
  }
  return _results
}

WriteStatement.prototype.optimize = function () {
  var e
  this.expressions = (function () {
    var _i, _len, _ref, _results
    _ref = this.expressions
    _results = []
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      e = _ref[_i]
      _results.push(e.optimize())
    }
    return _results
  }.call(this))
  return this
}

// ReadStatement

export function ReadStatement (varexps) {
  this.varexps = varexps
}

ReadStatement.prototype.toString = function () {
  return '(Read ' + (this.varexps.join(' ')) + ')'
}

ReadStatement.prototype.analyze = function (context) {
  var v, _i, _len, _ref, _results
  _ref = this.varexps
  _results = []
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    v = _ref[_i]
    v.analyze(context)
    _results.push(v.type.mustBeInteger('Variables in "read" statement must have type integer'))
  }
  return _results
}

ReadStatement.prototype.optimize = function () {
  return this
}

// AssignmentStatement

export function AssignmentStatement (target, source) {
  this.target = target
  this.source = source
}

AssignmentStatement.prototype.toString = function () {
  return '(= ' + this.target + ' ' + this.source + ')'
}

AssignmentStatement.prototype.analyze = function (context) {
  this.target.analyze(context)
  this.source.analyze(context)
  return this.source.type.mustBeCompatibleWith(this.target.type, 'Type mismatch in assignment')
}

AssignmentStatement.prototype.optimize = function () {
  this.target = this.target.optimize()
  this.source = this.source.optimize()
  if (this.source instanceof VariableExpression && this.target.referent === this.source.referent) {
    null
  }
  return this
}

// VariableDeclaration

export function VariableDeclaration (id, type) {
  this.id = id
  this.type = type
}

VariableDeclaration.prototype.toString = function () {
  return '(Var ' + this.id + ' ' + this.type + ')'
}

VariableDeclaration.prototype.analyze = function (context) {
  context.variableMustNotBeAlreadyDeclared(this.id)
  return context.addVariable(this.id, this)
}

VariableDeclaration.prototype.optimize = function () {
  return this
}

VariableDeclaration.ARBITRARY = new VariableDeclaration('<arbitrary>', Type.ARBITRARY)

// Block

export function Block (statements) {
  this.statements = statements
}

Block.prototype.toString = function () {
  return '(Block ' + (this.statements.join(' ')) + ')'
}

Block.prototype.analyze = function (context) {
  var localContext, statement, _i, _len, _ref, _results
  localContext = context.createChildContext()
  _ref = this.statements
  _results = []
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    statement = _ref[_i]
    _results.push(statement.analyze(localContext))
  }
  return _results
}

Block.prototype.optimize = function () {
  var s
  this.statements = (function () {
    var _i, _len, _ref, _results
    _ref = this.statements
    _results = []
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      s = _ref[_i]
      _results.push(s.optimize())
    }
    return _results
  }.call(this))
  this.statements = (function () {
    var _i, _len, _ref, _results
    _ref = this.statements
    _results = []
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      s = _ref[_i]
      if (s !== null) {
        _results.push(s)
      }
    }
    return _results
  }.call(this))
  return this
}

// Program

var intermediate_code = []
var analysisContextAncestor = null

export function getAnalysisContextAncestor () {
  return analysisContextAncestor
}

export function getIntermediateCode (p) {
  intermediate_code = []
  p.showSemanticGraph()
  return intermediate_code
}

export function Program (block) {
  this.block = block
}

Program.prototype.toString = function () {
  return '(Program ' + this.block + ')'
}

Program.prototype.analyze = function () {
  errorStr = ''
  errorCnt = 0
  analysisContextAncestor = new AnalysisContext(null)
  return this.block.analyze(analysisContextAncestor)
}

Program.prototype.optimize = function () {
  this.block = this.block.optimize()
  return this
}

Program.prototype.showSemanticGraph = function () {
  var dump, rep, seenEntities, tag
  tag = 0
  seenEntities = new HashMap()
  dump = function (entity, tag) {
    var key, props, tree, value
    props = {}
    for (key in entity) {
      tree = entity[key]
      value = rep(tree)
      if (value !== void 0) {
        props[key] = value
      }
    }
    intermediate_code.push({tag: tag, constructorName: entity.constructor.name, props: props})
    // return console.log("%d %s %j", tag, entity.constructor.name, props);
  }
  rep = function (e) {
    if (/undefined|function/.test(typeof e)) {
      return void 0
    } else if (/number|string|boolean/.test(typeof e)) {
      return e
    } else if (Array.isArray(e)) {
      return e.map(rep)
    } else {
      if (!seenEntities.has(e)) {
        seenEntities.set(e, ++tag)
        dump(e, tag)
      }
      return seenEntities.get(e)
    }
  }
  return dump(this, 0)
}

// AnalysisContext

function AnalysisContext (parent) {
  this.parent = parent
  this.symbolTable = {}
  this.sons = []
}

AnalysisContext.prototype.createChildContext = function () {
  var child = new AnalysisContext(this)
  this.sons.push(child)
  return child
}

AnalysisContext.prototype.variableMustNotBeAlreadyDeclared = function (name) {
  if (this.symbolTable[name]) {
    return error('Variable ' + name + ' already declared', name)
  }
}

AnalysisContext.prototype.addVariable = function (name, entity) {
  return this.symbolTable[name] = entity
}

AnalysisContext.prototype.lookupVariable = function (name) {
  var variable
  variable = this.symbolTable[name]
  if (variable) {
    return variable
  } else if (!this.parent) {
    error('Variable ' + name + ' not found', name)
    return VariableDeclaration.ARBITRARY
  } else {
    return this.parent.lookupVariable(name)
  }
}
