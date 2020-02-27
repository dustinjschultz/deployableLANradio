const mongoose = require('mongoose')
const ObjectID = require('mongodb').ObjectID


const tagSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    elementType: {
        type: String,
        required: true,
        enum: ['Song', 'Playlist']
    },
    elementId: {
        type: ObjectID,
        refPath: 'elementType'
    }
})

const Tag = mongoose.model('Tag', tagSchema)
module.exports = { Tag }