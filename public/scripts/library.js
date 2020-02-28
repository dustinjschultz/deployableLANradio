function libtest() {
    console.log('yay libtest()')
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
}

//returns array of objects of form {name, desc, tags}
function getSongs() {
    return getElements('infocard-song')
}

//returns array of objects of form {name, desc, tags}
function getPlaylists() {
    return getElements('infocard-playlist')
}

//returns array of objects of form {name, desc, tags}
function getElements(infocardClass) {
    var relevantInfocard = $('.' + infocardClass)
    var elements = []
    for (var i = 0; i < relevantInfocard.length; i++) {
        var name = relevantInfocard[i].querySelector('.infocard-main-text').textContent
        var desc = relevantInfocard[i].querySelector('.infocard-dropdown-text').textContent
        var tagDivs = relevantInfocard[i].querySelectorAll('.tag')
        var tags = gatherTags(tagDivs)
        var song = { 'name': name, 'desc': desc, 'tags': tags }
        elements.push(song)
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