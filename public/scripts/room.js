
$(document).ready(function () {
    initRoom()
})


function initRoom() {
    var room_id = $('input[name=room_id]').val()
    loadQueueIntoData(room_id).then(function () {
        playMediaFromData()
    })
}

function submitSongHandler() {
    var songId = $('select[name=song_id]').val();
    var roomId = $('input[name=room_id]').val();
    $.ajax({
        type: 'post',
        url: '/submit-song',
        data: { 'songId': songId, 'roomId': roomId },
        dataType: 'json',
        success: function (data) {
            if (data.appended) {
                loadQueueIntoData(roomId).then(function () {
                    playMediaFromData()
                })
            }
        }
    })
}

function submitPlaylistHandler() {
    var playlistId = $('select[name=playlist_id]').val();
    var roomId = $('input[name=room_id]').val();
    $.ajax({
        type: 'post',
        url: '/submit-playlist',
        data: { 'playlistId': playlistId, 'roomId': roomId },
        dataType: 'json',
        success: function (data) {
            if (data.appended) {
                loadQueueIntoData(roomId).then(function () {
                    playMediaFromData()
                })
            }
        }
    })
}

function loadQueueIntoData(roomIdString) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'post',
            url: '/get-room-update',
            data: { 'roomid': roomIdString },
            dataType: 'json',
            success: function (data) {
                $('.room-container').data('curPlay', data.curPlay)
                $('.room-container').data('nextPlay', data.nextPlay)
                return resolve()
            }
        })
    })
}

function proposeUpdate(roomIdString) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'post',
            url: '/propose-room-update',
            data: { 'roomid': roomIdString },
            dataType: 'json',
            success: function (data) {
                return resolve(data.proposalValid)
            }
        })
    })
}

function hasNextLocally() {
    return $('.room-container').data().nextPlay != null
}

function isPlayingCur() {
    var curPlay = $('.room-container').data().curPlay
    var playId = $('.media-container').attr('data-playId')
    return curPlay._id == playId
}

function playYoutube(song, playId, startSecs) {
    var link = song.link
    link = link.replace("watch?v=", "embed/")
    link = link + '?start=' + startSecs + '&autoplay=1'

    var iframe = document.createElement('iframe')
    iframe.classList.add('youtube-player')
    iframe.setAttribute('src', link)
    iframe.setAttribute('frameborder', 0)
    iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture')
    $('.media-container').append(iframe)
}

function conditionRoomForPlay(playId, name, secsToEnd) {
    $('.media-container')[0].setAttribute('data-playId', playId)
    $('.no-media').addClass('hidden')
    $('.play-name').text(name)
    scheduleSongEndHandler(secsToEnd)
}

function playMediaFromData() {

    if (isPlayingCur()) {
        return
    }

    clearMediaPlayer()
    var curPlay = $('.room-container').data().curPlay
    var playId = curPlay._id
    var songId = curPlay.songId

    $.ajax({
        type: 'post',
        url: '/get-song',
        data: { 'songId': songId },
        dataType: 'json',
        success: function (data) {
            var startSecs = calcStartToNowGap(curPlay.startTime)
            if (startSecs >= data.song.duration) {
                startSecs = 0
            }

            conditionRoomForPlay(playId, data.song.name, data.song.duration - startSecs)

            if (data.song.format == 'youtube') {
                playYoutube(data.song, playId, startSecs)
            }
            else {
                //TODO: support more song formats
                console.log('recognized song format')
            }
        }
    })
}

function clearMediaPlayer() {
    var noMediaMessageEl = $('.no-media').clone()
    noMediaMessageEl.removeClass('hidden')
    var mediaContainer = $('.media-container')
    mediaContainer.empty()
    mediaContainer.append(noMediaMessageEl)
    $('.play-name').text('Play something!')
    $('.media-container').attr('data-playId', '')
}

function songEndHandler() {
    var room_id = $('input[name=room_id]').val()
    proposeUpdate(room_id).then(function (proposalValid) {
        if (proposalValid) {
            loadQueueIntoData(room_id).then(function () {
                playMediaFromData()
            })
        }
        else {
            clearMediaPlayer()
            //TODO: setup pooling of update checking
        }
    })
}

function scheduleSongEndHandler(duration) {
    setTimeout(songEndHandler, duration * 1000)
}

function calcStartToNowGap(startTime) {
    var start = new Date(startTime)
    var now = new Date(Date.now())
    var diff = (now.getTime() - start.getTime()) / 1000
    diff = Math.floor(diff)
    return diff
}