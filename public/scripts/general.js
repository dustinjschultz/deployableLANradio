//TODO: this probably shouldn't be in /public...

const mongoose = require('mongoose')

const { User } = require('../../models/user')
const { Room } = require('../../models/room')

const infocard = require('./infocard')


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
    infocard
}