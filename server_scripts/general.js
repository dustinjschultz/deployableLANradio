
const mongoose = require('mongoose')
const ObjectID = require('mongodb').ObjectID
const youtubeInfo = require('youtube-info')

const { User } = require('../models/user')
const { Room } = require('../models/room')
const { Library } = require('../models/library')
const { Song } = require('../models/song')
const { Play } = require('../models/play')
const { Playlist } = require('../models/playlist')
const { PlaylistElement } = require('../models/playlistelement')
const { Tag } = require('../models/tag')

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
        Library.findOne({owner: userid}, (err, library) => {
            return resolve(library)
        })
    })
}

//returns promise with object that is {songs, playlists, tags, playlistelements}
function getLibraryContents(library) {
    return new Promise(function (resolve, reject) {
        if (!library) {
            return resolve(null)
        }

        var songIds = convertStringsToObjectIDs(library.songIds)
        Song.find({ _id: songIds }, (err, songs) => {

            var playlistIds = convertStringsToObjectIDs(library.playlistIds)
            Playlist.find({ _id: playlistIds }, (err, playlists) => {
                tagIds = extractTagIds(songs, playlists)
                Tag.find({ _id: tagIds }, (err, tags) => {

                    var playlistElementIdsStrings = []
                    for (var i = 0; i < playlists.length; i++) {
                        playlistElementIdsStrings = playlistElementIdsStrings.concat(playlists[i].elementIds)
                    }

                    playlistElementIds = convertStringsToObjectIDs(playlistElementIdsStrings)

                    PlaylistElement.find({_id: playlistElementIds}, (err, elements) => {
                        return resolve({ songs: songs, playlists: playlists, tags: tags, playlistelements: elements })
                    })
                })
            })
        })
    })
}

function identifySongType(link) {
    if (link.includes('youtube')) { //TODO: make this detect more yt links
        return 'youtube'
    }
    else {
        return 'unknown'
    }
}

function getSongDuration(type, link) {
    return new Promise(function (resolve, reject) {
        if (type == 'youtube') {
            id = extractYoutubeId(link)
            youtubeInfo(id, function (err, videoInfo) {
                return resolve(videoInfo.duration)
            })
        }
        else {
            //TODO: more song types
            return null;
        }
    })
}

function extractYoutubeId(link) {
    var start = link.indexOf("?v=") + 3;
    var end = link.indexOf("&");
    if (end > 0) {
        return link.substring(start, end)
    }
    else {
        return link.substring(start)
    }
}

function getPlay(idString) {
    return new Promise(function (resolve, reject) {
        Play.findOne({ _id: ObjectID(idString) }, (err, play) => {
            return resolve(play)
        })
    })
}

function getRoom(idString) {
    return new Promise(function (resolve, reject) {
        Room.findOne({ _id: ObjectID(idString) }, (err, room) => {
            return resolve(room)
        })
    })
}

function getSong(idString) {
    return new Promise(function (resolve, reject) {
        Song.findOne({ _id: ObjectID(idString) }, (err, song) => {
            return resolve(song)
        })
    })
}

function getPlaylist(idString) {
    return new Promise(function (resolve, reject) {
        Playlist.findOne({ _id: ObjectID(idString) }, (err, playlist) => {
            return resolve(playlist)
        })
    })
}

function getPlaylists(idStrings) {
    return new Promise(function (resolve, reject) {
        Playlist.find({ _id: idStrings }, (err, playlists) => {
            return resolve(playlists)
        })
    })
}

function extractTagIds(songs, playlists) {
    var tagIds = []
    for (var i = 0; i < songs.length; i++) {
        for (var j = 0; j < songs[i].tagIds.length; j++) {
            tagIds.push(songs[i].tagIds[j])
        }
    }
    for (var i = 0; i < playlists.length; i++) {
        for (var j = 0; j < playlists[i].tagIds.length; j++) {
            tagIds.push(playlists[i].tagIds[j])
        }
    }
    return tagIds
}

function matchDbObjectWithId(dbObject, id) {
    for (var i = 0; i < dbObject.length; i++) {
        if (dbObject[i]._id.toString() == id.toString()) { //converting to strings make it work
            return dbObject[i]
        }
    }
    return null
}

function convertStringsToObjectIDs(strings) {
    objectIDs = []
    for (var i = 0; i < strings.length; i++) {
        objectIDs.push(ObjectID(strings[i]))
    }
    return objectIDs
}

//expecting array of objects in format {tag_id, tag_name, tag_value}
function saveTagEdits(tags) {
    if (!tags) {
        return
    }
    for (var i = 0; i < tags.length; i++) {
        saveTagEdit(tags[i])
    }
}

//expecting object in format {tag_id, tag_name, tag_value}
function saveTagEdit(tagToSave) {
    Tag.findOne({ _id: ObjectID(tagToSave.tag_id) }, (err, tag) => {
        tag.name = tagToSave.tag_name
        tag.value = tagToSave.tag_value
        tag.save()
    })
}

//expecting array of objects in format {tag_name, tag_value, tag_type, tag_elId}
function saveTagCreations(tags) {
    if (!tags) {
        return
    }
    for (var i = 0; i < tags.length; i++) {
        saveTagCreation(tags[i])
    }
}

//expecting array of objects in format {tag_name, tag_value, tag_type, tag_elId}
function saveTagCreation(tag) {
    const newTag = new Tag({
        name: tag.tag_name,
        value: tag.tag_value,
        elementType: tag.tag_type,
        elementId: tag.tag_elId
    })
    newTag.save((err, response) => {
        if (tag.tag_type == 'Song') {
            appendTagToSong(newTag, tag.tag_elId)
        }
        else if(tag.tag_type == 'Playlist') {
            appendTagToPlaylist(newTag, tag.tag_elId)
        }
    })
}

function appendTagToSong(tag, idString) {
    Song.findOne({ _id: ObjectID(idString) }, (err, song) => {
        song.tagIds.push(tag)
        song.save()
    })
}

function appendTagToPlaylist(tag, idString) {
    Playlist.findOne({ _id: ObjectID(idString) }, (err, playlist) => {
        playlist.tagIds.push(tag)
        playlist.save()
    })
}

function addSongToPlaylist(songId, playlistId) {
    return new Promise(function (resolve, reject) {
        Playlist.findOne({ _id: ObjectID(playlistId) }, (err, playlist) => {
            createPlaylistElement(songId, 'Song').then(function (playlistElement) {
                playlist.elementIds.push(playlistElement._id)
                playlist.save((err, response) => {
                    return resolve()
                })
            }) 
        })
    })
}

function addPlaylistToPlaylist(playlistToAddId, playlistId) {
    return new Promise(function (resolve, reject) {
        Playlist.findOne({ _id: ObjectID(playlistId) }, (err, playlist) => {
            createPlaylistElement(playlistToAddId, 'Playlist').then(function (playlistElement) {
                playlist.elementIds.push(playlistElement._id)
                playlist.save((err, response) => {
                    return resolve()
                })
            })
        })
    })
}

function createPlaylistElement(elementId, type) {
    return new Promise(function (resolve, reject) {
        const playlistElement = new PlaylistElement({
            elementType: type,
            elementId: elementId
        })
        playlistElement.save((err, response) => {
            return resolve(playlistElement)
        })
    })
}

function isDangerousRecursiveAdd(playlistToAddId, playlistId) {
    return new Promise(function (resolve, reject) {
        collectNestedPlaylists(playlistToAddId).then(function (allNestedPlaylists) {
            console.log('isDangerous() called collectNested() and got: ')
            console.log(allNestedPlaylists)
            for (var i = 0; i < allNestedPlaylists.length; i++) {
                if (allNestedPlaylists[i]._id.toString() == playlistId.toString()) {
                    return resolve(true)
                }
            }
            return resolve(false)
        })
    })
}

//function collectNestedPlaylists(playlistIdString) {
//    return new Promise(function (resolve, reject) {

//        var nestedPlaylists = []

//        getPlaylistElementsFromPlaylistId(playlistIdString).then(function (playlistElements) {

//            var filteredElements = filterPlaylistElements('Playlist', playlistElements)
//            nestedPlaylists = arrayPushAll(nestedPlaylists, filteredElements)

//            for (var i = 0; i < filteredElements.length; i++) {
//                console.log('about to collectNested for ' + filteredElements[i]._id)
//                collectNestedPlaylists(filteredElements[i]._id).then(function (nextLayersOfElements) {
//                    nestedPlaylists = arrayPushAll(nestedPlaylists, nextLayersOfElements)
//                })
//            }
//            //TODO: also looks like there's an issue with nestedPlaylists becoming an array of arrays...
//            return resolve(nestedPlaylists) //this is returning before the for loop's then()s finish
//        })
//    })
//}

function collectNestedPlaylists(playlistIdString) {
    return new Promise(function (resolve, reject) {
        var nestedPlaylists = []

        getPlaylist(playlistIdString).then(function (playlist) {
            nestedPlaylists.push(playlist)
            var playlistArray = []
            playlistArray.push(playlist)

            getElementsOfPlaylists(playlistArray).then(function (elements) {
                var plElements = filterPlaylistElements('Playlist', elements)
                //TODO: these are playlistElements of type Playlist, but NOT Playlists

                var playlistIdStrings = []
                for (var i = 0; i < plElements.length; i++) {
                    playlistIdStrings.push(plElements[i].elementId)
                }
                var playlistIds = convertStringsToObjectIDs(playlistIdStrings)

                getPlaylists(playlistIds).then(function (playlists) {
                    nestedPlaylists = arrayPushAll(nestedPlaylists, playlists)

                    getNextLayers(playlists).then(function (nestedElements) {
                        console.log('collectNestedPlaylist() called getNextLayers() and got: ')
                        console.log(nestedElements)
                        nestedPlaylists = arrayPushAll(nestedPlaylists, nestedElements)
                        return resolve(nestedPlaylists)
                    })
                })
            })
        })
    })
}

function getNextLayers(playlistArray) {
    console.log('getNextLayers() with: ')
    console.log(playlistArray)
    return new Promise(function (resolve, reject) {
        var returnArray = []
        getElementsOfPlaylists(playlistArray).then(function (elements) {
            if (elements.length == 0) {
                return resolve ([])
            }
            else {
                var plElements = filterPlaylistElements('Playlist', elements)
                returnArray = arrayPushAll(returnArray, plElements)

                getNextLayers(plElements).then(function (nestedElements) {
                    returnArray = arrayPushAll(returnArray, plElements)
                    return resolve(returnArray)
                })
            }
        })
    })
}

//TODO: still needed?
function getPlaylistElementIds(playlistId) {
    return new Promise(function (resolve, reject) {
        Playlist.findOne({ _id: ObjectID(playlistId) }, (err, playlist) => {
            return resolve(playlist.elementIds)
        })
    })
}

//TODO: still needed?
function getPlaylistElements(playlistElementIdStrings) {
    return new Promise(function (resolve, reject) {
        playlistElementIds = convertStringsToObjectIDs(playlistElementIdStrings)
        PlaylistElement.find({ _id: playlistElementIds }, (err, playlistElements) => {
            return resolve(playlistElements)
        })
    })
}

//TODO: still needed?
function getPlaylistElementsFromPlaylistId(playlistId) {
    return new Promise(function (resolve, reject) {
        getPlaylistElementIds(playlistId).then(function (playlistElementIds) {
            getPlaylistElements(playlistElementIds).then(function (playlistElements) {
                return resolve(playlistElements)
            })
        })
    })
}

function getElementsOfPlaylists(playlistArray) {
    console.log('getElementsOfPlaylists with: ')
    console.log(playlistArray)
    return new Promise(function (resolve, reject) {
        var elements = []
        var elementIdStrings = []
        for (var i = 0; i < playlistArray.length; i++) {
            elementIdStrings = arrayPushAll(elementIdStrings, playlistArray[i].elementIds)
        }
        var elementIds = convertStringsToObjectIDs(elementIdStrings)
        PlaylistElement.find({ _id: elementIds }, (err, elements) => {
            return resolve(elements)
        })
    })
}

function filterPlaylistElements(desiredType, playlistElements) {
    var filtered = playlistElements.filter(element => {
        return element.elementType == desiredType
    })
    return filtered
}

function arrayPushAll(array1, array2) {
    for (var i = 0; i < array2.length; i++) {
        array1.push(array2[i])
    }
    return array1
}

function generalTestFunc() {
    return 'general - testFunc()'
}


module.exports = {
    generalTestFunc,
    getRooms,
    getLibrary,
    identifySongType,
    getLibraryContents,
    getSongDuration,
    getPlay,
    getRoom,
    getSong,
    getPlaylist,
    extractTagIds,
    matchDbObjectWithId,
    saveTagEdits,
    saveTagCreations,
    addSongToPlaylist,
    addPlaylistToPlaylist,
    isDangerousRecursiveAdd,
    linkedJS
}