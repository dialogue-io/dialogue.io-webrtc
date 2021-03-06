var bcrypt = require('bcrypt')
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;

//var dbPort = 27017;
//var dbHost = global.host;
//var dbName = 'login-testing';

var dbPort = 10000;
var dbHost = 'alex.mongohq.com';
var dbName = 'Dialoguedb';

// use moment.js for pretty date-stamping //
var moment = require('moment');

var RM = {}; 
	RM.db = new Db(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}, {}), {safe:false});
	RM.db.open(function(e, d){
		RM.db.authenticate('dialogue', 'dialogue-webrtc', function(err2,data2){
			if (e || err2) {
				console.log(e+' '+err2);
			}	else{
				console.log('connected to database rooms:: ' + dbName);
			}
		});
	});
	RM.rooms = RM.db.collection('rooms');
module.exports = RM;

// record insertion, update & deletion methods //

RM.create = function(newData, callback) 
{
	//memberslist = newData.members;
	if (newData.members != ""){
		newData.members= newData.members.replace( /,$/, "" ).split(",").map(function(member) {
        	return member;
    	});
	} else {
		newData.members = null;
	}
	//newData.members = [];
	RM.rooms.findOne({name:newData.name}, function(e, o) {	
		if (o){
			callback('name-taken');
		}	else{
			RM.rooms.findOne({address:newData.address}, function(e, o) {
				if (o){
					callback('address-taken');
				}	else{
					newData.features = [1,1,0,0,0];
					newData.lastaccess = "";
					newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
					//console.log(newData.private_room);
					if (newData.private_room == true) {
						RM.saltAndHash(newData.token, function(hash){
							newData.token = hash;
						// append date stamp when record was created //
							//if (memberslist != undefined) newData.members = [];
						    //for (i=0; i<memberslist.split(',').length; i++) {
						    	//newData.members.push(memberslist.split(',')[i]);
						    //}
						    console.log(newData.members);
						    //console.log(memberslist);
						    //newData.members = memberslist;
							RM.rooms.insert(newData, callback(null));
						});						
					} else {
						//No password token
						newData.token = "";
						RM.rooms.insert(newData, callback(null));
					}

				}
			});
		}
	});
}

RM.update = function(newData, callback) 
{		
	RM.rooms.findOne({address:newData.address}, function(e, o){
		o.name 		= newData.name;
		//o.address   = newData.address;
			//memberslist = newData.members;
		if (newData.members != ""){
			newData.members= newData.members.replace( /,$/, "" ).split(",").map(function(member) {
	        	return member;
	    	});
		} else {
			newData.members = null;
		}
		o.members   = newData.members;
		o.logs  = newData.logs;
		o.private_room = newData.private_room;
		//o.owner = newData.owner;
		if (newData.private_room == 'true'){
			if (newData.token == ''){
				RM.rooms.save(o); callback(null,o);
			} else{
				RM.saltAndHash(newData.token, function(hash){
					o.token = hash;
					RM.rooms.save(o); callback(null,o);			
				});
			}
		} else if(newData.private_room == 'false'){
			newData.token = "";
			RM.rooms.save(o); callback(null,o);
		}
		callback(e);
	});
}

RM.saltAndHash = function(pass, callback)
{
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(pass, salt, function(err, hash) {
			callback(hash);
	    });
	});
}

// auxiliary methods //

RM.getName = function(name, callback)
{
	RM.rooms.findOne({name:name}, function(e, o){ callback(o); });
}

RM.getOwner = function(owner, callback)
{
	RM.rooms.findOne({owner:owner}, function(e, o){ callback(o); });
}

RM.getAddress = function(address, callback)
{
	RM.rooms.findOne({address:address}, function(e, o){ callback(o); });
}

RM.getToken = function(token, callback)
{
	RM.rooms.findOne({token:token}, function(e, o){ callback(o); });
}

RM.getObjectId = function(id)
{
// this is necessary for id lookups, just passing the id fails for some reason //	
	return RM.rooms.db.bson_serializer.ObjectID.createFromHexString(id)
}

RM.getAllRecords = function(callback) 
{
	RM.rooms.find().toArray(
	    function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};


RM.findByOwner = function(owner, callback) 
{
	RM.rooms.find({owner: owner}).toArray(
	    function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

RM.findByMember = function(member, callback) 
{	
	RM.rooms.find({members: member}).toArray(
	    function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

RM.findByAddress = function(address, callback) 
{
	RM.rooms.findOne({address:address}, function(e, o) {
		if (o){
			o.lastaccess = moment().format('MMMM Do YYYY, h:mm:ss a');
			//date = new Date();
			//o.lastaccess = date.getTime();
			RM.rooms.save(o);
			callback(null,o);
		} else {
			callback(e,null);
		}
	});
};

RM.findById = function(id, callback) 
{
	RM.rooms.findOne({_id:this.getObjectId(id)}, function(e, o) {
		if (o){
			callback(o);
		} else {
			console.log(e);
			callback(null);
		}
	});
};

RM.isMember = function(address, member, callback) 
{
	RM.rooms.findOne({address:address}, function(e, o) {
		if (o){
			toggle = null;
			if (o.private_room == 'true') {
				if (o.members != null) {
					for (i=0; i<o.members.length; i++) {
						if (o.members[i] == member) {
							toggle = true;
							callback(true);
						}
					}
				}
				if (toggle != true) callback(false);
			} else {
				callback('open');
			}
		}
	});
};

RM.checkLogs = function(address, callback) 
{
	RM.rooms.findOne({address:address}, function(e, o) {
		if (o.logs == "on"){
			callback(true);
		} else {
			callback(false);
		}
	});
};

RM.lastMessage = function(address, date) 
{
	RM.rooms.findOne({address:address}, function(e, o) {
		if (o) {
			o.lastmessage = date.getTime();
			//o.lastmessage = moment().format('MMMM Do YYYY, h:mm:ss a');
			RM.rooms.save(o);
		}
	});
};


RM.checkToken = function(address, token, member, callback) 
{	
	//Checks token and adds member if token is correct
	RM.rooms.findOne({address:address}, function(e, o) {
		if (o == null){
			callback('room-not-found');
		} else {
			bcrypt.compare(token, o.token, function(err, res) {
				if (res) {
					//Token checked and user added to the room
					//console.log(member);
					if (o.memberslist == null) {
						var memberslist = [];
						memberslist.push(member);
						o.members = memberslist;
					} else {
						o.members.push(member);
					}
					//console.log(o.members+' '+member);
					RM.rooms.save(o, callback(o));
					//RM.accounts.save(o);
					//callback(o);
				} else {
					callback('invalid-token');
				}
			});
		}
	});
};

RM.delete = function(id, callback) 
{
	RM.rooms.remove({_id: this.getObjectId(id)}, callback);
}
