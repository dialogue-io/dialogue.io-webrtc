
var http = require('http');
var fs = require('fs');
var path = require('path');
var express = require('express');

fs.exists = fs.exists || require('path').exists;



var app = require('express').createServer();
app.listen(8000, function(){
 	console.log("Express server for stats listening on port %d in %s mode", app.address().port, app.settings.env);
});
var io = require('socket.io').listen(8000);
//io.enable('browser client minification');  // send minified client
//io.enable('browser client etag');          // apply etag caching logic based on version number
//io.enable('browser client gzip');          // gzip the file
//io.set('log level', 1);                    // reduce logging just production!!!!!
io.set('transports', [                     // enable all transports (optional if you want flashsocket)
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);
//Those options are for production environment
app.use("/js", express.static(__dirname + '/app/js'));
app.use("/css", express.static(__dirname + '/app/css'));
app.use("/img", express.static(__dirname + '/app/img'));
app.root = __dirname;

global.host = 'localhost';

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/app/index.html');
});

//var usernames = {};
var usernames = [];
var data = {rooms: []};
var sockets = {};
var ids = {};
io.sockets.on('connection', function (socket) {
	
	socket.on('participant', function (message) {
		socket.username = message.username;
		console.log(message.username+' has connected with socketid '+socket.id);
		ids[message.username] = socket.id;
		usernames.push(message.username);
		io.sockets.emit('userlist', usernames);
		io.sockets.emit('newUser', message.username);
	});

	//Handling signalling messages
	socket.on('signaling', function (message,receiver,from) {
		// we tell the client to execute 'updatechat' with 2 parameters
		console.log("Signaling message to: "+receiver);
		to_id = ids[receiver];
		//console.log("Message: "+message.data);
		//socket_to = sockets[to_id];
		io.sockets.socket(ids[receiver]).emit('onSignaling',message,from,receiver);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		/*// remove the username from global usernames list
		//delete usernames[socket.username];
		*/for( var key in usernames ) {
			if (usernames[key] == socket.username) {
				usernames.splice(key,1);
			}
		}
		delete ids[socket.username];
		io.sockets.emit('userlist', usernames);
		/*
		//console.log(userlist[0]);
		//delete usernamesdb[socket.room][socket.username];
		delete ids[socket.username+socket.room];
		// update list of users in chat, client-side
		io.sockets.in(socket.room).emit('updateusers', usernamesdb[socket.room]);
		// echo globally that this client has left
		io.sockets.in(socket.room).emit('disconnect',socket.username);
		//socket.broadcast.emit('updatechat', '', socket.username + ' has disconnected');*/
	});
});
