
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

var AM = {}; 
	AM.db = new Db(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}, {}), {safe:false});
	AM.db.open(function(e, d){
		AM.db.authenticate('dialogue', 'dialogue-webrtc', function(err2,data2){
			if (e || err2) {
				console.log(e+' '+err2);
			}	else{
				console.log('connected to database users:: ' + dbName);
			}
		});
	});
	AM.accounts = AM.db.collection('accounts');
module.exports = AM;

// logging in //

AM.autoLogin = function(user, pass, callback)
{
	AM.accounts.findOne({user:user}, function(e, o) {
		if (o){
			if (o.pass == pass) {
				o.lastdate = moment().format('MMMM Do YYYY, h:mm:ss a');
				AM.accounts.save(o);
				callback(o);
			} else {
				callback(null);
			}
			//o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
}

AM.manualLogin = function(user, pass, callback)
{
	AM.accounts.findOne({user:user}, function(e, o) {
		if (o == null){
			callback('user-not-found');
		}	else{
			bcrypt.compare(pass, o.pass, function(err, res) {
				if (res){
					o.lastdate = moment().format('MMMM Do YYYY, h:mm:ss a');
					AM.accounts.save(o);
					callback(null, o);
				}	else{
					callback('invalid-password');				
				}
			});
		}
	});
}

// record insertion, update & deletion methods //

AM.signup = function(newData, callback) 
{
	AM.accounts.findOne({user:newData.user}, function(e, o) {	
		if (o){
			callback('username-taken');
		}	else{
			AM.accounts.findOne({email:newData.email}, function(e, o) {
				if (o){
					callback('email-taken');
				}	else{
					AM.saltAndHash(newData.pass, function(hash){
						newData.pass = hash;
						newData.lastVisited = null;
					// append date stamp when record was created //	
						newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
						AM.accounts.insert(newData, callback(null));
					});
				}
			});
		}
	});
}

AM.update = function(newData, callback) 
{		
	AM.accounts.findOne({user:newData.user}, function(e, o){
		o.name 		= newData.name;
		o.email 	= newData.email;
		o.country 	= newData.country;
		if (newData.pass == ''){
			AM.accounts.save(o); callback(o);
		}	else{
			AM.saltAndHash(newData.pass, function(hash){
				o.pass = hash;
				AM.accounts.save(o); callback(o);			
			});
		}
	});
}

AM.updateAdmin = function(newData, callback) 
{		
	AM.accounts.findOne({user:newData.user}, function(e, o){
		o.admin		= newData.admin;
		AM.accounts.save(o); callback(true);
	});
}


AM.setPassword = function(oldp, newp, callback)
{
	AM.accounts.findOne({pass:oldp}, function(e, o){
		AM.saltAndHash(newp, function(hash){
			o.pass = hash;
			AM.accounts.save(o); callback(o);
		});
	});	
}

AM.validateLink = function(pid, callback)
{
	AM.accounts.findOne({pass:pid}, function(e, o){
		callback(o ? 'ok' : null);
	});
}

AM.saltAndHash = function(pass, callback)
{
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(pass, salt, function(err, hash) {
			callback(hash);
	    });
	});
}

AM.delete = function(id, callback) 
{
	AM.accounts.remove({_id: this.getObjectId(id)}, callback);
}

// auxiliary methods //

AM.getEmail = function(email, callback)
{
	AM.accounts.findOne({email:email}, function(e, o){ callback(o); });
}

AM.getObjectId = function(id)
{
// this is necessary for id lookups, just passing the id fails for some reason //	
	return AM.accounts.db.bson_serializer.ObjectID.createFromHexString(id)
}

AM.getAllRecords = function(callback) 
{
	AM.accounts.find().toArray(
	    function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

AM.delAllRecords = function(id, callback) 
{
	AM.accounts.remove(); // reset accounts collection for testing //
}

// just for testing - these are not actually being used //

AM.findById = function(id, callback) {
	AM.accounts.findOne({_id: this.getObjectId(id)}, 
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

/*AM.findByUser = function(id, callback) {
	AM.accounts.findOne({_id: this.getObjectId(id)}, 
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};*/

AM.findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	AM.accounts.find( { $or : a } ).toArray(
	    function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}

AM.lastVisited = function(room, user, callback) {
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	//console.log(room._id +' '+ user);
	AM.accounts.findOne({user: user}, function(e, o) {
		if (e) {
			console.log(e);
			callback(null);
		} else if(o) {
			if ((o.lastVisited == null) || (typeof o.lastVisited == 'undefined')) {
				if ((room._id.toString() != null) && (room != '')) {
					var lastVisited = [];
					lastVisited.unshift(room);
					o.lastVisited = lastVisited;
					AM.accounts.save(o); callback(o);
				}
			} else {
				//Total lastVisited rooms set to 5, if not, delete
				//also check if the room is already in lastVisited array to avoid duplicates
				//console.log(room._id.toString());
				if (o.lastVisited.indexOf(room) == -1) {
					if (o.lastVisited.length < 5) {
						if ((room != null) && (room != ''))
						o.lastVisited.unshift(room);
					} else {
						if ((room != null) && (room != '')) {
							o.lastVisited.pop();
							o.lastVisited.unshift(room);
						}
					}
					AM.accounts.save(o); 
				}
				callback(o);
			}
		} else {
			console.log('Error '+o);
			callback(null);
		}
	});
}