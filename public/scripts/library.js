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
        console.log('editable')
    }
    else {
        console.log('not editable')
    }
}