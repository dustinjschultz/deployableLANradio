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
    firstPlay: {
        type: ObjectID,
        ref: 'Play'
    },
    currentPlay: {
        type: ObjectID,
        ref: 'Play'
    },
    deepestPlay: {
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
    //usersForAutoplay: {
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