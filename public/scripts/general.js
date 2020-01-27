const mongoose = require('mongoose')

const { User } = require('../../models/user')
const { Room } = require('../../models/room')


function getRooms() {
    return new Promise(function (resolve, reject) {
        Room.find({}, (err, rooms) => {
            //console.log(rooms)
            return resolve(rooms)
        })
    })
    
}


function testFunc() {
    return 'hi'
}


module.exports = {
    testFunc,
    getRooms
}