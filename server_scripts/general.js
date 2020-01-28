
const mongoose = require('mongoose')

const { User } = require('../models/user')
const { Room } = require('../models/room')

const linkedJS = require('./linkedJS')


function getRooms() {
    return new Promise(function (resolve, reject) {
        Room.find({}, (err, rooms) => {
            //console.log(rooms)
            return resolve(rooms)
        })
    })
    
}


function generalTestFunc() {
    return 'general - testFunc()'
}


module.exports = {
    generalTestFunc,
    getRooms,
    linkedJS
}