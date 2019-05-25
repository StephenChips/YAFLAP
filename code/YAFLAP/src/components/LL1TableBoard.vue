<template> 
<div class="parser-panel">
  <header class="header">
    <h1>First, Follow, Predict Sets and Analysis Table</h1>
  </header>
  <multipane class="multipane" layout="vertical">
    <div :style="{ width: '50%', minWidth: '30%', maxWidth: '70%' }" class="pane editor">
      <codemirror
        style="height: 100%;"
        ref="code-editor"
        :value="strProductionRules"
        :options="codeMirrorOptions"
        @input="handleInput">
      </codemirror>
    </div>
    <multipane-resizer></multipane-resizer>
    <div class="pane content" :style="contentPaneStyle">
      <div class="switching-panel-buttons">
        <button :class="{ active: showPanel === 'first-set' }" @click="showPanel = 'first-set'">See First Set</button>
        <button :class="{ active: showPanel === 'follow-set' }" @click="showPanel = 'follow-set'">See Follow Set</button>
        <button :class="{ active: showPanel === 'predict-set' }" @click="showPanel = 'predict-set'">See Predict Set</button>
        <button :class="{ active: showPanel === 'll1-analysis-table' }" @click="showPanel = 'll1-analysis-table'">See LL(1) Analysis Table</button>
      </div>
      <div class ="error-panel" v-show="!matchSucceeded">
        <h3 class="title">ERROR</h3>
        {{ errorMessage }}
      </div>
      <key-value-table
        v-show="showPanel === 'first-set'"
        key-title="Non-Terminators"
        value-title="First Sets"
        :list="firstSetTableData" />
      <key-value-table
        v-show="showPanel === 'follow-set'"
        key-title="Non-Terminators"
        value-title="Follow Sets"
        :list="followSetTableData" />
      <key-value-table v-show="showPanel === 'predict-set'"
        key-title="Production"
        value-title="Predict Sets"
        :list="predictSetTableData" />
      <two-dimension-table
        v-show="showPanel ==='ll1-analysis-table'"
        :row-title-list="terminatorList"
        :col-title-list="nonTerminatorList"
        :relationships="analysisTableData" />
    </div>
  </multipane>
  <a @click="loadSimpleArithmeticExpressionGrammar" href="javascript:void(0);">Load Example of Simple Arithmetic Expression</a>
   <a @click="loadNestingParenthesesExample" href="javascript:void(0);">Load Example of Nested </a>
</div>
</template>
<script>
import { Multipane, MultipaneResizer } from 'vue-multipane'
import KeyValueTable from './KeyValueTable.vue'
import TwoDimensionTable from './TwoDimensionTable.vue'
import { codemirror } from 'vue-codemirror'
import { grammars, sematics } from '../iki-parser/iki'
import { grammarTextToGrammarStructure } from '../iki-parser/ast-convert'
import { flattenDeep } from 'lodash'
import { Grammar } from 'first-follow'

import {
  getSemanticErrors,
  getSemanticErrorsCount,
  getAnalysisContextAncestor
} from '../iki-parser/ast'
import { ohm } from 'ohm-js'

import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/base16-light.css'

export default {
  name: 'parser-panel',
  data () {
    return {
      strProductionRules: '',
      errorMessage: undefined,
      
      terminatorList: [],
      nonTerminatorList: [],
      firstSetTableData: [],
      followSetTableData: [],
      predictSetTableData: [],
      analysisTableData: {},

      showPanel: 'first-set',
      codeMirrorOptions: {
        lineNumbers: true,
        line: true,
        theme: 'base16-light'
      },
      contentPaneStyle: {
        width: '50%',
        minWidth: '30%',
        maxWidth: '70%',
        flexGrow: 1,
        overflow: 'scroll'
      }
    }
  },
  created () {
    this.$grammar = grammars;
    this.$sematics = sematics;
  },
  methods: {
    handleInput (strProductionRules) {
      try {
        this.errorMessage = undefined
        this.calculateLL1Tables(strProductionRules)
      } catch (e) {
        this.errorMessage = e.message;
        throw e
      }
    },
    calculateLL1Tables (strProductionRules) {
      var grammar = grammarTextToGrammarStructure(strProductionRules)
      if (grammar.length === 0) {
        return
      }
      var tableGenerator = new Grammar(grammar)
      var predictSet = tableGenerator.getPredictSets()
      var firstSet = tableGenerator.getFirstSets()
      var followSet = tableGenerator.getFollowSets()
      console.log(followSet)
      var analysisTable = this.getAnalysisTable(grammar, predictSet)
      var symbolSet = this.getSymbolSet(grammar)

      this.terminatorList = symbolSet.terminatorList
      this.nonTerminatorList = symbolSet.nonTerminatorList
      this.predictSetTableData = this.transformPredictSet(predictSet)
      this.firstSetTableData = this.transformFirstSet(firstSet)
      this.followSetTableData = this.transformFollowSet(followSet)
      this.analysisTableData = this.transformAnalysisTable(analysisTable)

      // this.showLLAnalyticalTable('ll-analyse-table', Init.left, InitGrammar.getPredictSets())
    },
    transformPredictSet (predictSet) {
      var result = []
      var dict = new Map([['\u0000', 'EOF']])
      for (var key in predictSet) {
        result.push({
          key: key,
          value: this.replaceArrayItem(predictSet[key], dict).join(', ')
        })
      }
      return result
    },
    transformFollowSet (followSet) {
      var result = []
      var dict = new Map([[null, 'ε'], ['\u0000', 'EOF']])
      for (var nonTerminator in followSet) {
        result.push({
          key: nonTerminator,
          value: this.replaceArrayItem(followSet[nonTerminator], dict).join(', ')
        })
      }
      return result
    },
    transformFirstSet (firstSet) {
      var result = []
      var dict = new Map([[null, 'ε']])
      for (var nonTerminator in firstSet) {
        result.push({
          key: nonTerminator,
          value: this.replaceArrayItem(firstSet[nonTerminator], dict).join(', ')
        })
      }
      return result
    },
    transformAnalysisTable (analysisTable) {
      var result = {}
      for (var nonTerminator in analysisTable) {
        result[nonTerminator] = {}
        for (var terminator in analysisTable[nonTerminator]) {
          result[nonTerminator][terminator] = analysisTable[nonTerminator][terminator].join(', ')
        }
      }
      return result
    },
    replaceArrayItem (arr, dict) {
      return arr.map(function (value) {
        return dict.has(value) ? dict.get(value) : value
      })
    },
    getAnalysisTable (grammar, predictSet) {
      var analysisTable = {}
      for (var productionId in predictSet) {
        var productionIndex = productionId - 1
        var nonTerminator = grammar[productionIndex].left
        var predictSetOfProduction = predictSet[productionId]
        if (!analysisTable[nonTerminator]) {
          analysisTable[nonTerminator] = {}
        }
        for (var terminator of predictSetOfProduction) {
          if (!analysisTable[nonTerminator][terminator]) {
            analysisTable[nonTerminator][terminator] = []
          }
          analysisTable[nonTerminator][terminator].push(productionId)
        } 
      }
      return analysisTable
    },
    getSymbolSet (grammar) {
      var terminatorSet = new Set()
      var nonTerminatorSet = new Set()

      for (var production of grammar) {
        nonTerminatorSet.add(production.left)
      }

      for (var production of grammar) {
        for (var rhsSymbol of production.right) {
          if (!nonTerminatorSet.has(rhsSymbol) && rhsSymbol !== null) {
            terminatorSet.add(rhsSymbol)
          }
        }
      }

      return {
        terminatorList: Array.from(terminatorSet),
        nonTerminatorList: Array.from(nonTerminatorSet)
      }
    },
    loadSimpleArithmeticExpressionGrammar () {
      this.strProductionRules =
`Expr -> Term ExprLeft;
ExprLeft -> plus term ExprLeft
         | subtract term ExprLeft
         | ε
         ;
Term     -> Factor TermLeft;
TermLeft -> multiply Factor TermLeft
         |  divide Factor TermLeft
         | ε
         ;
Factor -> subtract Factor
         |  Real
         | leftParenthesis Expr rightParenthesis
         ;
Real -> number;
`
    },
    loadNestingParenthesesExample () {
      this.strProductionRules =  `
Start -> StartLeft;
StartLeft -> leftParenthesis StartLeft rightParenthesis
      | ε
      ;
`
    }
  },
  computed: {
    matchSucceeded () {
      return this.errorMessage === undefined
    }
  },
  components: { Multipane, MultipaneResizer, codemirror, KeyValueTable, TwoDimensionTable }
}
</script>
<style>
.multipane {
  height: 500px;
  width: 100%;
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
}

.multipane .multipane-resizer {
  margin: 0; left: 0; /* reset default styling */
  width: 5px;
  background: black;
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
.switching-panel-buttons > button.active {
  background-color:antiquewhite;
}

.CodeMirror {
  border: 1px solid #eee;
  height: auto;
}
</style>