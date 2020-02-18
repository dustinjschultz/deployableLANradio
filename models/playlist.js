const mongoose = require('mongoose')
const ObjectID = require('mongodb').ObjectID


const playlistSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
    },
    //tagIds: [{
    //    type: ObjectID,
    //    ref: 'Tag'
    //}],
    elementIds: [{
        type: ObjectID,
        ref: 'PlaylistElement'
    }],
})

const Playlist = mongoose.model('Playlist', playlistSchema)
module.exports = { Playlist }