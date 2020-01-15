const express = require('express')
const app = express()
const path = require('path')
const port = 3000

app.get('/', (req, res) => res.sendFile(__dirname + '/views/index.html'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

app.post('/login', function (req, res) {
    console.log(`landr login`)
})

app.get('/loginpage', (req, res) => res.sendFile(__dirname + '/views/login.html'))

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: '+ add + ':' + port);
})