
$(document).ready(function () {
    initRoom()
})


function initRoom() {

    initSubmitSongButton()
    //TODO: same but for submit-playlist
    var room_id = $('input[name=room_id]').val()
    loadQueueIntoData(room_id).then(function () {
        playMediaFromData()
    })
}

function initSubmitSongButton() {
    $("form#submit-song").on('submit', function (e) {
        e.preventDefault();
        var songId = $('select[name=song_id]').val();
        var roomid = $('input[name=room_id]').val();
        $.ajax({
            type: 'post',
            url: '/submit-song',
            data: { 'songId': songId, 'roomid': roomid },
            dataType: 'json'
        })
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
    $.ajax({
        type: 'post',
        url: '/propose-room-update',
        data: { 'roomid': roomIdString },
        dataType: 'json',
        success: function (data) {
            console.log(data)
        }
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

function playYoutube(song, playId) {
    var mediaContainer = $('.media-container')[0]
    mediaContainer.setAttribute('data-playId', playId)

    var link = song.link
    var startTime = song.startTime

    //TODO: calculate time in video to start from
    startTime = startTime ? startTime : 0 //in case it wasn't available

    link = link.replace("watch?v=", "embed/")
    link = link + '?start=' + startTime + '&autoplay=1'

    var iframe = document.createElement('iframe')
    iframe.classList.add('youtube-player')
    iframe.setAttribute('src', link)
    iframe.setAttribute('frameborder', 0)
    iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture')
    $('.media-container').append(iframe)

    $('.no-media').addClass('hidden')
    $('.play-name').text(song.name)
}

//function playYoutubeFromData() {
//    clearMediaPlayer()
//    var curPlay = $('.room-container').data().curPlay
//    var playId = curPlay._id
//    var songId = curPlay.songId
//    $.ajax({
//        type: 'post',
//        url: '/get-song',
//        data: { 'songId': songId },
//        dataType: 'json',
//        success: function (data) {
//            playYoutube(data.song, playId) 
//        }
//    })
//}

function playMediaFromData() {
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
            if (data.song.format == 'youtube') {
                playYoutube(data.song, playId)
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
}