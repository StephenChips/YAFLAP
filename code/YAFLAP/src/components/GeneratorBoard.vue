<template>
  <div class="generator-board">
    <header class="header">
      <h4 class="title">Generator board</h4>
      <button class="action-button" id="goto-automata-page" @click="$router.push('/')">Go to automata page</button>
    </header>
    <div class="content">
      <div class="action-area">
        <button class="action-button" @click="generateNFA">generate NFA</button>
        <button class="action-button" @click="generateDFA">generate DFA</button>
        <input
          placeholder="Enter your regular expression here ..."
          class="action-input"
          type="text"
          :value="regexStr"
          @input="_handleInput"
        />
      </div>
      <div class="error-prompt">{{ errorPrompt }}</div>
      <div class="divider"></div>
      <div class="graph-wrapper">
      </div>
    </div>
  </div>
</template>

<script>
import { toDotScript } from '../fsm/dot-converter'
import { RegParser } from '../fsm/regparser'
import Viz from 'viz.js'
import { Module, render } from 'viz.js/full.render.js'
import svgPanZoom from 'svg-pan-zoom'

export default {
    name: 'generator-board',
    mounted () {
        this.$graphMountPoint = document.getElementsByClassName('graph-wrapper')[0]
        this.$graph = undefined
        this.$viz = new Viz({ Module, render })
    },
    data () {
        return {
            regexStr: '',
            errorPrompt: ''
        }
    },
    methods: {
        generateNFA (regexStr) {
            this.generateFSM(regexStr, 'nfa')
        },
        generateDFA (regexStr) {
            this.generateFSM(regexStr, 'dfa')
        },
        generateFSM (regexStr, type) {
            try {
                var parser = new RegParser(this.regexStr)
                var fsm = type === 'dfa' ? parser.parseToDFA() : parser.parseToNFA()
                var dotScript = toDotScript(fsm)
                this.$viz.renderSVGElement(dotScript)
                  .then(el => {
                    this.$graph = el
                    this.$graphMountPoint.innerHTML = ''
                    this.$graphMountPoint.appendChild(el)
                    this._setupGraphStyle();
                  })
            } catch (e) {
              console.log(e)
              this.errorPrompt = e.message
            }
        },
        _handleInput (event) {
          this.errorPrompt = ''
          this.regexStr = event.target.value
        },
        _setupGraphStyle () {
          console.log(this.$graph)
          this.$graph.setAttribute('width', '100%')
          this.$graph.setAttribute('height', '100%')
          this.$graph.classList.add('fsm-graph')
          svgPanZoom(this.$graph, {
            controlIconsEnabled: true
          })
        }
    }
}
</script>

<style scoped>
.content {
    width: 960px;
    margin: 10px auto;
    background-color: #E4E4E4;
    border: 5px solid rgb(102, 38, 38);
    border-radius: 5px;
}
.title {
    text-align: center;
    width: 500px;
    margin: 0 auto;
    padding: 5px;
}

.header {
    width: 960px;
    margin: 0 auto;
    position: relative;
}

.action-area {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-top: 25px;
    margin: 10px 5px;
}

.action-button {
    flex-shrink: 0;
    flex-grow: 0;
    margin-left: 10px;
    padding: 6px 16px;
    border: 3px outset rgb(102, 38, 38);
    background-color: rgb(206, 238, 226);
    box-sizing: border-box;
    box-shadow: 3px 3px 1px black;
    font-size: 18px;
}
.action-button:hover {
    box-shadow: 3px 3px 1px #999999;
}
.action-button:active {
    box-shadow: 3px 3px 1px #999999;
    background-color: rgb(130, 100, 70);
}
.action-input {
  margin: 0 10px;
  flex-grow: 1;
  flex-shrink: 1;
  height: 40px;
  border: 3px solid rgb(102, 38, 38);
  box-shadow: 3px 3px 1px black;
  font-size: 20px;
}

.divider {
  height: 0;
  margin-top: 15px;
  border-bottom: 2px solid black;
}
button {
    border: none;
}

.graph-wrapper {
  background-color: #FFFFFF;
  width: 100%;
  height: 400px;
}
.fsm-graph {
  background-color: transparent;
  width: 400px;
  height: 100%;
  cursor: move;
}

.fsm-graph * {
  background-color: transparent;
  cursor: move;
}

.title {
  font-family: 'Courier New', Courier, monospace;
  font-size: 36px;
}

.error-prompt {
  height: 20px;
  font-size: 16px;
}

#goto-automata-page {
  position: absolute;
  left: 15px;
  top: 5px;
}
</style>
