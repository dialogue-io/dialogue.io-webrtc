var http = require('http');
var fs = require('fs');
var path = require('path');
var express = require('express');

var app = require('express').createServer();
var io = require('socket.io').listen(app);
app.use("/dist", express.static(__dirname + '/dist'));

app.listen(8080);
var clientID = 1;
// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};
var sockets = {};
var ids = {};
io.sockets.on('connection', function (socket) {
	
	//sockets[socket.id]=socket;
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('updatechat', socket.username, data);
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
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		//Store socket for sending individually
		//sockets[username] = socket;
		ids[username] = socket.id;
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected');
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
		// update the list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		//console.log(sockets);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
});