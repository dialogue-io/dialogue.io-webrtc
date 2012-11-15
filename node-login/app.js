
var http = require('http');
var fs = require('fs');
var path = require('path');
var express = require('express');
var exp = require('express');
var ensureDir = require('ensureDir');

fs.exists = fs.exists || require('path').exists;



var app = require('express').createServer();
var io = require('socket.io').listen(app);
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
//app.use("/js", express.static(__dirname + '/js'));
//app.use("/css", express.static(__dirname + '/css'));
app.use("/img", express.static(__dirname + '/img'));
app.listen(8080, function(){
 	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
app.root = __dirname;

app.dynamicHelpers({
    token: function(req, res) {
        return req.session._csrf;
    }
});

global.host = 'localhost';

require('./app/config')(app, exp);
require('./app/server/router')(app);

//Database access
var RM = require('./app/server/modules/room-manager');

var clientID = 1;

//Recursive system to list the amount of logfiles in the directory
var walk = function(dir, done) {
	var files = fs.readdirSync(dir)
	              .map(function(v) { 
	                  return { name:v,
	                           time:fs.statSync(dir + v).mtime.getTime()
	                         }; 
	               })
	               .sort(function(a, b) { return b.time - a.time; })
	               .map(function(v) { return v.name; });
	done(null,files);
};

function readLines(input, func) {
  var remaining = '';
  var total = 0;
  var count = 0;
  
  input.on('data', function(data) {
	for (i=0; i < data.length; ++i)
		if (data[i] == 10) count++;
    remaining += data;
    var index = remaining.indexOf('\n');
    var last  = 0;
    while (index > -1) {
      var line = remaining.substring(last, index);
      last = index + 1;
	if (count-total < 20) {
		func(line);
	}
	total++;
      index = remaining.indexOf('\n', last);
    }

    remaining = remaining.substring(last);
  });

  input.on('end', function() {
    if (remaining.length > 0) {
	if (total <= 0) {
		func(remaining);
		total++;
	}
    }
  });
}

//var usernames = {};
var usernamesdb = [];
var data = {rooms: []};
var sockets = {};
var ids = {};
io.sockets.on('connection', function (socket) {
	
	socket.on('setRoom',function(info){
		date = new Date();
		socket.username = info.username;
		socket.room = info.room;
		if (usernamesdb[info.room] == null || usernamesdb[info.room] == '') {
			usernamesdb[info.room] = [];
			usernamesdb[info.room].push(info.username);
		} else {
			usernamesdb[info.room].push(info.username);
		}
		//console.log(usernamesdb[info.room]);
		//usernames[info.username]=info.username;
		socket.join(info.room);
		ids[info.username.split('@')[1].split(')')[0]+info.room] = socket.id;
		//console.log(usernames);
		io.sockets.in(socket.room).emit('updateusers', usernamesdb[info.room]);
		ensureDir('./room/'+socket.room+'/logs/', 0755, function (err) {
			if(err) return next(err);
			try {
				fs.exists('room/'+socket.room+'/logs/'+date.toDateString()+'.html', function (exists) {
					if (exists == true) {
						//The file does exist
						var input = fs.createReadStream('room/'+socket.room+'/logs/'+date.toDateString()+'.html');
						var file = true;
						function func(data) {
							console.log(data.split('</strong>')[1]);
							socket.emit('updatechat',data.split('<strong>')[1].split(':</strong>')[0] , data.split(']:</strong>')[1],'true');
						}
						readLines(input, func);
					}
				});
			}
			catch (e) {
				console.log(e);
			}
			try {
				walk(process.cwd()+'/room/'+info.room+'/logs/', function(err, results) {
				  if (err) throw err;
				  io.sockets.emit('logfiles', results);
				});
			} catch (e) {
				console.log(e);
			}
		});
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
		io.sockets.in(socket.room).emit('updatechat', socket.username.split('(')[0], data);
		RM.checkLogs(socket.room, function(status){
			if (status == true) {
				var log = fs.createWriteStream('room/'+socket.room+'/logs/'+date.toDateString()+'.html', {'flags': 'a'});
		        log.write("- <strong>"+socket.username.split('(')[0]+"["+hours+":"+minutes+"]:</strong> "+data+"<br>\n");
			}
		});
	});

	//Sending files to all users
	socket.on('file', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('file', socket.username, data);
	});

	//Sending images
	socket.on('image', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('image', socket.username, data);
	});
		
	//Handling signalling messages
	socket.on('signaling', function (message,receiver,from,room) {
		// we tell the client to execute 'updatechat' with 2 parameters
		console.log("Signaling message to: "+receiver+room);
		to_id = ids[receiver+room];
		console.log(ids);
		//console.log("Message: "+message.data);
		//socket_to = sockets[to_id];
		io.sockets.socket(ids[receiver+room]).emit('onSignaling',message,from,receiver);
	});

	//Handling signalling messages
	socket.on('conference', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		//msg = JSON.stringify(data);
		console.log("New conference: "+data.room+data.participants.length);
		counter = data.participants.length;
		console.log(counter);
		if ((counter > 1) && (counter <4)) {
			for (i = 1; i < counter; i++) {
				//Send call to the actual for the rest
				io.sockets.socket(ids[data.participants[i-1].user+data.room]).emit('makeCall',data.participants[i].user);
				for (z = i+1; z < counter; z++)
				io.sockets.socket(ids[data.participants[i-1].user+data.room]).emit('makeCall',data.participants[z].user);
			}
		} 
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		//delete usernames[socket.username];
		for( var key in usernamesdb[socket.room] ) {
			if (usernamesdb[socket.room][key] == socket.username) {
				usernamesdb[socket.room].splice(key,1);
			}
		}
		//console.log(userlist[0]);
		//delete usernamesdb[socket.room][socket.username];
		delete ids[socket.username+socket.room];
		// update list of users in chat, client-side
		io.sockets.in(socket.room).emit('updateusers', usernamesdb[socket.room]);
		// echo globally that this client has left
		io.sockets.in(socket.room).emit('disconnect',socket.username);
		//socket.broadcast.emit('updatechat', '', socket.username + ' has disconnected');
	});
});
