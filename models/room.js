const mongoose = require('mongoose')
const ObjectID = require('mongodb').ObjectID


const roomSchema = mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
    },
    owner: {
        type: ObjectID,
        ref: 'User'
    },
    firstPlayId: {
        type: ObjectID,
        ref: 'Play'
    },
    currentPlayId: {
        type: ObjectID,
        ref: 'Play'
    },
    deepestPlayId: {
        type: ObjectID,
        ref: 'Play'
    },
    //everyoneDJ: {
    //    type: boolean
    //},
    //allowedDjs: [{
    //    type: ObjectID,
    //    ref: 'User'
    //}],
    //enableAutoskip: {
    //    type: boolean
    //},
    //autoskipThreshold: {
    //    type: number
    //},
    enableAutoplay: {
        type: Boolean,
        default: false
    },
    predictionStrategy: {
        type: String
    }
    //userIdsForAutoplay: {
    //    type: ObjectID,
    //    ref: 'User'
    //},
    //tagsToQuery: [{
    //    type: string
    //}],
    //theme: {
    //    type: string
    //},
    //password: {
    //    type: string
    //}
})




const Room = mongoose.model('Room', roomSchema)
module.exports = { Room }