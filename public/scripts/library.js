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
    var children = parent.querySelectorAll('button')
    console.log(children)
    for (var i = 0; i < children.length; i++) {
        children[i].classList.toggle('hidden')
    }
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