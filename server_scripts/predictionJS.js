
const { User } = require('../models/user')
const { Room } = require('../models/room')
const { Library } = require('../models/library')
const { Song } = require('../models/song')
const { Play } = require('../models/play')
const { Playlist } = require('../models/playlist')
const { PlaylistElement } = require('../models/playlistelement')
const { Tag } = require('../models/tag')

const predictionStrats = {
    RANDOM: "random",
    RANDOM_RECENT: "random_recent",
    LSTM_W_RANDOM_FILL: "lstm_w_random_fill"
}

function createRandomFromHistory(history, room) {
    return new Promise(function (resolve, reject) {
        var random = Math.ceil(Math.random() * (history.length - 1)) //Math.ceil so 0 is never picked (0 == INIT SONG)
        var randomPlay = history[random]

        const play = new Play({
            songId: randomPlay.songId,
            submitterId: room.owner,
            startTime: null
        })
        play.save((err, response) => {
            return resolve(play)
        })
    })
}

function createUsingLstmWRandomfill(history, room, songs, tags) {
    return new Promise(function (resolve, reject) {
        var frequencies = calcSortedTagFrequenciesArray(tags)
        var tensorInput = convertSongsAndTagsTo3dTensorInput(songs, tags, frequencies)
        console.log(tensorInput)
        //TODO: next steps
    })
}

//returns array of {tagName: frequencyCount}'s, sorted with most frequent first
function calcSortedTagFrequenciesArray(tags) {
    var frequenciesMap = new Map()
    for (var i = 0; i < tags.length; i++) {
        var curTag = tags[i]
        if (frequenciesMap.has(curTag.name)) {
            //increment count if present
            var curFrequency = frequenciesMap.get(curTag.name)
            frequenciesMap.set(curTag.name, curFrequency+1)
        }
        else {
            //start count if NOT present
            frequenciesMap.set(curTag.name, 1)
        }
    }

    //magic sorter and array converter from SO: https://stackoverflow.com/questions/31158902/is-it-possible-to-sort-a-es6-map-object
    var sortedFrequencies = Array
        .from(frequenciesMap)
        .sort((a, b) => {
            return b[1] - a[1];
        })
    
    return sortedFrequencies
}

function convertSongsAndTagsTo3dTensorInput(songs, tags, frequencies) {
    //TODO: test when a play history doesn't have 3 unique tags
    //TODO: support different fill strategies
    //Goal Shape: [ [[70], [50], [50]],  [[80], [70], [50]], ]

    var retArray = []
    var dimension = 3
    var desiredTags = []

    for (var i = 0; i < dimension; i++) {
        //only push to tagName if that many tags are available in the frequencies
        if (frequencies.length > i) {
            desiredTags.push(frequencies[i][0])
        }
    }

    for (var i = 0; i < songs.length; i++) {
        var songTags = getSongTags(songs[i], tags)
        songTags = songTags.filter(function (tag) {
            return desiredTags.includes(tag.name)
        })

        var songRetEntry = []
        for (var j = 0; j < desiredTags.length; j++) {

            var relevantTag = songTags.filter(function (tag) {
                return tag.name == desiredTags[j]
            })
            var toAdd

            if (relevantTag[0]) {
                toAdd = relevantTag[0].value
            }
            else {
                //TODO: support different ways to fill missing values
                toAdd = Math.floor(Math.random() * 101)
            }

            var toAddAsArray = []
            toAddAsArray.push(toAdd)
            songRetEntry.push(toAddAsArray)
        }
        retArray.push(songRetEntry)
    }

    return retArray
}

function getSongTags(song, tags) {
    var retArray = tags.filter(function (tag) {
        return tag.elementId.toString() == song._id.toString() 
    })
    return retArray
}

function predictionFunc() {
    return 'predictionFunc()'
}


module.exports = {
    predictionStrats,
    createRandomFromHistory,
    createUsingLstmWRandomfill,
    predictionFunc
}