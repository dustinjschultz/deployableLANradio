
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
            console.log(data.curPlay)
            console.log(data.nextPlay)
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