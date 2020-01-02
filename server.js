const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Dud test'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: '+add + ':' + port);
})