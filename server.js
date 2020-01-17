const express = require('express')
const app = express()
const path = require('path')
const port = 3000

app.get('/', (req, res) => res.sendFile(__dirname + '/views/index.html'))

app.listen(port, () => console.log(`App listening on port ${port}!`))

app.get('/login', (req, res) => res.sendFile(__dirname + '/views/login.html'))
app.post('/login', (req, res) => res.sendFile(__dirname + '/views/index.html')) //TODO: login

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: '+ add + ':' + port);
})