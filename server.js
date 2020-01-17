const express = require('express')
const app = express()
const path = require('path')
const port = 3000
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const MONGOURL = 'mongodb://localhost:27017/landr'  

app.get('/', (req, res) => res.sendFile(__dirname + '/views/index.html'))

mongoose.connect(MONGOURL, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('DB connected'))
    .catch(error => console.log(error))

const { User } = require('./models/user')

app.use(bodyParser.urlencoded({
    extended: true
})); //fixes empty req.body issue

app.use(bodyParser.json())

app.listen(port, () => console.log(`App listening on port ${port}!`))

app.get('/login', (req, res) => res.sendFile(__dirname + '/views/login.html'))
app.get('/register', (req, res) => res.sendFile(__dirname + '/views/register.html'))
app.post('/login', (req, res) => res.sendFile(__dirname + '/views/index.html')) //TODO: login

app.post('/register', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    user.save((err, response) => {
        if (err) {
            res.status(400).send(err)
        }
        else {
            res.status(200).send(response)
        }
    })
}) 


require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: '+ add + ':' + port);
})