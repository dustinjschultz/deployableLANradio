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
                        var isRoomAdmin = generalScripts.isRoomAdmin(req.session.uid, room)
                        var songs = contents.songs
                        var playlists = contents.playlists
                        req.session.room_id = req.query.room_id
                        req.session.save() //need to manually save if nothing is sent back
                        goTo(req, res, '/public/views/room.html', {
                            room_id: room._id,
                            songs: songs,
                            playlists: playlists,
                            library: library._id,
                            name: room.name,
                            description: room.description,
                            isRoomAdmin: isRoomAdmin
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
            var playlists = contents.playlists
            generalScripts.getRoom(room_id).then(function (room) {
                req.session.room_id = room_id
                req.session.save() //need to manually save if nothing is sent back
                var isRoomAdmin = generalScripts.isRoomAdmin(req.session.uid, room)
                goTo(req, res, '/public/views/room.html', {
                    room_id: room_id,
                    songs: songs,
                    playlists: playlists,
                    library: library ? library._id : null,
                    name: room.name,
                    description: room.description,
                    isRoomAdmin: isRoomAdmin
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

app.get('/room_settings', (req, res) => {
    var room_id = req.query.room_id

    generalScripts.getRoom(room_id).then(function (room) {
        var isRoomAdmin = generalScripts.isRoomAdmin(req.session.uid, room)
        delete room._id

        goTo(req, res, '/public/views/roomsettings.html', {
            room_id: room_id,
            room: room,
            isRoomAdmin: isRoomAdmin
        })
    })
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

app.post('/submit-playlist', (req, res) => {
    generalScripts.getPlaylist(req.body.playlistId).then(function (playlist) {
        generalScripts.collectNestedPlaylists(req.body.playlistId).then(function (allPlaylists) {

            var allPlaylistElementIdStrings = []
            for (var i = 0; i < allPlaylists.length; i++) {
                Array.prototype.push.apply(allPlaylistElementIdStrings, allPlaylists[i].elementIds)
            }

            var allPlaylistElementIds = generalScripts.convertStringsToObjectIDs(allPlaylistElementIdStrings)
            PlaylistElement.find({ _id: allPlaylistElementIds }, (err, elements) => {
                var filtered = generalScripts.filterPlaylistElements('Song', elements)

                generalScripts.getContentsOfPlaylistElements(filtered).then(function (contents) {
                    generalScripts.makePlays(contents.songs, req.session.uid).then(function (plays) {
                        generalScripts.getRoom(req.body.roomId).then(function (room) {
                            appendPlaysToRoom(plays, room).then(function () {
                                res.status(200).send({ appended: true })
                            })
                        })
                    })
                })
            })
        })
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
                //this branch means the room has a nextPlay, and it's ready to play it
                shiftRoomQueue(room).then(function () {
                    res.status(200).send({ proposalValid: true })
                })
            }
            else {
                roomHasNextPlay(room).then(function (hasNext) {
                    if (!hasNext) {
                        //this branch means the room has no nextPlay set

                        if (room.enableAutoplay) {
                            predictNextPlay(room).then(function () {
                                res.status(200).send({ proposalValid: true })
                            })
                        }
                        else {
                            res.status(200).send({ proposalValid: false })
                        }
                    }
                    else {
                        //this branch means the room has a nextPlay, it's just not time to play it yet
                        res.status(200).send({ proposalValid: false })
                    }
                })
            }
        })
    })
})

app.post('/get-song', (req, res) => {
    generalScripts.getSong(req.body.songId).then(function (song) {
        res.status(200).send({ song: song })
    })
})

app.get('/edit-tags', (req, res) => {
    generalScripts.saveTagEdits(req.query.editedTags)
    generalScripts.saveTagCreations(req.query.newTags)
})

app.get('/add-song-to-playlist', (req, res) => {
    generalScripts.addSongToPlaylist(req.query.songToAddId, req.query.playlistId).then(function() {
        res.status(200).send({})
    })
})

app.get('/add-playlist-to-playlist', (req, res) => {
    generalScripts.isDangerousRecursiveAdd(req.query.playlistToAddId, req.query.playlistId).then(function (isDangerous) {
        if (isDangerous) {
            //TODO: how to notify that it wasn't added?
            res.status(200).send({})
        }
        else {
            generalScripts.addPlaylistToPlaylist(req.query.playlistToAddId, req.query.playlistId).then(function () {
                res.status(200).send({})
            })
        }
    })
})

app.get('/submit-thumb', (req, res) => {
    generalScripts.submitThumb(req.session.uid, req.query.playId, (req.query.isThumbUp == 'true')).then(function () {
        res.status(200).send({})
    })
})

app.post('/update-room-settings', (req, res) => {
    var enableAutoplay = req.body.enableAutoplay ? true : false
    generalScripts.getRoom(req.body.room_id).then(function (room) {
        room.enableAutoplay = enableAutoplay
        room.predictionStrategy = req.body.predictionStrat
        room.save()
        goToIndex(req, res) //TODO: back to the room
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
            //.save.then() so a call from appendPlaysToRoom doesn't "save document multiple times in parallel" (mongo restriction)
            room.save().then(function () {
                play.save().then(function () {
                    oldDeepestPlay.save().then(function () {
                        checkRoomQueueShift(room).then(function (result) {
                            if (result) {
                                shiftRoomQueue(room).then(function () {
                                    return resolve()
                                })
                            }
                            else {
                                return resolve()
                            }
                        })
                    })
                })
            })
        })
    })
}

function appendPlaysToRoom(plays, room) {
    return new Promise(function (resolve, reject) {
        if (plays.length == 0) {
            return resolve()
        }
        else {
            appendPlayToRoom(plays[0], room).then(function () {
                appendPlaysToRoom(plays.slice(1), room).then(function () {
                    return resolve()
                })
            })
        }
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
    return new Promise(function (resolve, reject) {
        Play.findOne({ _id: ObjectID(room.currentPlayId) }, (err, curPlay) => {
            Play.findOne({ _id: ObjectID(curPlay.nextPlayId) }, (err, nextPlay) => {
                nextPlay.startTime = new Date(Date.now()).toISOString()
                room.currentPlayId = nextPlay._id
                nextPlay.save()
                room.save().then(function () {
                    return resolve()
                })
            })
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

function roomHasNextPlay(room) {
    return new Promise(function (resolve, reject) {
        Play.findOne({ _id: ObjectID(room.currentPlayId) }, (err, curPlay) => {
            if (!curPlay.nextPlayId) {
                return resolve(false)
            }
            else {
                return resolve(true)
            }
        })
    })
}

function predictNextPlay(room) {
    return new Promise(function (resolve, reject) {
        gatherRoomHistory(room).then(function (history) {

            switch (room.predictionStrategy) {

                case generalScripts.predictionJS.predictionStrats.RANDOM:
                    generalScripts.predictionJS.createRandomFromHistory(history, room).then(function (play) {
                        appendPlayToRoom(play, room).then(function () {
                            return resolve()
                        })
                    })
                    break;

                case generalScripts.predictionJS.predictionStrats.RANDOM_RECENT:
                    history.slice(Math.max(history.length - 10), 1) //use only "recent" (10) history
                    generalScripts.predictionJS.createRandomFromHistory(history, room).then(function (play) {
                        appendPlayToRoom(play, room).then(function () {
                            return resolve()
                        })
                    })
                    break;

                case generalScripts.predictionJS.predictionStrats.LSTM_W_RANDOM_FILL:
                    var fillTraining = generalScripts.predictionJS.missingValueFillStrats.RANDOM
                    var fillPredictables = generalScripts.predictionJS.missingValueFillStrats.RANDOM

                    gatherContentsForLstm(room, history).then(function (contents) {
                        generalScripts.predictionJS.createUsingLstm(room, contents.songs, contents.predictableSongs, fillTraining, fillPredictables).then(function (play) {
                            appendPlayToRoom(play, room).then(function () {
                                return resolve()
                            })
                        })
                    })
                    break;

                case generalScripts.predictionJS.predictionStrats.LSTM_W_DISTRIBUTION_FILL:
                    var fillTraining = generalScripts.predictionJS.missingValueFillStrats.DISTRIBUTION
                    var fillPredictables = generalScripts.predictionJS.missingValueFillStrats.DISTRIBUTION

                    gatherContentsForLstm(room, history).then(function (contents) {
                        generalScripts.predictionJS.createUsingLstm(room, contents.songs, contents.predictableSongs, fillTraining, fillPredictables).then(function (play) {
                            appendPlayToRoom(play, room).then(function () {
                                return resolve()
                            })
                        })
                    })
                    break;

                case generalScripts.predictionJS.predictionStrats.LSTM_W_COMBO_FILL:
                    var fillTraining = generalScripts.predictionJS.missingValueFillStrats.DIST1_FILL2
                    var fillPredictables = generalScripts.predictionJS.missingValueFillStrats.DIST1_FILL2

                    gatherContentsForLstm(room, history).then(function (contents) {
                        generalScripts.predictionJS.createUsingLstm(room, contents.songs, contents.predictableSongs, fillTraining, fillPredictables).then(function (play) {
                            appendPlayToRoom(play, room).then(function () {
                                return resolve()
                            })
                        })
                    })
                    break;

                default:
                    //Treat default just like RANDOM
                    generalScripts.predictionJS.createRandomFromHistory(history, room).then(function (play) {
                        appendPlayToRoom(play, room).then(function () {
                            return resolve()
                        })
                    })
                    break;
            }
        })
    })
}

function gatherRoomHistory(room) {
    return new Promise(function (resolve, reject) {
        var history = []

        Play.findOne({ _id: ObjectID(room.firstPlayId) }, (err, firstPlay) => {
            var play = firstPlay
            history.push(play) //TODO: Don't add the initPlay (just delete this line), but figure out the implications first

            getNextPlays(play).then(function (nextPlays) {
                Array.prototype.push.apply(history, nextPlays)
                return resolve(history)
            })
        })
    })
}

function getNextPlays(play) {
    return new Promise(function (resolve, reject) {
        var returnPlays = []
        if (!play.nextPlayId) {
            return resolve([])
        }
        else {
            Play.findOne({ _id: ObjectID(play.nextPlayId) }, (err, nextPlay) => {
                returnPlays.push(nextPlay)
                getNextPlays(nextPlay).then(function (nextPlays) {
                    Array.prototype.push.apply(returnPlays, nextPlays)
                    return resolve(returnPlays)
                })
            })
        }
    })
}

function gatherHistorySongs(history) {
    return new Promise(function (resolve, reject) {
        var songIdStrings = generalScripts.extractPropFromObjArray(history, "songId")
        var songIds = generalScripts.convertStringsToObjectIDs(songIdStrings)
        generalScripts.getSongs(songIds).then(function (songs) {
            return resolve(songs)
        })
    })
}

function gatherSongsTags(songs) {
    return new Promise(function (resolve, reject) {
        var tagIdStrings = generalScripts.extractPropArrayFromObjArray(songs, 'tagIds') 
        var tagIds = generalScripts.convertStringsToObjectIDs(tagIdStrings)
        generalScripts.getTags(tagIds).then(function (tags) {
            return resolve(tags)
        })
    })
}

// Gathers history songs, history songs' tags, predictable songs, predictable songs' tags
function gatherContentsForLstm(room, history) {
    return new Promise(function (resolve, reject) {
        gatherHistorySongs(history).then(function (songs) {
            gatherSongsTags(songs).then(function (tags) {
                generalScripts.getLibrary(room.owner).then(function (library) {
                    generalScripts.getLibraryContents(library).then(function (contents) {
                        var predictableSongs = contents.songs
                        var predictableTags = contents.tags
                        songs = addSongsTags(songs, tags)
                        predictableSongs = addSongsTags(predictableSongs, predictableTags)

                        var retObj = { songs: songs, tags: tags, predictableSongs: predictableSongs, predictableTags: predictableTags }
                        return resolve(retObj)
                    })
                })
            })
        })
    })
}

function addSongTags(song, tags) {
    if (song.tags == undefined) {
        song.tags = []
    }
    var songTags = tags.filter(function (tag) {
        return tag.elementId.toString() == song._id.toString()
    })
    Array.prototype.push.apply(song.tags, songTags)
    return song
}

function addSongsTags(songs, tags) {
    for (var i = 0; i < songs.length; i++) {
        songs[i] = addSongTags(songs[i], tags)
    } 
    return songs
}


require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: '+ add + ':' + port);
})