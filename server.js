const express = require('express')
const app = express()
const path = require('path')
const port = 3000
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const session = require('express-session')

const ObjectID = require('mongodb').ObjectID

const MONGOURL = 'mongodb://localhost:27017/landr'  

//https://blog.usejournal.com/easiest-backend-authentication-using-express-mongodb-and-postman-86997c945f18

mongoose.connect(MONGOURL, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('DB connected'))
    .catch(error => console.log(error))

const { User } = require('./models/user')
const { Room } = require('./models/room')

app.use(bodyParser.urlencoded({
    extended: true
})); //fixes empty req.body issue
app.use(bodyParser.json())
app.use(session({ secret: 'ppUTPhWGRr' })) //must be before any usages of 'session'

app.use('/public', express.static('public')) //TODO: working here??

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')

app.listen(port, () => console.log(`App listening on port ${port}!`))

app.get('/', (req, res) => {
    res.render(__dirname + '/public/views/generallayout.ejs', {
        uid: req.session.uid,
        username: req.session.username,
        viewname: __dirname + '/public/views/index.html'
    })
})

app.get('/login', (req, res) => {
    if (req.session.username) {
        res.send('User ' + req.session.username + ' already logged in')
    }
    else {
        res.render(__dirname + '/public/views/generallayout.ejs', {
            uid: req.session.uid,
            username: req.session.username,
            viewname: __dirname + '/public/views/login.html'
        })
    }
})

app.get('/register', (req, res) => {
    res.render(__dirname + '/public/views/generallayout.ejs', {
        uid: req.session.uid,
        username: req.session.username, //unnecessary but standard
        viewname: __dirname + '/public/views/register.html'
    })
})

app.get('/logout', (req, res) => {
    req.session.uid = null
    req.session.username = null
    req.session.save()
    res.render(__dirname + '/public/views/generallayout.ejs', {
        uid: req.session.uid,
        username: req.session.username,
        viewname: __dirname + '/public/views/index.html'
    })
})

app.get('/newroom_dialog', (req, res) => {
    res.render(__dirname + '/public/views/generallayout.ejs', {
        username: req.session.username,
        viewname: __dirname + '/public/views/newroom.html'
    })
})

app.post('/createroom', (req, res) => {
    //TODO:
    const room = new Room({
        name: req.body.room_name,
        description: req.body.room_description,
        //TODO: set room owner
        owner: ObjectID(req.session.uid)
    })
    room.save((err, response) => {
        if (err) {
            res.status(400).send(err)
        }
        else {
            //TODO: update this to go to new room
            res.render(__dirname + '/public/views/generallayout.ejs', {
                username: req.session.username,
                viewname: __dirname + '/public/views/index.html'
            })
        }
    })
})

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
            req.session.username = user.username
            req.session.save() //need to manually save if nothing is sent back
            res.render(__dirname + '/public/views/generallayout.ejs', {
                uid: req.session.uid,
                username: req.session.username,
                viewname: __dirname + '/public/views/index.html'
            })
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
                req.session.uid = user._id
                req.session.username = user.username
                req.session.save() //need to manually save if nothing is sent back
                res.render(__dirname + '/public/views/generallayout.ejs', {
                    uid: req.session.uid,
                    username: req.session.username,
                    viewname: __dirname + '/public/views/index.html'
                })
            })
        }
    })
}) 

app.get('/guest', (req, res) => {
    const user = new User({
        username: 'guest' + Math.floor(Math.random() * 1000000000),
        password: 'password'
    })
    user.save((err, response) => {
        if (err) {
            res.status(400).send(err)
        }
        else {
            req.session.uid = user._id
            req.session.username = user.username
            req.session.save() //need to manually save if nothing is sent back
            res.render(__dirname + '/public/views/generallayout.ejs', {
                uid: req.session.uid,
                username: req.session.username,
                viewname: __dirname + '/public/views/index.html'
            })
        }
    })
}) 


require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: '+ add + ':' + port);
})