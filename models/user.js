const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: 1,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    //rooms: {
    //    type: [roomSchema]
    //}
})

const User = mongoose.model('User', userSchema)

module.exports = { User }