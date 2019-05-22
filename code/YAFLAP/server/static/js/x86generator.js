var x86str = '';

var usedVariables = {};
var lastId = 0;
var map;
var labelsGenerated = 0;

var makeVariable = (function () {
    // var lastId = 0
    // var map = new HashMap()
    return function (v) {
        if (!map.has(v)) map.set(v, ++lastId)
        return '_v' + map.get(v)
    }
}())

var makeLabel = (function () {
    // var labelsGenerated = 0
    return function () {
        return 'L' + (++labelsGenerated)
    }
}())

function gen(e) {
    return generator[e.constructor.name](e)
}

function getAssemblyLanguage(p) {
    labelsGenerated = 0;
    lastId = 0;
    map = new HashMap();
    usedVariables = {};

    x86str = '';
    gen(p);
    return x86str;
}

var generator = {

    'Program': function (program) {
        emit('.globl', '_main')
        emit('.text')
        emitLabel('_main')
        emit('push', '%rbp')
        gen(program.block)
        emit('pop', '%rbp')
        emit('ret')
        emit('.data')
        emitLabel('READ')
        emit('.ascii', '"%d\\0\\0"')
        emitLabel('WRITE')
        emit('.ascii', '"%d\\n\\0"')
        for (var s in usedVariables) {
            emitLabel(s)
            emit('.quad', '0');
        }
    },

    'Block': function (block) {
        block.statements.forEach(function (statement) {
            gen(statement)
            allocator.freeAllRegisters()
        })
    },

    'VariableDeclaration': function (v) {
        
    },

    'AssignmentStatement': function (s) {
        source = gen(s.source)
        destination = gen(s.target)
        if (source instanceof MemoryOperand && destination instanceof MemoryOperand) {
            var oldSource = source
            source = allocator.makeRegisterOperand()
            emit('mov', oldSource, source)
        }
        emit('mov', source, destination)
    },

    'ReadStatement': function (s) {
       
        s.varexps.forEach(function (v) {
            emit('mov', gen(v), '%rsi')
            emit('lea', 'READ(%rip)', '%rdi')
            emit('xor', '%rax', '%rax')
            emit('call', '_scanf')
        })
    },

    'WriteStatement': function (s) {
        
        s.expressions.forEach(function (e) {
            emit('mov', gen(e), '%rsi')
            emit('lea', 'WRITE(%rip)', '%rdi')
            emit('xor', '%rax', '%rax')
            emit('call', '_printf')
        })
    },

    'WhileStatement': function (s) {
        var top = makeLabel();
        var bottom = makeLabel();
        emitLabel(top);
        var condition = gen(s.condition);
        emitJumpIfFalse(condition, bottom);
        allocator.freeAllRegisters();
        gen(s.body)
        emit('jmp', top);
        emitLabel(bottom);
    },

    'IntegerLiteral': function (literal) {
        return new ImmediateOperand(literal.toString());
    },

    'BooleanLiteral': function (literal) {
        return new ImmediateOperand(['false', 'true'].indexOf(literal.toString()))
    },

    'VariableExpression': function (v) {
        var name = makeVariable(v.referent);
        usedVariables[name] = true;
        return new MemoryOperand(name);
    },

    'UnaryExpression': function (e) {
        var result = allocator.ensureRegister(gen(e.operand))
        var instruction = {'-': 'neg', 'not': 'not'}[e.op]
        emit(instruction, result)
        return result
    },

    'BinaryExpression': function (e) {
        var left = gen(e.left)
        var result = (e.op === '/') ?
            allocator.makeRegisterOperandFor("rax") :
            allocator.ensureRegister(left)

        if (e.op === 'and') {
            emitShortCircuit('je', e, result)
            return result
        }

        if (e.op === 'or') {
            emitShortCircuit('jne', e, result)
            return result
        }

        var right = gen(e.right)

        if (e.op === '/') {
            emit("movq", left, result);
            emit("cqto");
            emit("idivq", allocator.nonImmediate(right));
        } else {
            switch (e.op) {
                case '+':
                    emit("addq", right, result);
                    break
                case '-':
                    emit("subq", right, result);
                    break
                case '*':
                    emit("imulq", right, result);
                    break
                case '<':
                    emitComparison("setl", right, result);
                    break
                case '<=':
                    emitComparison("setle", right, result);
                    break
                case '==':
                    emitComparison("sete", right, result);
                    break
                case '!=':
                    emitComparison("setne", right, result);
                    break
                case '>=':
                    emitComparison("setge", right, result);
                    break
                case '>':
                    emitComparison("setg", right, result);
                    break
            }
        }
        return result;
    }
}

function emitLabel(label) {
    // console.log(label + ':')
    x86str += (label + ':\n');
}

function emit(op, x, y) {
    var line = '\t' + op
    if (x) line += '\t' + x
    if (y) line += ', ' + y
    // console.log(line)
    x86str += (line + '\n');
}

function emitShortCircuit(operation, expression, destination) {
    var skip = makeLabel()
    emit("cmp", "$0", destination)
    emit(operation, skip)
    var right = gen(expression.right)
    emit("mov", right, destination)
    emitLabel(skip)
}

function emitComparison(operation, right, destination) {
    emit("cmp", right, destination)
    var byteRegister = '%' + allocator.byteRegisterFor(destination.register)
    emit(operation, byteRegister)
    emit("movsbq", byteRegister, destination)
}

function emitJumpIfFalse(operand, label) {

    emit('cmpq', '$0', allocator.nonImmediate(operand))
    emit('je', label)
}


function RegisterAllocator() {
    
    this.names = ['rax', 'rcx', 'r8', 'r9', 'r10', 'r11']
    this.bindings = new HashMap()
}

RegisterAllocator.prototype.byteRegisterFor = function (registerName) {
    return ['al', 'cl', 'r8b', 'r9b', 'r10b', 'r11b'][this.names.indexOf(registerName)]
}

RegisterAllocator.prototype.makeRegisterOperand = function () {
    
    var operand = new RegisterOperand("");
    this.assignFreeRegisterTo(operand);
    return operand;
}

RegisterAllocator.prototype.makeRegisterOperandFor = function (registerName) {
    
    var existingRegisterOperand = this.bindings.get(registerName);
    if (existingRegisterOperand) {
        this.assignFreeRegisterTo(existingRegisterOperand);
        emit("movq", "%" + registerName, existingRegisterOperand);
    }
    var operand = new RegisterOperand(registerName);
    this.bindings.set(registerName, operand);
    return operand;
}

RegisterAllocator.prototype.nonImmediate = function (operand) {
    
    if (operand instanceof ImmediateOperand) {
        var newOperand = this.makeRegisterOperand();
        emit("movq", operand + ", " + newOperand);
        return newOperand;
    }
    return operand;
}

RegisterAllocator.prototype.ensureRegister = function (operand) {

    if (!(operand instanceof RegisterOperand)) {
        var newOperand = this.makeRegisterOperand();
        emit("movq", operand, newOperand);
        return newOperand;
    }
    return operand;
}

RegisterAllocator.prototype.assignFreeRegisterTo = function (registerOperand) {
    
    for (var i = 0; i < this.names.length; i++) {
        var register = this.names[i]
        if (!this.bindings.has(register)) {
            this.bindings.set(register, registerOperand);
            registerOperand.register = register;
            return;
        }
    }
    throw new Error("No more registers available")
}

RegisterAllocator.prototype.freeAllRegisters = function () {
    this.bindings.clear()
}

var allocator = new RegisterAllocator()


function ImmediateOperand(value) {
    this.value = value
}

ImmediateOperand.prototype.toString = function () {
    return '$' + this.value
}

function RegisterOperand(register) {
    this.register = register
}

RegisterOperand.prototype.toString = function () {
    return '%' + this.register
}

function MemoryOperand(variable) {
    this.variable = variable
}

MemoryOperand.prototype.toString = function () {
    return this.variable + '(%rip)'
}