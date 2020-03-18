# deployableLANradio
My Honors Capstone Project

LANDR is an experimental musical collaboration tool featuring playlist generation using machine learning. LANDR is the Local Area Network Deployable Radio. 
It takes a new spin on traditional predictions, by factoring in user-defined “tags” to conform to the desires of the user. 
Allowing for users to collaborate on playlists used to train the machine, it can make a playlist that’ll satisfy all connected users.

Featuring an exclusivity to users on your immediate Wi-Fi, only those desired can influence the machine’s playlist generation. 
By playing songs together, the algorithm will help adjust the attributes of the song by noting what other songs they’re played with. 
Overtime, perfect tags will be formed, perfectly describing a song so it can be fit perfectly with others that are similar.

At the time of writing, LANDR is still in development. 
No findings have been derived yet, but should it prove successful the machine learning strategies and tagging methods can be applied to other major music players.

**Initialization**: 

Install and run MongoDB

Setup the database using

`npm run initdb`

**Running**:

Run LANDR using

`npm start`