
var CT = require(__dirname+'/modules/country-list');
var AM = require(__dirname+'/modules/account-manager');
var EM = require(__dirname+'/modules/email-dispatcher');
var RM = require(__dirname+'/modules/room-manager');


module.exports = function(app) {

	app.dynamicHelpers({
    	token: function(req, res) {
        	return req.session._csrf;
    	}
	});

// main login page //

	app.get('/', function(req, res){
	console.log('login', req.cookies.user, req.cookies.pass);		
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { locals: { title: 'Hello - Please Login To Your Account'}});
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
					res.redirect('/home');
				}	else{
					res.render('login', { locals: { title: 'Hello - Please Login To Your Account'}});
				}
			});
		}
	});
	
	app.post('/', function(req, res){
		if (req.param('email') != null){
			AM.getEmail(req.param('email'), function(o){
				if (o){
					res.send('ok', 200);
					EM.send(o, function(e, m){ console.log('error : '+e, 'msg : '+m)});	
				}	else{
					res.send('email-not-found', 400);
				}
			});
		}	else{
		// attempt manual login //
			AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
				if (!o){
					res.send(e, 400);
				}	else{
				    req.session.user = o;
					if (req.param('remember-me') == 'true'){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });
					}			
					res.send(o, 200);
				}
			});
		}
	});	

// Admin page //

	app.get('/admin', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
			console.log('Admin entering: '+req.session.user.email+' '+req.session.user.admin);
			if (req.session.user.admin == "true") {
				console.log('Admin is in: '+req.session.user.email);
				AM.getAllRecords( function(e, accounts){
					RM.getAllRecords( function(e, roomslist) {
						res.render('admin', {
							locals: {
								title : 'dialogue.io - Admin page',
								countries : CT,
								udata : req.session.user,
								accts : accounts,
								rooms : roomslist
							}
						});
					});
				});
			} else {
				res.redirect('/');
			}
	    }
	});
	
	app.post('/admin', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.session.user.admin == "true") {
			if (req.param('user') != undefined) {
				AM.update({
					user 		: req.param('user'),
					name 		: req.param('name'),
					email 		: req.param('email'),
					country 	: req.param('country'),
					pass		: req.param('pass')
				}, function(o){
					if (o){
						req.session.user = o;
				// udpate the user's login cookies if they exists //
						if (req.cookies.user != undefined && req.cookies.pass != undefined){
							res.cookie('user', o.user, { maxAge: 900000 });
							res.cookie('pass', o.pass, { maxAge: 900000 });	
						}
						res.send('ok', 200);
					}	else{
						res.send('error-updating-account', 400);
					}
				});
			}	else if (req.param('logout') == 'true'){
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function(e){ res.send('ok', 200); });
			}	else if (req.param('update') == 'true'){
				for (var user in req.param('users')){
					var obj = req.param('users')[user];
					AM.updateAdmin({
						user 		: obj.name,
						admin		: obj.admin
					}, function(o){
						if (o == true){
							res.send('ok', 200);
						}	else {
							res.send('error-updating-account', 400);
						}
					});
				}
			}
		} else {
			res.redirect('/');
		}
	});
	
// logged-in user homepage //
	
	app.get('/home', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
	    	roomlistowned = '';
			if (req.session.user.admin == "true") {
				RM.findByOwner(req.session.user.user,function(e, roomlist){
					//console.log(roomlist);
					roomlistowned = roomlist;
					roomlist='';
					RM.findByMember(req.session.user.user,function(e,roomlist){
						res.render('home', {
							locals: {
								title : 'dialogue.io',
								countries : CT,
								udata : req.session.user,
								rooms : roomlist,
								roomsowned : roomlistowned
							}
						});
					});
				});
			} else {
				RM.findByOwner(req.session.user.user,function(e, roomlist){
					//console.log(roomlist);
					roomlistowned = roomlist;
					roomlist='';
					RM.findByMember(req.session.user.user,function(e,roomlist){
						res.render('home', {
							locals: {
								title : 'dialogue.io',
								countries : CT,
								udata : req.session.user,
								rooms : roomlist,
								roomsowned : roomlistowned
							}
						});
					});
				});
			}
	    }
	});
	
	app.post('/home', function(req, res){
		if (req.param('user') != undefined) {
			AM.update({
				user 		: req.param('user'),
				name 		: req.param('name'),
				email 		: req.param('email'),
				country 	: req.param('country'),
				pass		: req.param('pass')
			}, function(o){
				if (o){
					req.session.user = o;
			// udpate the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.send('ok', 200);
				}	else{
					res.send('error-updating-account', 400);
				}
			});
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});	

// Create room homepage //
	
	app.get('/createroom', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
			res.render('createroom', {
				locals: {
					title : 'dialogue.io - Create your own room',
					countries : CT,
					udata : req.session.user
				}
			});
	    }
	});
	
	app.post('/createroom', function(req, res){
		if (req.param('user') != undefined) {
			AM.update({
				user 		: req.param('user'),
				name 		: req.param('name'),
				email 		: req.param('email'),
				country 	: req.param('country'),
				pass		: req.param('pass')
			}, function(o){
				if (o){
					req.session.user = o;
			// udpate the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.send('ok', 200);
				}	else{
					res.send('error-updating-account', 400);
				}
			});
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}	else if (req.param('createroom') != undefined){
			//Converts the string of users to members in JSON format
		    //console.log(req.param('memberslist'));
			RM.create({
				name 	: req.param('name'),
				address 	: req.param('address'),
				token 	: req.param('token'),
				owner	: req.param('createroom'),
				members : req.param('memberslist'),
				logs	: req.param('logs')
			}, function(e, o){
				if (e){
					res.send(e, 400);
				}	else{
					res.send('ok', 200);
				}
			});
		}

	});	



// Settings for users //

	app.get('/settings', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
		res.render('settings', {
			locals: {
				title : 'Settings - dialogue.io',
				countries : CT,
				udata : req.session.user
			}
		});
	    }
	});
	
	app.post('/settings', function(req, res){
	// check if the user's credentials are saved in a cookie //
	   if (req.cookies.user == undefined || req.cookies.pass == undefined){
	      res.render('login', 
		 { locals: 
		    { title: 'Hello - Please Login To Your Account' }
		 }
	      );
	   } else{
	   // attempt automatic login //
	      AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
		 if (o != null){
		    req.session.user = o;
		    res.redirect('/settings');
		 }  else{
		    res.render('login', 
		       { locals: 
			  { title: 'Hello - Please Login To Your Account' }
		       }
		    );
		 }
	      });
	   }
	});

// Room for NMPS //

	//Handling logs

	app.get('/room/:room/:option/:file'  , function(req, res) {
		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
	        res.redirect('/');
        } else if (req.params.option == 'logs') {
        	//Check if user is member of the room, if not redirect to homepage and prohibit to access logfile
		//console.log("searching for file in "+require('path').dirname(require.main.filename));
	    	home_dir = require('path').dirname(require.main.filename);
		RM.findByAddress(req.params.room.toLowerCase(),function(e,o){
	    		if (o.owner == req.session.user.user) {
					res.sendfile(home_dir+'/room/'+req.params.room+'/'+req.params.option+'/'+req.params.file);
	    		} else {
					RM.isMember(req.params.room.toLowerCase(), req.session.user.user, function(status){
						//Not owner but member of the room
						if (status == true) {
							res.sendfile(home_dir+'/room/'+req.params.room+'/'+req.params.option+'/'+req.params.file);
						} else {
					        res.redirect('/');
						}
					});    			
	    		}
	    	});
	    }
	});

	app.get('/room/:room/:option'  , function(req, res) {
		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
	        res.redirect('/');
        } else if (req.params.option == 'settings') {
	    	RM.findByAddress(req.params.room.toLowerCase(),function(e,o){
	    		if (o.owner == req.session.user.user) {
					res.render('settings_room', {
						locals: {
							title : o.name+' room settings - dialogue.io',
							udata : req.session.user,
							room : o
						}
					});
	    		} else {
			        res.redirect('/');			
	    		}
	    	});        	
	    }
	});

	app.post('/room/:room/:option'  , function(req, res) {
		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
	        res.redirect('/');
        } else if (req.params.option == 'settings') {
	        if (req.param('updateroom') != undefined){
				//Converts the string of users to members in JSON format
				RM.update({
					name 	: req.param('name'),
					address 	: req.param('address'),
					token 	: req.param('token'),
					owner	: req.param('updateroom'),
					members : req.param('memberslist'),
					logs	: req.param('logs')
				}, function(e, o){
					if (e){
						res.send(e, 400);
					}	else{
						res.send('ok', 200);
					}
				});
			}
		} else if (req.params.option == 'delete') {
	    	RM.findByAddress(req.params.room.toLowerCase(),function(e,o){
	    		if (o.owner == req.session.user.user) {
					RM.delete(req.param('id'), function(e, obj){
						if (!e){
							res.redirect('/');
						}	else{
							res.send('record not found', 400);
						}
					});
	    		} else {
			        res.redirect('/');			
	    		}
	    	});     
		}
	});

	app.get('/room/:room', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    } else {
	    	//Checks URL and saves the name of room in req.params[0]
	    	RM.findByAddress(req.params.room.toLowerCase(),function(e,o){
	    		if (o) {
	    			if (o.owner == req.session.user.user) {
						res.render('room', {
							locals: {
								title : o.name+' room - dialogue.io',
								udata : req.session.user,
								room : o
							}
						});
					} else {
						RM.isMember(req.params.room.toLowerCase(), req.session.user.user, function(status){
							//Not owner but member of the room
							if (status == true) {
								res.render('room', {
									locals: {
										title : o.name+' room - dialogue.io',
										udata : req.session.user,
										room : o
									}
								});
							} else {
								res.render('token', {
									locals: {
										title : o.name+' access - dialogue.io',
										udata : req.session.user,
										room : o
									}
								});
								//We need to enter the token for accessing if not members
							}
							//res.send("token");
						});
					}
	    		} else {
	    			res.redirect('/');
	    		}
			});
	    }
	});

	app.post('/room/:rooms', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.param('user') != undefined) {
			AM.update({
				user 		: req.param('user'),
				name 		: req.param('name'),
				email 		: req.param('email'),
				country 	: req.param('country'),
				pass		: req.param('pass')
			}, function(o){
				if (o){
					req.session.user = o;
			// udpate the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.send('ok', 200);
				}	else{
					res.send('error-updating-account', 400);
				}
			});
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		} else if (req.param('token') != undefined) {
			RM.checkToken(req.param('address'),req.param('token')[0],req.session.user.user, function(response){
				if (response == 'invalid-token') {
					res.send('invalid-token',400);
				} else if(response == 'room-not-found') {
					res.send('room-not-found',400);
				} else if(response.address) {
					res.send('ok', 200);
				}
			});
		}
	});
	
// creating new accounts //	
	
	app.get('/signup', function(req, res) {
		res.render('signup', { 
			locals: { title: 'Signup', countries : CT }
		});
	});
	
	app.post('/signup', function(req, res){
		AM.signup({
			name 	: req.param('name'),
			email 	: req.param('email'),
			user 	: req.param('user'),
			pass	: req.param('pass'),
			country : req.param('country'),
			admin   : false
		}, function(e, o){
			if (e){
				res.send(e, 400);
			}	else{
				res.send('ok', 200);
			}
		});
	});

// password reset //

	app.get('/reset-password', function(req, res) {
		AM.validateLink(req.query["u"], function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
				res.render('reset', {
					locals: {
						title : 'Reset Password', pid : req.query["u"]
					}
				});
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		AM.setPassword(req.param('pid'), req.param('pass'), function(o){
			if (o){
				res.send('ok', 200);
			}	else{
				res.send('unable to update password', 400);
			}
		})
	});	
	
	
// view & delete accounts //
	/*app.get('/print', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
		AM.getAllRecords( function(e, accounts){
			res.render('print', { locals: { title : 'Account List', accts : accounts } });
		})
	    }
	});
	
	//app.get('/print', function(req, res) {
	//	AM.getAllRecords( function(e, accounts){
	//		res.render('print', { locals: { title : 'Account List', accts : accounts } });
	//	})
	//});*/	
	
	app.post('/delete', function(req, res){
		AM.delete(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
	            req.session.destroy(function(e){ res.send('ok', 200); });
			}	else{
				res.send('record not found', 400);
			}
	    });
	});
	
	//app.get('/reset', function(req, res) {
	//	AM.delAllRecords( );
	//	res.redirect('/print');
	//});
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
