const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const ObjectID = require('mongodb').ObjectID

const librarySchema = mongoose.Schema({
    owner: {
        type: ObjectID,
        ref: 'User'
    },
    songs: [{
        type: ObjectID,
        ref: 'Song'
    }],
    //playlists: [{
    //    type: ObjectID,
    //    ref: 'Playlist'
    //}]
})

const Library = mongoose.model('Library', librarySchema)
module.exports = { Library }