const express = require('express')
const app = express()
const path = require('path')
const port = 3000
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const session = require('express-session')

const MONGOURL = 'mongodb://localhost:27017/landr'  

//https://blog.usejournal.com/easiest-backend-authentication-using-express-mongodb-and-postman-86997c945f18

app.get('/', (req, res) => {
    console.log(req.session)
    let user = req.session ? 'reqses' : 'no' //TODO: why no session?
    res.render(__dirname + '/views/index', {
        username: user
        //username: 'hardcodedUser'
    })
})

mongoose.connect(MONGOURL, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('DB connected'))
    .catch(error => console.log(error))

const { User } = require('./models/user')

app.use(bodyParser.urlencoded({
    extended: true
})); //fixes empty req.body issue

app.use(bodyParser.json())

app.use(session({ secret: 'ppUTPhWGRr' }))

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')

app.listen(port, () => console.log(`App listening on port ${port}!`))

app.get('/login', (req, res) => {
    console.log('username is default: ' + req.session.username)
    if (req.session.username) {
        res.send('User ' + req.session.username + ' already logged in')
    }
    else {
        console.log(req.session.username)
        res.render(__dirname + '/views/login.html')
    }
})
app.get('/register', (req, res) => res.render(__dirname + '/views/register.html'))

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
            req.session.username = user.username
            req.session.save() //need to manually save if nothing is sent back
        }
    })
}) 

app.post('/login', (req, res) => {
    User.findOne({ 'username': req.body.username }, (err, user) => {
        if (!user) {
            //TODO: unsuccessful login
            res.json({ message: 'Login failed, user not found' })
        }
        else {

            user.comparePassword(req.body.password, (err, isMatch) => {
                if (err) {
                    throw err
                }
                if (!isMatch) {
                    return res.status(400).json({message: 'Wrong password'})
                }
                res.status(200).send('Logged in successfully')
                req.session.username = user.username
                req.session.save() //need to manually save if nothing is sent back
            })

            //TODO: successful login stuff
            //res.render(__dirname + '/views/index.html')
        }
    })
}) 



require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: '+ add + ':' + port);
})
