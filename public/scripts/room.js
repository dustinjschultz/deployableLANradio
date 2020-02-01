
$(document).ready(function () {
    $("form#submit-song").on('submit', function (e) {
        e.preventDefault();
        var songid = $('select[name=songid]').val();
        console.log('songid: ' + songid);
        $.ajax({
            type: 'post',
            url: '/submit-song',
            data: { 'songid': songid },
            dataType: 'json'
        })
    })
    //TODO: same but for submit-playlist
})