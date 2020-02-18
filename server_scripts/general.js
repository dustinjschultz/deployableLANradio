
const mongoose = require('mongoose')
const ObjectID = require('mongodb').ObjectID
const youtubeInfo = require('youtube-info')

const { User } = require('../models/user')
const { Room } = require('../models/room')
const { Library } = require('../models/library')
const { Song } = require('../models/song')
const { Play } = require('../models/play')
const { Playlist } = require('../models/playlist')
const { PlaylistElement } = require('../models/playlistelement')

const linkedJS = require('./linkedJS')


function getRooms() {
    return new Promise(function (resolve, reject) {
        Room.find({}, (err, rooms) => {
            return resolve(rooms)
        })
    })
}

function getLibrary(userid) {
    return new Promise(function (resolve, reject) {
        Library.findOne({owner: userid}, (err, library) => {
            return resolve(library)
        })
    })
}

//returns promise with object that is {songs, playlists}
function getLibraryContents(library) {
    return new Promise(function (resolve, reject) {
        if (!library) {
            return resolve(null)
        }

        var songIdsStrings = library.songIds
        var songIds = []
        for (var i = 0; i < songIdsStrings.length; i++) {
            songIds.push(ObjectID(songIdsStrings[i]))
        }
        Song.find({ _id: songIds }, (err, songs) => {

            var playlistIdsStrings = library.playlistIds
            var playlistIds = []
            for (var i = 0; i < playlistIdsStrings.length; i++) {
                playlistIds.push(ObjectID(playlistIdsStrings[i]))
            }
            Playlist.find({ _id: playlistIds }, (err, playlists) => {
                return resolve({songs: songs, playlists: playlists})
            })

        })
    })
}

function identifySongType(link) {
    if (link.includes('youtube')) { //TODO: make this detect more yt links
        return 'youtube'
    }
    else {
        return 'unknown'
    }
}

function getSongDuration(type, link) {
    return new Promise(function (resolve, reject) {
        if (type == 'youtube') {
            id = extractYoutubeId(link)
            youtubeInfo(id, function (err, videoInfo) {
                return resolve(videoInfo.duration)
            })
        }
        else {
            //TODO: more song types
            return null;
        }
    })
}

function extractYoutubeId(link) {
    var start = link.indexOf("?v=") + 3;
    var end = link.indexOf("&");
    if (end > 0) {
        return link.substring(start, end)
    }
    else {
        return link.substring(start)
    }
}

function getPlay(idString) {
    return new Promise(function (resolve, reject) {
        Play.findOne({ _id: ObjectID(idString) }, (err, play) => {
            return resolve(play)
        })
    })
}

function getRoom(idString) {
    return new Promise(function (resolve, reject) {
        Room.findOne({ _id: ObjectID(idString) }, (err, room) => {
            return resolve(room)
        })
    })
}

function getSong(idString) {
    return new Promise(function (resolve, reject) {
        Song.findOne({ _id: ObjectID(idString) }, (err, song) => {
            return resolve(song)
        })
    })
}


function generalTestFunc() {
    return 'general - testFunc()'
}


module.exports = {
    generalTestFunc,
    getRooms,
    getLibrary,
    identifySongType,
    getLibraryContents,
    getSongDuration,
    getPlay,
    getRoom,
    getSong,
    linkedJS
}