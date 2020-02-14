
function toggleDropdown(element) {
    element.parentElement.parentElement.querySelector('.infocard-dropdown').classList.toggle('hidden')
    element.parentElement.parentElement.querySelector('.infocard-button-plus').classList.toggle('hidden')
    element.parentElement.parentElement.querySelector('.infocard-button-minus').classList.toggle('hidden')
}
