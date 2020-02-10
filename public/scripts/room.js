
$(document).ready(function () {
    $("form#submit-song").on('submit', function (e) {
        e.preventDefault();
        var songid = $('select[name=song_id]').val();
        var roomid = $('input[name=room_id]').val();
        $.ajax({
            type: 'post',
            url: '/submit-song',
            data: { 'songid': songid, 'roomid': roomid },
            dataType: 'json'
        })
    })
    //TODO: same but for submit-playlist

    loadQueue($('input[name=room_id]').val())
})

function loadQueue(roomIdString){
    $.ajax({
        type: 'post',
        url: '/get-room-update',
        data: { 'roomid': roomIdString },
        dataType: 'json',
        success: function (data) {
            $('.room-container').data('curPlay', data.curPlay)
            $('.room-container').data('nextPlay', data.nextPlay)
        }
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
    //TODO:
    var curPlay = $('.room-container').data().curPlay
    return curPlay
}

function playYoutube(link, startTime) {
    link = link.replace("watch?v=", "embed/")
    var iframe = document.createElement('iframe')
    iframe.setAttribute('src', link)
    iframe.setAttribute('frameborder', 0)
    iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture')
    $('.media-container').append(iframe)
}

function playYoutubeFromData() {
    var songid = $('.room-container').data().curPlay.songid
    $.ajax({
        type: 'post',
        url: '/get-song',
        data: { 'songid': songid },
        dataType: 'json',
        success: function (data) {
            playYoutube(data.song.link)
        }
    })
}