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
    if (infocard.classList.contains('tags-editable')) {
        startTagEdit(element)
    }
}

function saveTags(element) {
    toggleTagEdits(element)
    //TODO: saving
}

function startTagEdit(element) {
    //TODO: 
    console.log('trying to edit: ')
    console.log(element)
}