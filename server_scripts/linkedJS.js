
//This file is an example of extending the general server script to add more modules
//Example usage: (in a view)
//<button class="testing-button" onclick="console.log('<%= utils.linkedJS.linkedJSfunc() %>')">+</button>
//To add another:
//Add to /server_scripts/general.js :
//const myModule = require('./myFilename')
//and make sure to add myModule to the module.exports in general.js


function linkedJSfunc() {
    return 'linkedJSfunc()'
}


module.exports = {
    linkedJSfunc
}