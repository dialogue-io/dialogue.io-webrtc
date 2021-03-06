# dialogue.io/node
==================

Procedure for running this demo in [Node.js](http://nodejs.org/)

## Server (Ubuntu):

1. install node.js by running (one per time)
 * `% sudo apt-get install python-software-properties`
 * `% sudo add-apt-repository ppa:chris-lea/node.js`
 * `% sudo apt-get update`
 * `% sudo apt-get install nodejs npm`
2. go to the app folder and run
 * `% (sudo) npm install`
3. run `% node app.js`
4. ready to go!

## Client:  
Download [Chrome Canary](https://tools.google.com/dlpage/chromesxs/) for Windows/MacOSX.  
Download [Chrome Dev for Ubuntu](http://www.chromium.org/getting-involved/dev-channel/).  

## Monitoring

For keeping up node and monitoring any failure upstream and monitor are used. Both have their respective configuration files on the repo. They should be placed in the /etc/init/ and /etc/monit/ folder. This will run as a process and observe any crash restarting node when this happens.