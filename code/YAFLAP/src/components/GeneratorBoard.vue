<template>
    <div class="generator-board">
        <header class="header">
            <h4 class="title">Generator board</h4>
            <div class="seperator"></div>
            <button @click="$router.push('/')">Go to automata page</button>
        </header>
        <div class="content">
            <div class="action-area">
                <div>
                    <button class="action-button" @click="generateNFA">generate NFA</button>
                    <button class="action-button" @click="generateDFA">generate DFA</button>
                </div>
                <input type="text" v-model="regexStr"/>
            </div>
            <div class="regex-str">{{ regexStr }}</div>
            <div class="graph-wrapper">
                <div>{{ ds }}</div>
                <svg id="fsm-graph">
                </svg>
            </div>
        </div>
    </div>
</template>

<script>
import { toDotScript } from '../fsm/dot-converter'
import { RegParser } from '../fsm/regparser'
import Viz from 'viz.js'
import { Module, render } from 'viz.js/full.render.js'

export default {
    name: 'generator-board',
    mounted () {
        this.$graphEl = document.getElementById('fsm-graph')
        this.$viz = new Viz({ Module, render })
    },
    data () {
        return {
            regexStr: '',
            ds: ''
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
                      this.$graphEl.innerHTML = ''
                      this.$graphEl.appendChild(el)
                  })
            } catch (e) {
                console.log(e)
                // omit for now
            }
        },
        centerGraph () {
            // No impl
        }
    }
}
</script>

<style scoped>
.content {
    width: 960px;
    height: 90vh;
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
}

.action-button-area {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-top: 25px;
}

.action-button {
    padding: 9px 16px;
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

button {
    border: none;
}
</style>
