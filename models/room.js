const mongoose = require('mongoose')

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
    //owner: {
    //    type: userSchema
    //},
    //firstPlay: {
    //    type: playSchema
    //},
    //currentPlay: {
    //    type: playSchema
    //},
    //everyoneDJ: {
    //    type: boolean
    //},
    //allowedDjs: {
    //    type: [userSchema]
    //},
    //enableAutoskip: {
    //    type: boolean
    //},
    //autoskipThreshold: {
    //    type: number
    //},
    //usersForAutoplay: {
    //    type: [userSchema]
    //},
    //tagsToQuery: {
    //    type: [string]
    //},
    //theme: {
    //    type: string
    //},
    //password: {
    //    type: string
    //}
})




const Room = mongoose.model('Room', roomSchema)
module.exports = { Room }