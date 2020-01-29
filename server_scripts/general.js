
const mongoose = require('mongoose')

const { User } = require('../models/user')
const { Room } = require('../models/room')
const { Library } = require('../models/library')
const { Song } = require('../models/song')

const linkedJS = require('./linkedJS')


function getRooms() {
    return new Promise(function (resolve, reject) {
        Room.find({}, (err, rooms) => {
            return resolve(rooms)
        })
    })
}

function getLibrary(userid) {
    return new Promise(function (resolve, reject) {
        Library.find({owner: userid}, (err, library) => {
            return resolve(library)
        })
    })
}


function generalTestFunc() {
    return 'general - testFunc()'
}


module.exports = {
    generalTestFunc,
    getRooms,
    getLibrary,
    linkedJS
}