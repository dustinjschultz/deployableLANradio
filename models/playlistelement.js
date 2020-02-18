const mongoose = require('mongoose')
const ObjectID = require('mongodb').ObjectID

//https://www.chunkofcode.net/how-to-define-multiple-types-for-a-field-in-mongodb-mongoose/

const playlistelementSchema = mongoose.Schema({
    elementType: {
        type: String,
        required: true,
        enum: ['Song', 'Playlist']
    },
    element: {
        type: ObjectID,
        refPath: 'elementType'
    }
})

const PlaylistElement = mongoose.model('PlaylistElement', playlistelementSchema)
module.exports = { PlaylistElement }