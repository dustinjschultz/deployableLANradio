const mongoose = require('mongoose')
const ObjectID = require('mongodb').ObjectID


const playSchema = mongoose.Schema({
    songId: {
        type: ObjectID,
        ref: 'Song'
    },
    submitterId: {
        type: ObjectID,
        ref: 'User'
    },
    prevPlayId: {
        type: ObjectID,
        ref: 'Play'
    },
    nextPlayId: {
        type: ObjectID,
        ref: 'Play'
    },
    //skipped: {
    //    type: Boolean
    //},
    startTime: {
        type: Date
    },
    //ratingsSubmitted: {
    //    type: Number
    //},
    //positiveRatings: {
    //    type: Number
    //}
})

const Play = mongoose.model('Play', playSchema)
module.exports = { Play }