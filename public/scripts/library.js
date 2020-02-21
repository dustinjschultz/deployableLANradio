function libtest() {
    console.log('yay libtest()')
}

function toggleTagEdits(element) {
    var infocard = element.parentElement.parentElement.parentElement
    infocard.classList.toggle('tags-editable')
}

function editIfPossible(element) {
    var infocard = element.parentElement.parentElement.parentElement.parentElement
    if (infocard.classList.contains('tags-editable')) {
        startTagEdit(element)
    }
}

function startTagEdit(element) {
    //TODO: 
    console.log('trying to edit: ')
    console.log(element)
}