function libtest() {
    console.log('yay libtest()')
}

function togglePlaylistEdits(element) {
    toggleTagEdits(element)
    togglePlaylistAddButtons(element)
}

function toggleSongEdits(element) {
    toggleTagEdits(element)
}

function toggleTagEdits(element) {
    var infocard = element.parentElement.parentElement.parentElement
    infocard.classList.toggle('tags-editable')
    toggleEditButton(element)
}

function toggleEditButton(element) {
    var parent = element.parentElement
    var buttons = parent.querySelectorAll('button')
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.toggle('hidden')
    }
}

function editIfPossible(element) {
    var infocard = element.parentElement.parentElement.parentElement.parentElement
    if (infocard.classList.contains('tags-editable') && !element.classList.contains('editing')) {
        startTagEdit(element)
    }
}

function savePlaylist(element) {
    saveTags(element)
    togglePlaylistAddButtons(element)
}

function saveTags(element) {
    toggleTagEdits(element)
    var infocard = element.parentElement.parentElement.parentElement
    var tags = infocard.querySelectorAll('.tag')

    var editedTags = gatherTagEdits(tags)
    var newTags = gatherTagCreations(tags)

    if (editedTags.length == 0 && newTags.length == 0) {
        return
    }

    for (var i = 0; i < tags.length; i++) {
        endTagEdit(tags[i])
    }



    $.ajax({
        type: 'get',
        url: '/edit-tags',
        data: { 'editedTags': editedTags, 'newTags': newTags },
        dataType: 'json',
    })
}

function startTagEdit(element) {
    element.classList.add('editing')

    var nameInput = document.createElement('input')
    var tagNameDiv = element.querySelector('.tag-name')
    var curName = tagNameDiv.textContent
    nameInput.setAttribute('type', 'text')
    nameInput.setAttribute('value', curName)
    nameInput.setAttribute('style', 'width: 100px;')
    nameInput.setAttribute('class', 'tag-name-edit')
    element.insertBefore(nameInput, element.childNodes[0] || null) //put the input first
    tagNameDiv.setAttribute('style', 'display: none;') //can't add hidden tag, since the display: none gets overriden by library's css

    var valueInput = document.createElement('input')
    var tagValueDiv = element.querySelector('.tag-value')
    var curVal = tagValueDiv.textContent
    valueInput.setAttribute('type', 'number')
    valueInput.setAttribute('min', '0')
    valueInput.setAttribute('max', '100')
    valueInput.setAttribute('value', curVal)
    valueInput.setAttribute('style', 'width: 100px;')
    valueInput.setAttribute('class', 'tag-value-edit')
    element.append(valueInput)
    tagValueDiv.setAttribute('style', 'display: none;') //can't add hidden tag, since the display: none gets overriden by library's css
}

function endTagEdit(element) {
    if (element.classList.contains('editing')) {
        element.classList.remove('editing')

        var nameInput = element.querySelector('.tag-name-edit')
        var tagNameDiv = element.querySelector('.tag-name')
        var newName = nameInput.value
        tagNameDiv.textContent = newName
        nameInput.remove()
        tagNameDiv.setAttribute('style', '') //removing display: none

        var valInput = element.querySelector('.tag-value-edit')
        var tagValueDiv = element.querySelector('.tag-value')
        var newValue = valInput.value
        tagValueDiv.textContent = newValue
        valInput.remove()
        tagValueDiv.setAttribute('style', '') //removing display: none
    }
}

function gatherTagEdits(tags) {
    var editedTags = []
    for (var i = 0; i < tags.length; i++) {
        if (tags[i].classList.contains('editing') && !tags[i].classList.contains('new-tag')) {
            var nameInput = tags[i].querySelector('.tag-name-edit')
            var newName = nameInput.value
            var valInput = tags[i].querySelector('.tag-value-edit')
            var newValue = valInput.value
            var tagId = tags[i].getAttribute('data-tag-id')
            var tagInfo = { 'tag_id': tagId, 'tag_name': newName, 'tag_value': newValue }
            editedTags.push(tagInfo)
        }
    }
    return editedTags 
}

function gatherTagCreations(tags) {
    if (!tags) {
        return []
    }

    var elementType = tags[0].parentElement.getAttribute('data-element-type')
    var elementId = tags[0].parentElement.getAttribute('data-elementid')

    var newTags = []
    for (var i = 0; i < tags.length; i++) {
        if (tags[i].classList.contains('new-tag')) {
            var nameInput = tags[i].querySelector('.tag-name-edit')
            var newName = nameInput.value
            var valInput = tags[i].querySelector('.tag-value-edit')
            var newValue = valInput.value
            var tagInfo = { 'tag_name': newName, 'tag_value': newValue, 'tag_type': elementType, 'tag_elId': elementId }
            newTags.push(tagInfo)
        }
    }
    return newTags
}

function createNewTag(element) {
    var infocard = element.parentElement.parentElement.parentElement
    var tagContainer = infocard.querySelector('.tags-container')

    var newTag = document.createElement('div')
    newTag.setAttribute('class', 'tag new-tag')

    var newTagName = document.createElement('div')
    newTagName.setAttribute('class', 'tag-name')

    var newTagDelimiter = document.createElement('div')
    newTagDelimiter.setAttribute('class', 'tag-name')
    newTagDelimiter.textContent = ':'

    var newTagValue = document.createElement('div')
    newTagValue.setAttribute('class', 'tag-value')

    newTag.append(newTagName)
    newTag.append(newTagDelimiter)
    newTag.append(newTagValue)
    tagContainer.append(newTag)

    editIfPossible(newTag)
}

function submitQuery() {
    var queryString = $('.library-searchbar-query').val()
    var songs = getSongs()
    var playlists = getPlaylists()

    try {
        var queryType = queryString.split(':')[0].toLowerCase().trim()
        var query = queryString.split(':')[1].trim()
    }
    catch (err) {
        //catches most bad input
        resetFilter(songs, playlists)
    }
    
    switch (queryType) {
        case 'name':
        case 'n':
            filterByTextProp(query, songs, playlists, 'name')
            break;
        case 'description':
        case 'desc':
        case 'd':
            filterByTextProp(query, songs, playlists, 'desc')
            break;
        case 'tag':
        case 't':
            filterByTag(query, songs, playlists)
            break;
        default:
            resetFilter(songs, playlists)
    }
}

//returns array of objects of form {name, desc, tags, HTMLelement}
function getSongs() {
    return getElements('infocard-song')
}

//returns array of objects of form {name, desc, tags, HTMLelement}
function getPlaylists() {
    return getElements('infocard-playlist')
}

function filterByTextProp(query, songs, playlists, textProp) {
    var filteredSongs = splitForFilteringByTextProp(query, songs, textProp)
    var filterInSongs = filteredSongs['filterInElements']
    var filterOutSongs = filteredSongs['filterOutElements']

    var filteredPlaylists = splitForFilteringByTextProp(query, playlists, textProp)
    var filterInPlaylists = filteredPlaylists['filterInElements']
    var filterOutPlaylists = filteredPlaylists['filterOutElements']

    resetFilter(songs, playlists)
    filterIn(filterInSongs)
    filterIn(filterInPlaylists)
    filterOut(filterOutSongs)
    filterOut(filterOutPlaylists)
}

function filterByTag(query, songs, playlists) {
    var split = query.split(' ')
    if (split.length != 3 && split.length != 2 && split.length != 1) {
        resetFilter(songs, playlists)
        return
    }

    var tagName = split[0].trim()
    var exp1 = split[1] ? split[1].trim() : '<=100'
    var exp2 = split[2] ? split[2].trim() : '>=0'

    if (!isTagExpressionValid(exp1) || !isTagExpressionValid(exp2)) {
        resetFilter(songs, playlists)
        return
    }

    var filteredSongs = splitForFilterByTag(tagName, exp1, exp2, songs)
    var filterInSongs = filteredSongs['filterInElements']
    var filterOutSongs = filteredSongs['filterOutElements']

    var filteredPlaylists = splitForFilterByTag(tagName, exp1, exp2, playlists)
    var filterInPlaylists = filteredPlaylists['filterInElements']
    var filterOutPlaylists = filteredPlaylists['filterOutElements']

    resetFilter(songs, playlists)
    filterIn(filterInSongs)
    filterIn(filterInPlaylists)
    filterOut(filterOutSongs)
    filterOut(filterOutPlaylists)
}

function resetFilter(songs, playlists) {
    for (var i = 0; i < songs.length; i++) {
        songs[i].HTMLelement.classList.remove('search-filter-in')
        songs[i].HTMLelement.classList.remove('search-filter-out')
    }
    for (var i = 0; i < playlists.length; i++) {
        playlists[i].HTMLelement.classList.remove('search-filter-in')
        playlists[i].HTMLelement.classList.remove('search-filter-out')
    }
}

function filterOut(elements) {
    for (var i = 0; i < elements.length; i++) {
        elements[i].HTMLelement.classList.add('search-filter-out')
    }
}

function filterIn(elements) {
    for (var i = 0; i < elements.length; i++) {
        elements[i].HTMLelement.classList.add('search-filter-in')
    }
}

//returns object of form {filterInElements, filterOutElements}
function splitForFilteringByTextProp(query, elements, textProp) {
    var filterInElements = []
    var filterOutElements = []

    for (var i = 0; i < elements.length; i++) {
        var element = elements[i]
        if (element[textProp].toLowerCase().includes(query)) {
            filterInElements.push(element)
        }
        else {
            filterOutElements.push(element)
        }
    }
    return { 'filterInElements': filterInElements, 'filterOutElements': filterOutElements}
}

//returns object of form {filterInElements, filterOutElements}
function splitForFilterByTag(tagName, exp1, exp2, elements) {

    var filterInElements = []
    var filterOutElements = []

    for (var i = 0; i < elements.length; i++) {
        var element = elements[i]
        if (hasSatisfyingTag(tagName, exp1, exp2, element)) {
            filterInElements.push(element)
        }
        else {
            filterOutElements.push(element)
        }
    }

    return { 'filterInElements': filterInElements, 'filterOutElements': filterOutElements }
}

function hasSatisfyingTag(tagName, exp1, exp2, element) {
    var exp1Equality = extractEquality(exp1)
    var exp1Value = extractValue(exp1)
    var exp2Equality = extractEquality(exp2)
    var exp2Value = extractValue(exp2)

    var tags = element['tags']
    for (var j = 0; j < tags.length; j++) {
        var tag = tags[j]
        if (tag['name'].toLowerCase().trim() == tagName.toLowerCase().trim()) {
            var tagValue = tag['value']
            var exp1String = '' + tagValue + exp1Equality + exp1Value
            var exp2String = '' + tagValue + exp2Equality + exp2Value
            if (eval(exp1String) && eval(exp2String)) {
                return true
            }
        }
    }
    return false
}

function extractProp(elements, prop) {
    var props = []
    for (var i = 0; i < elements.length; i++) {
        var el = elements[i]
        props.push(el[prop])
    }
    return props
}

//returns array of objects of form {name, desc, tags, HTMLelement}
function getElements(infocardClass) {
    var relevantInfocards = $('.' + infocardClass)
    var elements = []
    for (var i = 0; i < relevantInfocards.length; i++) {
        var name = relevantInfocards[i].querySelector('.infocard-main-text').textContent
        var desc = relevantInfocards[i].querySelector('.infocard-dropdown-text').textContent
        var tagDivs = relevantInfocards[i].querySelectorAll('.tag')
        var tags = gatherTags(tagDivs)
        var element = { 'name': name, 'desc': desc, 'tags': tags, 'HTMLelement': relevantInfocards[i] }
        elements.push(element)
    }
    return elements
}

//returns array of objects of form {name, value}
function gatherTags(tagDivs) {
    var tags = []
    for (var i = 0; i < tagDivs.length; i++) {
        var tagName = tagDivs[i].querySelector('.tag-name').textContent
        var tagValue = tagDivs[i].querySelector('.tag-value').textContent
        var tag = { 'name': tagName, 'value': tagValue }
        tags.push(tag)
    }
    return tags
}

function isTagExpressionValid(exp) {
    var regex = RegExp('(<=|>=|==|<|>)(\\d+)')
    return regex.test(exp)
}

function extractEquality(exp) {
    var regex = /<=|>=|==|<|>/
    return exp.match(regex)[0]
}

function extractValue(exp) {
    var regex = /\d+/
    return exp.match(regex)[0]
}

function togglePlaylistAddButtons(element) {
    var infocard = element.parentElement.parentElement.parentElement
    var buttonContainer = infocard.querySelector('.playlist-button-container')
    buttonContainer.classList.toggle('hidden')
}