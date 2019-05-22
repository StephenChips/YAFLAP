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
      <table v-show="showPanel === 'first-set'" id="first-sets-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Sets</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <table v-show="showPanel === 'follow-set'" id="follow-sets-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Sets</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <table v-show="showPanel === 'predict-set'" id="predict-sets-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Sets</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <table v-show="showPanel === 'll1-analysis-table'" id="ll-analyse-table">
          <thead>
          <tr></tr>
          </thead>
          <tbody></tbody>
      </table>
    </div>
  </multipane>
  <a @click="loadSimpleArithmeticExpressionGrammar" href="javascript:void(0);">Load Example of Simple Arithmetic Expression</a>
   <a @click="loadNestingParenthesesExample" href="javascript:void(0);">Load Example of Nested </a>
</div>
</template>
<script>
import { Multipane, MultipaneResizer } from 'vue-multipane'
import { codemirror } from 'vue-codemirror'
import { grammars, sematics } from '../iki-parser/iki'
import { grammarTextToGrammarStructure } from '../iki-parser/ast-convert'
import { flattenDeep } from 'lodash'
import { Grammar } from 'first-follow'
import $ from 'jquery'

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
      firstSet: {},
      followSet: {},
      predictSet: {},
      analysisTable: {},
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
      }
    },
    calculateLL1Tables (strProductionRules) {
      var Init = grammarTextToGrammarStructure(strProductionRules)
      var InitGra = Init.grammar
      if (InitGra.length === 0) return
      var InitGrammar = new Grammar(InitGra)
      this.predictSet = InitGrammar.getPredictSets()
      this.firstSet = InitGrammar.getFirstSets()
      this.followSet = InitGrammar.getFollowSets()

      this.showLLSets('first-sets-table', this.firstSet)
      this.showLLSets('follow-sets-table', this.followSet)
      this.showLLSets('predict-sets-table', this.predictSet)
      console.log(Init.left, Init.grammar, InitGrammar.getPredictSets())
      this.showLLAnalyticalTable('ll-analyse-table', Init.left, InitGrammar.getPredictSets())
    },
    showLLAnalyticalTable: function (id, l, ps) {
              {
            var map = new Map(), setX = new Set(), setY = new Set();
            for (var key in ps) {
                var arr = ps[key];
                setY.add(l[key]);
                for (var i = 0; i < arr.length; i++) {
                    if (map.has(l[key])) {
                        var tmp = map.get(l[key]);
                        if (tmp.has(arr[i])) {
                            var tt = tmp.get(arr[i]);
                            tt.push(key);
                            tmp.set(arr[i], tt);
                        } else {
                            var tt = [];
                            tt.push(key);
                            tmp.set(arr[i], tt);
                        }
                    } else {
                        var tmp = new Map();
                        if (tmp.has(arr[i])) {
                            var tt = tmp.get(arr[i]);
                            tt.push(key);
                            tmp.set(arr[i], tt);
                        } else {
                            var tt = [];
                            tt.push(key);
                            tmp.set(arr[i], tt);
                        }
                        map.set(l[key], tmp);
                    }
                    setX.add(arr[i]);
                }
            }
        }
        var thtr = $('#' + id + ' thead tr');
        var tb = $('#' + id + ' tbody');
        thtr.html('');
        tb.html('');
        thtr.append('<th>#</th>');
        setX.forEach(function (keyX) {
            thtr.append('<th>' + keyX + '</th>');
        });
        setY.forEach(function (keyY) {
            var s = '<td>' + keyY + '</td>';
            setX.forEach(function (keyX) {
                var tmp = map.get(keyY);
                if (tmp.has(keyX)) {
                    var tt = tmp.get(keyX);
                    if (tt.length > 1) {
                        var str = tt[0];
                        for (var i = 1; i < tt.length; i++) {
                            str += (', ' + tt[i]);
                        }
                        s += ('<td class="warn">' + str + '</td>');
                    } else {
                        s += ('<td>' + tt[0] + '</td>')
                    }
                } else {
                    s += ('<td> </td>')
                }
            });
            tb.append('<tr>' + s + '</tr>');
        });
    },
    showLLSets: function (id, data) {
        var tb = $('#' + id + ' tbody');
        tb.html(''); //clear
        for (var key in data) {
            var s, arr = data[key];
            if (arr[0] === "\0") {
                s = 'EOF';
            } else if (arr[0] === null) {
                s = 'ε';
            } else {
                s = arr[0];
            }
            for (var i = 1; i < arr.length; i++) {
                if (arr[i] === "\0") {
                    s = s + ', EOF';
                } else if (arr[i] === null) {
                    s = s + ', ε';
                } else {
                    s = s + (', ' + arr[i]);
                }
            }
            tb.append('<tr><td>' + key + '</td><td>' + s + '</td></tr>');
        }
    },
    loadSimpleArithmeticExpressionGrammar () {
      this.strProductionRules =
`Expr -> Term ExprLeft
ExprLeft -> + term ExprLeft
         | - term ExprLeft
         | ε
Term     -> Factor TermLeft
TermLeft -> * Factor TermLeft
         |  / Factor TermLeft
         | ε
Factor -> - Factor
         |  Real
         | ( Expr )
Real -> number`
    },
    loadNestingParenthesesExample () {
      this.strProductionRules =  
` Start -> StartLeft
  StartLeft -> ( StartLeft )
        | ε
`
    }
  },
  computed: {
    matchSucceeded () {
      return this.errorMessage === undefined
    }
  },
  components: { Multipane, MultipaneResizer, codemirror }
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

table {
  box-shadow: 3px 3px 0 black;
  border-collapse: collapse;
}

th {
  padding: 10px 20px;
  border: 1px solid black; 
}

td {
  background-color: #eeeeee;
  padding-top: 5px;
  padding-bottom: 5px;
  border: 1px solid black;
}

.CodeMirror {
  border: 1px solid #eee;
  height: auto;
}
</style>
<style>

</style>

