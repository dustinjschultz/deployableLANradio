
const mongoose = require('mongoose')
const ObjectID = require('mongodb').ObjectID

const { User } = require('../models/user')
const { Room } = require('../models/room')
const { Library } = require('../models/library')
const { Song } = require('../models/song')

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

function getLibraryContents(library) {
    return new Promise(function (resolve, reject) {

        //TODO: add playlists
        var songIdsStrings = library.songs
        var songIds = []
        for (var i = 0; i < songIdsStrings.length; i++) {
            songIds.push(ObjectID(songIdsStrings[i]))
        }
        Song.find({ _id: songIds }, (err, songs) => {
            return resolve(songs)
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


function generalTestFunc() {
    return 'general - testFunc()'
}


module.exports = {
    generalTestFunc,
    getRooms,
    getLibrary,
    identifySongType,
    getLibraryContents,
    linkedJS
}