<template> 
<div class="parser-panel">
  <header class="header">
    <h1>Iki Language</h1>
    <h3>Parsing Tree, Token List and Symbol Table</h3>
  </header>
  <multipane class="multipane" layout="vertical">
    <div :style="{ width: '50%', minWidth: '30%', maxWidth: '70%' }" class="pane editor">
      <codemirror
        style="height: 100%;"
        ref="code-editor"
        :value="code"
        :options="codeMirrorOptions"
        @input="handleInput">
      </codemirror>
    </div>
    <multipane-resizer></multipane-resizer>
    <div class="pane content" :style="{ width: '50%', minWidth: '30%', maxWidth: '70%', flexGrow: 1 }">
      <div class="switching-panel-buttons">
        <button @click="showPanel = 'token-list'">Show Token List</button>
        <button @click="showPanel = 'ast'">Show AST</button>
        <button @click="showPanel = 'symbol-table'">Show Symbol Table</button>
      </div>
      <div class ="error-panel" v-show="!matchSucceeded">
        <h3 class="title">ERROR</h3>
        {{ errorMessage }}
      </div>
      <div v-show="matchSucceeded && showPanel === 'token-list'" id="token"></div>
      <div v-show="matchSucceeded && showPanel === 'ast'" id="ast">
        {{ this.ast.toString() }}
      </div>
      <div v-show="matchSucceeded && showPanel === 'symbol-table'" id="symbol-table"></div>
    </div>
  </multipane>
  <a @click="loadSimpleExample" href="javascript:void(0);">Load Simple Example</a>
  <a @click="loadExampleWithLoop" href="javascript:void(0);">Load Example with Loop</a>
  <a @click="loadSyntaxErrorExample" href="javascript:void(0);">Load Syntax Error Example</a>
  <a @click="loadSemanticErrorExample" href="javascript:void(0);">Load Semantic Error Example</a>
</div>
</template>
<script>
import { Multipane, MultipaneResizer } from 'vue-multipane'
import { tree } from 'vued3tree'
import { codemirror } from 'vue-codemirror'
import { grammars, sematics } from '../iki-parser/iki'
import { flattenDeep } from 'lodash'

import {
  getSemanticErrors,
  getSemanticErrorsCount,
  getAnalysisContextAncestor,
  VariableDeclaration,
  Block
} from '../iki-parser/ast'
import { ohm } from 'ohm-js'
import $ from 'jquery'

import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/base16-light.css'

export default {
  name: 'parser-panel',
  data () {
    return {
      code: '',
      errorMessage: undefined,
      ast: '',
      tokenList: '',
      symbolList: '',
      showPanel: '',
      analysisContext: undefined,
      codeMirrorOptions: {
        lineNumbers: true,
        line: true,
        theme: 'base16-light'
      }
    }
  },
  created () {
    this.$grammar = grammars;
    this.$sematics = sematics;
  },
  methods: {
    handleInput (code) {
      this.code = code;
      this.errorMessage = undefined;
      if (code.length === 0) return;
      var matchResult = this.$grammar.match(code)
      if (matchResult.succeeded()) {
        this.setupAstData(matchResult);
        this.setupTokenListData(matchResult);
        this.setupSematicAnalysisContext(matchResult);

        // Some dirty code here, render things with jQuery...
        this.buildTokenList('token', this.tokenToString(this.tokenList))
        this.showSymbolTable(this.analysisContext, '#symbol-table')
      } else {
        this.errorMessage = new SyntaxError(matchResult.message)
      }
    },
    setupAstData (matchResult) {
      this.ast = this.$sematics(matchResult).ast()
    },
    setupTokenListData (matchResult) {
      this.tokenList = flattenDeep(this.$sematics(matchResult).token)
    },
    setupSematicAnalysisContext (matchResult) {
      this.ast.analyze();
      if (getSemanticErrorsCount() > 0) {
        this.errorMessage = getSemanticErrors().toString()
      } else {
        this.analysisContext = getAnalysisContextAncestor()
      }
    },
    getSymbolTable (analysisContext) {
      var result = []

      function getTable (analysisContext, initialArray) {
        initialArray = initialArray.concat(Object.values(analysisContext.symbolTable))
        var subContexts = analysisContext.sons
        for (var subContext of subContexts) {
          initialArray = initialArray.concat(getTable(subContext, []))
        }
        return initialArray
      }

      return getTable(analysisContext, [])
    },
    treeShow (id, what) {
      if (!(what instanceof Node)) {
          what = document.createTextNode('' + what);
      }
      var div = document.getElementById(id);
      while (div.firstChild) {
          div.removeChild(div.firstChild);
      }
      div.appendChild(what);
    },
    buildTokenList (id, s) {
      var f = document.getElementById(id);
      this.removeChildren(f);
      var arr = s.split(' ');
      for (var i = 0; i < arr.length; i++) {
          var t = document.createElement('div');
          var txt = document.createTextNode(arr[i]);
          t.appendChild(txt);
          t.classList.add('tokenListItem');
          f.appendChild(t);
      }
    },
    tokenToString (x) {
      return Array.isArray(x)
        ? x.map(this.tokenToString).join(' ')
        : x.toString();
    },
    showSymbolTable (p, sel) {
      var div = $(sel)
      div.html('');
      this.buildSymbolTable(p.sons[0], div);
    },
    buildSymbolTable (p, div) {
        var map = p.symbolTable;
        if (Object.keys(map).length !== 0) {
          for (var key in map) {
              var tag = $('<div class="symbolTag"></div>').text(key + " : " + map[key]);
              div.append(tag);
          }
        }
        if (p.sons.length === 0) {
            return;
        } else {
            for (var i = 0; i < p.sons.length; i++) {
                var tmp = $('<div class="symbolDiv"></div>');
                div.append(tmp);
                this.buildSymbolTable(p.sons[i], tmp);
            }
        }
    },
    removeChildren (element) {
      while (element.firstChild) {
          element.removeChild(element.firstChild);
      }
    },
    loadSimpleExample () {
      this.code = `var a : int;
var b : int;
a = 3;
b = 4;
a = a + b;
      `
    },
    loadExampleWithLoop () {
      this.code = `var a : int;
var b : int;
a = 0;
b = 0;
while a < 100 loop
  a = a + b;
  a = a + 1;
end;
      `
    },
    loadSyntaxErrorExample () {
      this.code = `int a = 3;`
    },
    loadSemanticErrorExample () {
      this.code = `var a : bool;
var b : int;
a = true;
b = 3;
a = a + b;
      `
    }
  },
  computed: {
    matchSucceeded () {
      return this.errorMessage === undefined
    }
  },
  components: { Multipane, MultipaneResizer, codemirror, tree }
}
</script>
<style>
.multipane {
  height: 400px;
  width: 100%;
  position: relative;
}

.header {
  height: 15vh;
  width: 100%;
  display: flex;
}

.parser-panel {
  margin: 0 auto;
  width: 90%;
  height: 600px;
}
.pane {
  border: 1px solid grey;
  overflow: scroll;
}

.multipane .multipane-resizer {
  margin: 0; left: 0; /* reset default styling */
  width: 5px;
  background: black;
}

.error-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 1px white solid;
  background-color: grey;
  box-shadow: 3px 3px 0px black;
  width: 400px;
  height: 200px;
}

.error-panel .title {
  padding: 0;
  margin: 3px;
  text-align: center;
}

#token {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
}
.tokenListItem {
  margin: 5px 10px;
  border: 1px solid white;
  box-shadow: 1px 1px 0px black;
  color: white;
  background: grey;
  padding: 5px;
}

#symbol-table {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
}

.symbolTag {
  margin: 5px 10px;
  border: 1px solid white;
  box-shadow: 1px 1px 0px black;
  color: white;
  background: grey;
  padding: 5px;
}
.switching-panel-buttons {
  box-sizing: border-box;
  height: 60px;
  padding: 3px;
  background: #eeeeee;
  border-bottom: 3px solid black;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;
}

.switching-panel-buttons > button {
  margin-left: 10px;
  height: 70%;
  background-color: #cccccc;
  border: 1px solid whitesmoke;
  box-shadow: 2px 2px 0 #000000;
  outline: transparent;
}
.switching-panel-buttons > button:hover {
  background-color: #eeeeee;
}
.switching-panel-buttons > button:active {
  box-shadow: 1px 1px 0 #000000;
  background-color: #eeeeee;
}
</style>
<style>

.CodeMirror {
  border: 1px solid #eee;
  height: auto;
}
</style>

