
const { User } = require('../models/user')
const { Room } = require('../models/room')
const { Library } = require('../models/library')
const { Song } = require('../models/song')
const { Play } = require('../models/play')
const { Playlist } = require('../models/playlist')
const { PlaylistElement } = require('../models/playlistelement')
const { Tag } = require('../models/tag')

const tf = require('@tensorflow/tfjs')
const distance = require('euclidean-distance')
const ss = require('simple-statistics')
const pd = require("probability-distributions")


const predictionStrats = {
    RANDOM: "random",
    RANDOM_RECENT: "random_recent",
    LSTM_W_RANDOM_FILL: "lstm_w_random_fill",
    LSTM_W_DISTRIBUTION_FILL: "lstm_w_distribution_fill"
}

const missingValueFillStrats = {
    RANDOM: "fill_random",
    FILL_NEGATIVE: "fill_negative",
    DISTRIBUTION: "fill_distribtion"
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

function createUsingLstm(room, songs, tags, predictableSongs, predictableTags, fillTraining, fillPredictables) {
    return new Promise(function (resolve, reject) {
        var frequencies = calcSortedTagFrequenciesArray(tags)
        var tensorFull = convertSongsAndTagsTo3dTensorInput(songs, tags, frequencies)
        //TODO: fill missing for tensor-like
        var tensorClone = JSON.parse(JSON.stringify(tensorFull)) //deep copy the array

        generateLstmModelAndPredict(tensorFull, tensorClone).then(function (predictionTagValues) {
            predictionTagValues = predictionTagValues.map(x => x * 100) //change from 0-1 to 0-100

            var tensorForPredictables = convertSongsAndTagsTo3dTensorInput(predictableSongs, predictableTags, frequencies) 
            predictableTagValues = removeTensorConditioning(tensorForPredictables)
            predictableTagValues = fillMissingValues(predictableTagValues, fillPredictables) 

            var predictableSimilarities = calcSimilarities(predictionTagValues, predictableTagValues)
            var songSimilarityObjects = createSongIdSimilarityObjects(predictableSongs, predictableSimilarities)
            songSimilarityObjects = sortBySimilarity(songSimilarityObjects)
            selectedSongId = selectFromSongSimilarityObjects(songSimilarityObjects, 5).songId
            
            const play = new Play({
                songId: selectedSongId,
                submitterId: room.owner,
                startTime: null
            })
            play.save((err, response) => {
                return resolve(play)
            })
        })
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
                toAdd = -1
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

function generateLstmModelAndPredict(tensorInput1, tensorInput2) {
    return new Promise(function (resolve, reject) {

        // condition input to be the relevant elements
        var predictOnElement = tensorInput1.pop() // chop last element and save it
        tensorInput2.shift() // chop first element

        // create tensors
        var train_x = tf.tensor3d(tensorInput1)
        var train_y = tf.tensor3d(tensorInput2)
        var predict_x = tf.tensor3d([predictOnElement])

        // create model
        var model = tf.sequential();
        var hidden = tf.layers.lstm({ units: 3, activation: 'sigmoid', inputShape: [3, 1], returnSequences: true })
        model.add(hidden)

        var output = tf.layers.lstm({ units: 1, activation: 'sigmoid', inputShape: [3], returnSequences: true })
        model.add(output)

        var sgdOptimizer = tf.train.sgd(0.1)
        model.compile({ optimizer: sgdOptimizer, loss: tf.losses.meanSquaredError })

        // fit model then predict
        model.fit(train_x, train_y, { epochs: 50 }).then(function () {
            var prediction = model.predict(predict_x)
            var predictionArray = cleanPredictionString(prediction.toString())
            return resolve(predictionArray)
        })
    })
}

function cleanPredictionString(predStr) {
    predStr = predStr.replace("Tensor", "").replace(/\s/g, "")
    predArray = JSON.parse("[" + predStr + "]")
    predArray = predArray[0][0]
    for (var i = 0; i < predArray.length; i++) {
        predArray[i] = predArray[i][0]
    }
    return predArray
}

// takes array of tag values, array of sorted frequencies, and attaches labels from frequencies array to values
function labelPredictionValues(predictionValues, frequencies) {
    var retArray = []
    for (var i = 0; i < predictionValues.length; i++) {
        retArray.push({ name: frequencies[i][0], value: predictionValues[i] })
    }
    return retArray
}

function removeTensorConditioning(tensorLikeArray){
    var retArray = []
    for (var i = 0; i < tensorLikeArray.length; i++) {
        var subArray = tensorLikeArray[i]
        for (var j = 0; j < subArray.length; j++) {
            subArray[j] = subArray[j][0]
        }
        retArray.push(subArray)
    }
    return retArray
}

function calcSimilarities(predictionTagValues, predictableTagValues) {
    //TODO: support different similarity values
    var retArray = []
    var distances = []

    for (var i = 0; i < predictableTagValues.length; i++) {
        distances[i] = calcEuclidianDistance(predictionTagValues, predictableTagValues[i])
    }

    //var min = Math.min(...distances)

    // force high distance to low similarity
    for (var i = 0; i < predictableTagValues.length; i++) {
        retArray[i] = 1 / distances[i]
    }
    return retArray
}

function calcEuclidianDistance(point1, point2) {
    return distance(point1, point2)
}

function createSongIdSimilarityObjects(predictableSongs, predictableSimilarities) {
    var retArray = []
    for (var i = 0; i < predictableSongs.length; i++) {
        retArray[i] = { songId: predictableSongs[i]._id, similarity: predictableSimilarities[i]}
    }
    return retArray
}

function sortBySimilarity(songTagSimilarityObjects) {
    songTagSimilarityObjects.sort((a, b) => {
        return a.similarity < b.similarity ? 1 : -1
    })
    return songTagSimilarityObjects
}

function selectFromSongSimilarityObjects(songSimilarityObjects, numToConsider) {
    var sum = 0
    songSimilarityObjects = songSimilarityObjects.slice(0, numToConsider)

    for (var i = 0; i < songSimilarityObjects.length; i++) {
        sum += songSimilarityObjects[i].similarity
    }

    var songProbabilityObjects = createSongProbabilityObjects(sum, songSimilarityObjects)
    var prediction = getRandomFromWeighted(songProbabilityObjects)
    return prediction
}

function createSongProbabilityObjects(sum, songSimilarityObjects){
    var retArray = []
    for (var i = 0; i < songSimilarityObjects.length; i++) {
        retArray[i] = { songId: songSimilarityObjects[i].songId, probability: songSimilarityObjects[i].similarity / sum }
    }
    return retArray
}

function getRandomFromWeighted(objectsWithProbability) {
    var random = Math.random()
    var sum = 0

    for (var i = 0; i < objectsWithProbability.length; i++) {
        if (sum + objectsWithProbability[i].probability > random) {
            return objectsWithProbability[i]
        }
        else {
            sum += objectsWithProbability[i].probability 
        }
    }
    return objectsWithProbability[objectsWithProbability.length - 1]
}

function fillMissingValues(predictableTagValues, fillStrat) {
    //predictableTagValues Shape: [ [70, 50, 50],  [80, 70, 50], ]

    var distributions
    if (fillStrat == missingValueFillStrats.DISTRIBUTION) {
        distributions = createDistributions(predictableTagValues)
    }

    for (var i = 0; i < predictableTagValues.length; i++) {
        for (var j = 0; j < predictableTagValues[i].length; j++) {
            if (predictableTagValues[i][j] == -1) {
                var newValue

                switch (fillStrat) {

                    case missingValueFillStrats.RANDOM:
                        newValue = Math.floor(Math.random() * 101)
                        break;

                    case missingValueFillStrats.FILL_NEGATIVE:
                        newValue = -1
                        break;

                    case missingValueFillStrats.DISTRIBUTION:
                        newValue = randFromDist(distributions[j]) //TODO: update params
                        break;

                    default:
                        //Treat default just like RANDOM
                        toAddValue = Math.floor(Math.random() * 101)
                }

                predictableTagValues[i][j] = newValue
            }
        }
    }
    return predictableTagValues
}

function randFromDist(distribution) {
    var rand = pd.rnorm(1, distribution.mean, distribution.stdDev)
    return rand[0]
}

// Input shape: [ [70, 50, 50],  [80, 70, 50], ]
//  where a value of -1 is a missing value that shouldn't be counted
// Output: array of {mean, stdDev} objects
function createDistributions(tagValues) {

    var sampleArrays = []

    //init sampleArrays with an array for each feature
    for (var i = 0; i < tagValues[0].length; i++) {
        sampleArrays.push([])
    }

    for (var i = 0; i < tagValues.length; i++) {
        for (var j = 0; j < tagValues[i].length; j++) {
            if (tagValues[i][j] != -1) {
                sampleArrays[j].push(tagValues[i][j])
            }
        }
    }

    var retArray = []

    for (var i = 0; i < sampleArrays.length; i++) {
        var mean = ss.mean(sampleArrays[i])
        var stdDev = ss.sampleStandardDeviation(sampleArrays[i])
        retArray.push({mean: mean, stdDev: stdDev})
    }

    return retArray
}

function predictionFunc() {
    return 'predictionFunc()'
}


module.exports = {
    predictionStrats,
    missingValueFillStrats,
    createRandomFromHistory,
    createUsingLstm,
    predictionFunc
}

