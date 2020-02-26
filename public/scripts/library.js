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
    //TODO: saving
    //TODO: remove '.editing' from tag
}

function startTagEdit(element) {
    element.classList.add('editing')

    var nameInput = document.createElement('input')
    var tagNameDiv = element.querySelector('.tag-name')
    var curName = tagNameDiv.textContent
    nameInput.setAttribute('type', 'text')
    nameInput.setAttribute('value', curName)
    nameInput.setAttribute('style', 'width: 100px;')
    element.insertBefore(nameInput, element.childNodes[0] || null) //put the input first
    tagNameDiv.setAttribute('style', 'display: none;') //can't add hidden tag, since the display: none gets overriden by library's css

    var valueInput = document.createElement('input')
    var tagValueDiv = element.querySelector('.tag-value')
    var curVal = tagValueDiv.textContent
    valueInput.setAttribute('type', 'text')
    valueInput.setAttribute('value', curVal)
    valueInput.setAttribute('style', 'width: 100px;')
    element.append(valueInput)
    tagValueDiv.setAttribute('style', 'display: none;') //can't add hidden tag, since the display: none gets overriden by library's css
}