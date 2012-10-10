

var http = require('http');
var fs = require('fs');
var path = require('path');
var express = require('express');
var exp = require('express');

var app = require('express').createServer();
var io = require('socket.io').listen(app);
app.use("/js", express.static(__dirname + '/js'));
app.use("/css", express.static(__dirname + '/css'));
app.use("/img", express.static(__dirname + '/img'));
app.use("/logs", express.static(__dirname + '/logs'));
app.listen(8080, function(){
 	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
app.root = __dirname;
global.host = 'localhost';

require('./app/config')(app, exp);
require('./app/server/router')(app);

var clientID = 1;

//Builds a new logfile every 24hours
var date = "";
var cronJob = require('cron').CronJob;
var job = new cronJob({
  cronTime: '00 01 00 * * 1-7',
  onTick: function() {
    // Runs every weekday
    date = new Date();
    fs.writeFile(logs/date.toDateString()+'.html', "Logfile for "+date+"\n", function(err) {
      if(err) {
         console.log(err);
      } else {
          console.log("New logfile was saved!");
      }
    });
  },
  start: false,
  timeZone: "Europe/Helsinki"
});
job.start();

//Recursive system to list the amount of logfiles in the directory
var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      //file = dir + '/' + file;
      file = file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

var usernames = {};
var sockets = {};
var ids = {};
io.sockets.on('connection', function (socket) {
	
	walk(process.cwd()+"/logs", function(err, results) {
	  if (err) throw err;
	  io.sockets.emit('logfiles', results);
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		date = new Date();
		var hours = date.getHours()
		var minutes = date.getMinutes()
		if (minutes < 10){
			minutes = "0" + minutes
		}
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('updatechat', socket.username.split('(')[0], data);
		var log = fs.createWriteStream('logs/'+date.toDateString()+'.html', {'flags': 'a'});
		// use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
	        log.write("- <strong>"+socket.username.split('(')[0]+"["+hours+":"+minutes+"]:</strong> "+data+"<br>\n");
	});

	//Sending files to all users
	socket.on('file', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('file', socket.username, data);
	});

	//Sending images
	socket.on('image', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('image', socket.username, data);
	});
		
	//Handling signalling messages
	socket.on('signaling', function (message) {
		// we tell the client to execute 'updatechat' with 2 parameters
		console.log("Signaling message to: "+message.to);
		to_id = ids[message.to];
		//console.log("Message: "+message.data);
		//socket_to = sockets[to_id];
		io.sockets.socket(ids[message.to]).emit('onSignaling',message);
	});
	

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		date = new Date();
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		//Store socket for sending individually
		//sockets[username] = socket;
		ids[username] = socket.id;
		// echo to client they've connected
		socket.emit('updatechat', '', 'you have connected');
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('updatechat', '', username + ' has connected');
		// update the list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		//console.log(sockets);
		var log = fs.createWriteStream('logs/'+date.toDateString()+'.html', {'flags': 'a'});
		// use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
	        //log.write("BOT : "+username+" has connected<br>\n");
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('disconnect',socket.username);
		socket.broadcast.emit('updatechat', '', socket.username + ' has disconnected');
	});
});
