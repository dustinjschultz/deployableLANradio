
function toggleMenus() {
    var newsongcontainer = document.getElementsByClassName('new-song-container')[0];
    var newplaylistcontainer = document.getElementsByClassName('new-playlist-container')[0];

    newsongcontainer.classList.toggle('hidden');
    newplaylistcontainer.classList.toggle('hidden');
}