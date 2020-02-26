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
const { Play } = require('./models/play')
const { Playlist } = require('./models/playlist')
const { PlaylistElement } = require('./models/playlistelement')
const { Tag } = require('./models/tag')


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
    req.session.room_id = null
    req.session.save()
    goToIndex(req, res)
})

app.get('/newroom_dialog', (req, res) => {
    goTo(req, res, '/public/views/newroom.html')
})

app.post('/createroom', (req, res) => {
    getInitPlay().then(function (initPlay) {
        const room = new Room({
            name: req.body.room_name,
            description: req.body.room_description,
            owner: ObjectID(req.session.uid),
            firstPlayId: initPlay,
            currentPlayId: initPlay,
            deepestPlayId: initPlay
        })

        User.findOne({ _id: ObjectID(req.session.uid) }, (err, user) => {
            if (!user) {
                res.json({ message: 'You need to be logged in to make a room' })
            }
            else {
                user.roomIds.push(room)
                user.save()
            }
        })

        room.save((err, response) => {
            if (err) {
                res.status(400).send(err)
            }
            else {
                //functionally slightly different from /join_room since this is not a GET request, URL will be different
                generalScripts.getLibrary(req.session.uid).then(function (library) {
                    generalScripts.getLibraryContents(library).then(function (contents) {
                        var songs = contents.songs
                        req.session.room_id = req.query.room_id
                        req.session.save() //need to manually save if nothing is sent back
                        goTo(req, res, '/public/views/room.html', {
                            room_id: room._id,
                            songs: songs,
                            library: library._id,
                            name: room.name,
                            description: room.description
                        })
                    })
                })
            }
        })
    })
    
})

app.post('/register', (req, res) => {
    register(req, res, req.body.username, req.body.password)
}) 

app.post('/login', (req, res) => {
    login(req, res, req.body.username, req.body.password)
}) 

app.get('/dev_login', (req, res) => {
    login(req, res, 'dev', 'password')
}) 

app.get('/guest', (req, res) => {
    register(req, res, 'guest' + Math.floor(Math.random() * 1000000000), 'password')
}) 

app.get('/join_room', (req, res) => {

    var room_id = req.query.room_id ? req.query.room_id : req.session.room_id

    if (!room_id) {
        goToIndex(req, res)
        return;
    }

    generalScripts.getLibrary(req.session.uid).then(function (library) {
        generalScripts.getLibraryContents(library).then(function (contents) {
            var songs = contents.songs
            generalScripts.getRoom(room_id).then(function (room) {
                req.session.room_id = room_id
                req.session.save() //need to manually save if nothing is sent back
                goTo(req, res, '/public/views/room.html', {
                    room_id: room_id,
                    songs: songs,
                    library: library ? library._id : null,
                    name: room.name,
                    description: room.description
                })
            })
            
        })
    })
})

app.get('/library', (req, res) => {
    generalScripts.getLibrary(req.session.uid).then(function (library) {
        generalScripts.getLibraryContents(library).then(function (contents) {
            goTo(req, res, '/public/views/library.html', { library: library, songs: contents.songs, playlists: contents.playlists, tags: contents.tags, playlistelements: contents.playlistelements })
        })
    })
})

app.get('/newitem', (req, res) => {
    goTo(req, res, '/public/views/newitem.html')
})

app.post('/new-song', (req, res) => {
    var link = req.body.link
    var type = generalScripts.identifySongType(link)
    generalScripts.getSongDuration('youtube', link).then(function (duration) {
        const song = new Song({
            format: type,
            link: link,
            name: req.body.name,
            notes: req.body.notes,
            duration: duration
        })
        song.save((err, response) => {
            if (err) {
                res.status(400).send(err)
            }
            else {
                generalScripts.getLibrary(req.session.uid).then(function (library) {
                    library.songIds.push(song._id) 
                    library.save()
                    generalScripts.getLibraryContents(library).then(function (contents) {
                        goTo(req, res, '/public/views/library.html', { library: library, songs: contents.songs, playlists: contents.playlists, tags: contents.tags, playlistelements: contents.playlistelements })
                    })
                })
            }
        })
    })
})

app.post('/new-playlist', (req, res) => {

    const playlist = new Playlist({
        name: req.body.name,
        notes: req.body.notes
    })
    playlist.save((err, response) => {
        if (err) {
            res.status(400).send(err)
        }
        else {
            generalScripts.getLibrary(req.session.uid).then(function (library) {
                library.playlistIds.push(playlist._id)
                library.save()
                generalScripts.getLibraryContents(library).then(function (contents) {
                    goTo(req, res, '/public/views/library.html', { library: library, songs: contents.songs, playlists: contents.playlists, tags: contents.tags, playlistelements: contents.playlistelements })
                })
            })
        }
    })
})

app.post('/submit-song', (req, res) => {
    const play = new Play({
        songId: req.body.songId,
        submitterId: req.session.uid,
        startTime: null
    })
    play.save((err, response) => {
        if (err) {
            res.status(400).send(err)
        }
        else {
            Room.findOne({ _id: ObjectID(req.body.roomId) }, (err, room) => {
                appendPlayToRoom(play, room).then(function () {
                    res.status(200).send({ appended: true })
                })
            })
        }
    })
})

app.post('/get-room-update', (req, res) => {
    generalScripts.getRoom(req.body.roomid).then(function (room) {
        generalScripts.getPlay(room.currentPlayId).then(function (curPlay) {

            if (typeof curPlay.nextPlayId !== 'undefined') { //if there's a next play set
                generalScripts.getPlay(curPlay.nextPlayId).then(function (nextPlay) {
                    res.status(200).send({ curPlay: curPlay, nextPlay: nextPlay })
                })
            }
            else {
                res.status(200).send({ curPlay: curPlay, nextPlay: null })
            }

        })
    })
})

app.post('/propose-room-update', (req, res) => {
    generalScripts.getRoom(req.body.roomid).then(function (room) {
        checkRoomQueueShift(room).then(function (result) {
            if (result) {
                shiftRoomQueue(room)
            }
            res.status(200).send({ proposalValid: result })
        })
    })
})

app.post('/get-song', (req, res) => {
    generalScripts.getSong(req.body.songId).then(function (song) {
        res.status(200).send({ song: song })
    })
})

function goToIndex(req, res) {
    generalScripts.getRooms().then(function (gotRooms) {
        res.render(__dirname + '/public/views/generallayout.ejs', {
            rooms: gotRooms,
            uid: req.session.uid,
            username: req.session.username,
            server_utils: generalScripts,
            viewname: __dirname + '/public/views/index.html',
            options: null
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

function register(req, res, username, password) {
    const user = new User({
        username: username,
        password: password
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
}

function login(req, res, username, password) {
    User.findOne({ 'username': username }, (err, user) => {
        if (!user) {
            res.json({ message: 'User not found' })
        }
        else {
            user.comparePassword(password, (err, isMatch) => {
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
}

function appendPlayToRoom(play, room) {
    return new Promise(function (resolve, reject) {
        Play.findOne({ _id: ObjectID(room.deepestPlayId) }, (err, oldDeepestPlay) => {
            oldDeepestPlay.nextPlayId = play._id
            play.prevPlayId = oldDeepestPlay._id
            room.deepestPlayId = play._id
            room.save()
            play.save()
            oldDeepestPlay.save().then(function () {
                checkRoomQueueShift(room).then(function (result) {
                    if (result) {
                        shiftRoomQueue(room)
                    }
                    return resolve()
                })
            })
        })
    })
}

function getInitPlay() {
    return new Promise(function (resolve, reject) {
        Song.findOne({ name: 'INIT SONG' }, (err, song) => {
            if (!song) {
                res.json({ message: 'Could not find the INIT SONG' })
            }
            else {
                User.findOne({ 'username': 'INIT SONG HOLDER' }, (err, user) => {
                    if (!user) {
                        res.json({ message: 'INIT SONG HOLDER not found' })
                    }
                    else {
                        const play = new Play({
                            songId: song._id,
                            submitterId: user._id,
                            startTime: new Date(Date.now()).toISOString()
                        })
                        play.save((err, response) => {
                            if (err) {
                                res.status(400).send(err)
                            }
                            else {
                                return resolve(play)
                            }
                        })
                    }
                })
            }
        })
    })
}

function shiftRoomQueue(room) {
    Play.findOne({ _id: ObjectID(room.currentPlayId) }, (err, curPlay) => {
        Play.findOne({ _id: ObjectID(curPlay.nextPlayId) }, (err, nextPlay) => {
            nextPlay.startTime = new Date(Date.now()).toISOString()
            room.currentPlayId = nextPlay._id
            nextPlay.save()
            room.save()
        })
    })
}

function checkRoomQueueShift(room) {
    return new Promise(function (resolve, reject) {
        Play.findOne({ _id: ObjectID(room.currentPlayId) }, (err, curPlay) => {

            if (!curPlay.nextPlayId) {
                return resolve(false)
            }

            Song.findOne({ _id: ObjectID(curPlay.songId) }, (err, song) => {
                var time = curPlay.startTime
                time.setSeconds(time.getSeconds() + song.duration)
                if (time <= Date.now()) {
                    return resolve(true)
                }
                else {
                    return resolve(false)
                }
            })
        })
    })
}

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: '+ add + ':' + port);
})