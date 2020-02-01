const mongoose = require('mongoose')
const ObjectID = require('mongodb').ObjectID


const playSchema = mongoose.Schema({
    songid: {
        type: ObjectID,
        ref: 'Song'
    },
    submitterId: {
        type: ObjectID,
        ref: 'User'
    },
    //prevSongId: {
    //    type: ObjectId,
    //    ref: 'Play'
    //},
    //nextSongId: {
    //    type: ObjectId,
    //    ref: 'Play'
    //},
    //skipped: {
    //    type: Boolean
    //},
    //startTime: {
    //    type: Date
    //},
    //ratingsSubmitted: {
    //    type: Number
    //},
    //positiveRatings: {
    //    type: Number
    //}
})

const Play = mongoose.model('Play', playSchema)
module.exports = { Play }