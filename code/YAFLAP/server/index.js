const express = require('express')
const path = require('path')

var app = express()

app.use(express.static('./static'))

app.get('/parser', function (req, res) {
  res.sendFile(path.resolve(__dirname, './static/html/parser.html'))
})

app.get('/automata', function (req, res) {
  res.sendFile(path.resolve(__dirname, './static/html/automata.html'))
})

app.listen(10086)
