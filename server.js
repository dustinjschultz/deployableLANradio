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

const generalScripts = require('./server_scripts/general')

const { User } = require('./models/user')
const { Room } = require('./models/room')
const { Library } = require('./models/library')
const { Song } = require('./models/song')


app.use(bodyParser.urlencoded({
    extended: true
})); //fixes empty req.body issue
app.use(bodyParser.json())
app.use(session({ secret: 'ppUTPhWGRr' })) //must be before any usages of 'session'

app.use('/public', express.static('public'))

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')

app.listen(port, () => console.log(`App listening on port ${port}!`))

app.get('/', (req, res) => {
    goToIndex(req, res)
})

app.get('/login', (req, res) => {
    if (req.session.username) {
        res.send('User ' + req.session.username + ' already logged in')
    }
    else {
        goTo(req, res, '/public/views/login.html')
    }
})

app.get('/register', (req, res) => {
    goTo(req, res, '/public/views/register.html')
})

app.get('/logout', (req, res) => {
    req.session.uid = null
    req.session.username = null
    req.session.save()
    goToIndex(req, res)
})

app.get('/newroom_dialog', (req, res) => {
    goTo(req, res, '/public/views/newroom.html')
})

app.post('/createroom', (req, res) => {
    const room = new Room({
        name: req.body.room_name,
        description: req.body.room_description,
        owner: ObjectID(req.session.uid)
    })

    User.findOne({ _id: ObjectID(req.session.uid) }, (err, user) => {
        if (!user) {
            res.json({ message: 'You need to be logged in to make a room' })
        }
        else {
            user.rooms.push(room)
            user.save()
        }
    })

    room.save((err, response) => {
        if (err) {
            res.status(400).send(err)
        }
        else {
            //TODO: update this to go to new room
            goToIndex(req, res)
        }
    })
})

app.post('/register', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    const library = new Library({
        owner: user._id
    })
    user.save((err, response) => {
        if (err) {
            res.status(400).send(err)
        }
        else {
            library.save()
            req.session.username = user.username
            req.session.save() //need to manually save if nothing is sent back
            goToIndex(req, res)
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
                goToIndex(req, res)
            })
        }
    })
}) 

app.get('/dev_login', (req, res) => {
    User.findOne({ 'username': 'dev' }, (err, user) => {
        if (!user) {
            res.json({ message: 'Dev not found' })
        }
        else {
            user.comparePassword('password', (err, isMatch) => {
                if (err) {
                    throw err
                }
                if (!isMatch) {
                    return res.status(400).json({ message: 'Wrong password' })
                }
                req.session.uid = user._id
                req.session.username = user.username
                req.session.save() //need to manually save if nothing is sent back
                goToIndex(req, res)
            })
        }
    })
}) 

app.get('/guest', (req, res) => {
    const user = new User({
        username: 'guest' + Math.floor(Math.random() * 1000000000),
        password: 'password'
    })
    const library = new Library({
        owner: user._id
    })
    user.save((err, response) => {
        if (err) {
            res.status(400).send(err)
        }
        else {
            library.save()
            req.session.uid = user._id
            req.session.username = user.username
            req.session.save() //need to manually save if nothing is sent back
            goToIndex(req, res)
        }
    })
}) 

app.get('/join_room', (req, res) => {
    goTo(req, res, '/public/views/room.html', {room_id: req.query.room_id})
})

app.get('/library', (req, res) => {
    generalScripts.getLibrary(req.session.uid).then(function (library) {
        goTo(req, res, '/public/views/library.html', {library: library})
    })
})

app.get('/newitem', (req, res) => {
    goTo(req, res, '/public/views/newitem.html')
})

app.post('/new-song', (req, res) => {
    var link = req.body.link
    var type = generalScripts.identifySongType(link)
    const song = new Song({
        format: type,
        link: link,
        name: req.body.name,
        notes: req.body.notes
    })
    song.save((err, response) => {
        if (err) {
            res.status(400).send(err)
        }
        else {
            generalScripts.getLibrary(req.session.uid).then(function (library) {
                library.songs.push(song)
                library.save()
                goTo(req, res, '/public/views/library.html', {library: library })
            })
        }
    })
})

app.post('/new-playlist', (req, res) => {
    //TOOD:
    console.log('new-playlist')
    goTo(req, res, '/public/views/library.html')
})

function goToIndex(req, res) {
    generalScripts.getRooms().then(function (gotRooms) {
        res.render(__dirname + '/public/views/generallayout.ejs', {
            rooms: gotRooms,
            uid: req.session.uid,
            username: req.session.username,
            server_utils: generalScripts,
            viewname: __dirname + '/public/views/index.html'
        })
    })
}

function goTo(req, res, destination, options) {
    res.render(__dirname + '/public/views/generallayout.ejs', {
        uid: req.session.uid,
        username: req.session.username,
        server_utils: generalScripts,
        viewname: __dirname + destination,
        options: options
    })
}


require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: '+ add + ':' + port);
})