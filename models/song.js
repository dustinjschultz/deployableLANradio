const mongoose = require('mongoose')
const ObjectID = require('mongodb').ObjectID


const songSchema = mongoose.Schema({
    format: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
    },
    duration: {
        type: Number
    }
    //tags: [{
    //    type: ObjectID,
    //    ref: 'Tag'
    //}],
})

const Song = mongoose.model('Song', songSchema)
module.exports = { Song }