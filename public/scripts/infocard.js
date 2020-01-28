
function toggleDropdown(element) {
    element.parentElement.querySelector('.infocard-dropdown').classList.toggle('hidden')
    element.parentElement.querySelector('.infocard-button-plus').classList.toggle('hidden')
    element.parentElement.querySelector('.infocard-button-minus').classList.toggle('hidden')
}
