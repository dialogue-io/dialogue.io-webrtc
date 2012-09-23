/*
 * Library for performing WebRTC calls in an object environment.
 * Chrome Canary required.
 * Ericsson 2012
 */

(function(exports) {
	
	var Conference = function() {
		var Conference = {};
		
		var localVideo = null,
			callee = null,
			remoteVideo = null,
			localStream = null;
			initiator = null,
			started = null,
			PeerConn = null;
			
			//Temporary hack
		/*var iceUfrags = [];
			icePwds = [];
			needFormatCandidate = false;*/
			
		Conference.Call = function(identifier,div,callback) {
			initiator = true;
			if ((Conference.remoteVideo == null) && (Conference.callee == null)) {
				Conference.setCallee(identifier,div,function(status){
					if (status == false) {
						Console.log("Cannot perform call, problems setting up the DOM elements");
						callback(false);
					} else if (status==true) {
						console.log("Accessing the user media");
						if (Conference.localStream == null) {
							Conference.getUserMedia(function(status){
								if (status == false){
									console.log("Failed to get access to the media, cancelling the call");
									callback(false);							
								} else if (status == true) {
									console.log("Proceeding with the call "+initiator);
									if (initiator) maybeStart();
									callback(true);						
								}
							});
						} else {
							if (Conference.localVideo == null) {
								console.log("First set localVideo");
								callback(false);
							} else {
								if (initiator) maybeStart();
								callback(true);						
							}
						}
					}
				});
			}
		};
		
		Conference.Answer = function(identifier,div,callback) {
			Conference.initiator = false;
			if ((Conference.remoteVideo == null) && (Conference.callee == null)) {
				Conference.setCallee(identifier,div,function(status){
					if (status == false) {
						Console.log("Cannot perform call, problems setting up the DOM elements");
						callback(false);
					} else if (status==true) {
						console.log("Accessing the user media");
						if (Conference.localStream == null) {
							Conference.getUserMedia(function(status){
								if (status == false){
									console.log("Failed to get access to the media, cancelling the call");
									callback(false);							
								} else if (status == true) {
									console.log("Proceeding with the call");
									callback(true);						
								}
							});
						} else {
							callback(true);						
						}
					}
				});
			}
		};
		
		Conference.setRemoteVideo = function(tag,callback) {
			getElement(tag, function(element){
				if (element==false) {
					console.log("No DOM "+tag+" found");
					remoteVideo = null;
					callback(true);
				} else {
					remoteVideo = element;
					callback(false);
				}
			});
		};

		Conference.setLocalVideo = function(tag,callback) {
			getElement(tag, function(element){
				if (element==false) {
					console.log("No DOM "+tag+" found");
					localVideo = null;
					callback(false);
				} else {
					localVideo = element;
					console.log("Local video set");
					callback(true);
				}
			});
		};
		
		Conference.setLocalStream = function(stream,callback) {
		    console.log("User has granted access to local media.");
			if ((typeof MediaStream !== "undefined" && MediaStream !== null) && stream instanceof MediaStream) {
		    	if (localVideo.src == null || localVideo.src == '') {
		    		localVideo.style.opacity = 1;
		    		localVideo.src = stream;
		    	}
		        localStream = stream;
		        return localVideo.pl
		   	} else {
		   		localStream = stream;
		    	if (localVideo.src == null || localVideo.src == '') {
		    		localVideo.style.opacity = 1;
		        	var vendorURL = window.URL || window.webkitURL;
		        	localVideo.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
		        }
		    }
			if (callback) {
				callback(true);
			}
		};

		Conference.onChannelMessage = function(message) {
		  	//callee = message.from;
			console.log('S->C: ' + message.data);
			_message = JSON.parse(message.data);
			if (_message.type == 'offer') {
	        	if (!initiator && !started) maybeStart();
	        	PeerConn.setRemoteDescription(PeerConn.SDP_OFFER, new SessionDescription(_message.sdp));
	        	//checkIceFormat(_message.sdp);
	        	doAnswer();
			} else if (_message.type === 'answer' && started) {
				PeerConn.setRemoteDescription(PeerConn.SDP_ANSWER, new SessionDescription(_message.sdp));
	        	//checkIceFormat(_message.sdp);
			} else if (_message.type === 'candidate' && started) {
				//var candidateString = maybeAddIceCredentials(_message);
				var candidate = new IceCandidate(_message.label, _message.candidate);
				PeerConn.processIceMessage(candidate);
			} else if (_message.type ==='bye' && started) {
				onRemoteHangup();
			}
		};
		
		Conference.setCallee = function(identifier,div,callback) {
			var _identifier = identifier;
			var _div = div;
			callee = _identifier;
			//Video tag not generated
			if (remoteVideo == null) {
				getElement(div, function(element){
					if (element==false) {
						console.log("No DOM "+div+" found");
						_div = null;
						callback(false);
					} else {
						_div = element;
						//newdiv=document.createElement("div");
						//newdiv.setAttribute("id","div"+_identifier);
						//_div.appendChild(newdiv);
						remoteVideo = document.createElement("video");
						remoteVideo.setAttribute("id","video"+_identifier);
						remoteVideo.setAttribute("autoplay","autoplay");
						remoteVideo.setAttribute("style","-webkit-transition: opacity 2s; -webkit-transform: scale(-1, 1); opacity: 1; margin-right: 3px; height:90%;");
						//remoteVideo.setAttribute("width","320px");
						remoteVideo.setAttribute("height","240px");
						//remoteVideo.setAttribute("onclick","mainWindow(this)");
						_div.appendChild(remoteVideo);
						console.log("remoteVideo configuration finished, waiting for call");
						callback(true);
					}
				});				
			}	
		};

  		Conference.onHangup = function(callback) {
    		console.log("Hanging up.");
    		//setStatus("Hanging up...");
    		remoteVideo.style.opacity = 0;
			remoteVideo.src = null;
    		PeerConn.close();
    		// will trigger BYE from server
    		console.log('C->S: BYE');
  			socket.emit('signaling',{
  				data: '{"type":"bye"}',
  				to: callee,
  				from: me
  			});
    		PeerConn = null;
    		initiator = null;
    		started = null;
		    setStatus("");
		};

		onCall = function() {
			if (PeerConn != null) {
				return true;
			} else {
				return false;
			}
		}

		//Get element from DOM
		function getElement(input,callback) {
		    //console.log("Getting element form DOM: "+input);
		    var element;
		    if (typeof input === 'string') {
		            //element = document.getElementById(input) || document.getElementsByTagName( input )[0];
		            element = document.getElementById(input);
		    } else if (!input) {
		            callback(false);
		    }
		    callback(element);
		};

		//Trying to get local video/audio
		Conference.getUserMedia = function(callback) {
			if (!localStream) {
				navigator.getUserMedia_ = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
				if (navigator.getUserMedia_) {
					try {
						//Object based request (new versions of Chrome)
						navigator.getUserMedia_({audio:true, video:true}, function(stream){
												    console.log("User has granted access to local media.");
												    /*var url = webkitURL.createObjectURL(stream);
												    localVideo.style.opacity = 1;
												    localVideo.src = url;
												    globalLocalStream = stream;
												    if (callback)
														callback(true);
													}*/
													if ((typeof MediaStream !== "undefined" && MediaStream !== null) && stream instanceof MediaStream) {
												    	localVideo.src = stream;
												        localStream = stream;
												        return localVideo.pl
												   	} else {
												   		localStream = stream;
												        var vendorURL = window.URL || window.webkitURL;
												        localVideo.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
												    }
													localVideo.onerror = function () {
														stream.stop();
													}
													if (callback)
														callback(true);
													}, onUserMediaError);
						console.log("Requested access to local media with new syntax.");  											
					} catch (e) {
						try {
							//String based request for usermedia (Opera and old Chrome versions)
							navigator.getUserMedia_("video,audio", function(stream){
													    console.log("User has granted access to local media.");
													    /*var url = webkitURL.createObjectURL(stream);
													    localVideo.style.opacity = 1;
													    localVideo.src = url;
													    globalLocalStream = stream;
													    if (callback)
															callback(true);
														}*/
														if ((typeof MediaStream !== "undefined" && MediaStream !== null) && stream instanceof MediaStream) {
													    	localVideo.src = stream;
													        localStream = stream;
													        return localVideo.pl
													   	} else {
													   		localStream = stream;
													        var vendorURL = window.URL || window.webkitURL;
													        localVideo.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
													    }
														localVideo.onerror = function () {
															stream.stop();
														}
														if (callback)
															callback(true);
														}, onUserMediaError);
							console.log("Requested access to local media with old syntax.");										
						} catch (e) {
							alert("webkitGetUserMedia() failed. Is the MediaStream flag enabled in about:flags?");
							console.log("webkitGetUserMedia failed with exception: " + e.message);
						    if (callback)
								callback(false);			
						}
					}
				}
    		} else {
			    if (callback)
					callback(true);    			
    		}
  		};
  		
  		function onUserMediaError(error) {
			console.log("Failed to get access to local media. Error code was " + error.code);
			alert("Failed to get access to local media. Error code was " + error.code + ".");
  		};

		function maybeStart() {
		    if (!started && localStream) {
				//setStatus("Connecting...");
				console.log("Creating PeerConnection.");
		  		createPeerConnection();
		  		console.log("Adding local stream.");
		      	PeerConn.addStream(localStream);
		      	started = true;
		      	if (initiator) doCall();
			}
		};  		

		function doCall() {
			console.log("Send offer to peer");
			var offer = PeerConn.createOffer({audio:true, video: true});
			PeerConn.setLocalDescription(PeerConn.SDP_OFFER, offer);
			onSignalingMessage({type: 'offer', sdp: offer.toSdp()});
			PeerConn.startIce();
		}

		function doAnswer() {
			console.log("Send answer to peer");
			var offer = PeerConn.remoteDescription;
			var answer = PeerConn.createAnswer(offer.toSdp(), {audio:true, video: true});
			PeerConn.setLocalDescription(PeerConn.SDP_ANSWER, answer);
			onSignalingMessage({type: 'answer', sdp: answer.toSdp()});
			PeerConn.startIce();
		}
		
		function onIceCandidate(candidate, moreToFollow) {
			if (candidate) {
				onSignalingMessage({type: 'candidate', label: candidate.label, candidate: candidate.toSdp()});
			}
			if (!moreToFollow) {
				console.log("End of candidates");
			}
		}

		function setStatus(state) {
			//Requires an element called footer to modify the status
			footer.innerHTML = state;
		};

		function createPeerConnection() {
			try {
		    	PeerConn = new webkitPeerConnection00("STUN dialogue.io:3478", onIceCandidate);
		    	console.log("Created webkitPeerConnection00 with config \"STUN stun.l.google.com:19302\".");
			} catch (e) {
		    	console.log("Failed to create webkitDeprecatedPeerConnection, exception: " + e.message);
				return;
			}
		    PeerConn.onconnecting = onSessionConnecting;
		    PeerConn.onopen = onSessionOpened;
		    PeerConn.onaddstream = onRemoteStreamAdded;
		    PeerConn.onremovestream = onRemoteStreamRemoved;
		};

		function onSignalingMessage(message) {
			msg = JSON.stringify(message);
			console.log('C->S: ' + msg);
			socket.emit('signaling',{
		  		data: msg,
		  		to: callee,
		  		from: me
		  	});
		};

		function onSessionConnecting(message) {
			console.log("Session connecting.");
			//setStatus("Session connecting");
		};
		
		function onSessionOpened(message) {
			console.log("Session opened.");
			//setStatus("Session opened");
		};
		
		function onRemoteStreamAdded(event) {
			console.log("Remote stream added.");
			//setStatus("Adding remote stream...");
			var url = webkitURL.createObjectURL(event.stream);
			addSourceToVideo(remoteVideo,url);
			setStatus("");
		};

		function addSourceToVideo(element, src) {
		    element.src=src;
		    element.play();
		}

		function onRemoteStreamRemoved(event) {
			console.log("Remote stream removed.");
			//setStatus("Remote stream removed");
		};
    
		function onRemoteHangup() {
    		console.log('Session terminated.');
    		//setStatus("Hanging up...");
    		PeerConn.close();
    		PeerConn = null;
    		remoteVideo.style.opacity = 0;
			remoteVideo.src = null;
			setStatus("");
		    initiator = null;
    		started = null;
  		};
  		
  		Conference.onForcedHangup = function() {
    		console.log('Session terminated.');
    		//setStatus("Hanging up...");
    		PeerConn.close();
    		PeerConn = null;
    		remoteVideo.style.opacity = 0;
			remoteVideo.src = null;
    		setStatus("");
    		initiator = null;
    		started = null;
  		};
		
		/*
		// Temp solution for compatibility between Chrome 20 and later versions.
		// We need to convert the ICE candidate into old format at Chrome 20 end.
  		function checkIceFormat(msgString) {
    		var ua = navigator.userAgent;
			if (ua.substr(ua.lastIndexOf('Chrome/')+7, 2) === '20') {
			// If the offer/answer is from later Chrome to Chrome 20
			// Save the username and password of both audio and video
				if (msgString.search('ice-ufrag:') !== -1 && msgString.search('ice-pwd:') !== -1) {
    				saveIceCredentials(msgString);
    				needFormatCandidate = true;
  				}
			}
  		}
			
		// Save the ICE credentials in SDP from later Chrome at Chrome 20 end.
		function saveIceCredentials(msgString) {
			var indexOfAudioSdp = msgString.search('m=audio');
			var indexOfVideoSdp = msgString.search('m=video');
			
			// Candidate label 0 for audio, 1 for video
			var audioSdp = msgString.substring(indexOfAudioSdp, indexOfVideoSdp);
			iceUfrags[0] = audioSdp.substr(audioSdp.search('ice-ufrag:')+10, 16);
			icePwds[0] = audioSdp.substr(audioSdp.search('ice-pwd:')+8, 24);
			var videoSdp = msgString.substring(indexOfVideoSdp);
			iceUfrags[1] = videoSdp.substr(videoSdp.search('ice-ufrag:')+10, 16);
			icePwds[1] = videoSdp.substr(videoSdp.search('ice-pwd:')+8, 24);
		}
			
		// Add saved ICE credentials into candidate from later Chrome at Chrome 20 end.
		function maybeAddIceCredentials(msg) {
			var candidateString = msg.candidate;
			if (needFormatCandidate) {
				candidateString = msg.candidate.replace('generation',
			                                            'username ' + iceUfrags[msg.label] +
			                                            ' password ' + icePwds[msg.label] +
			                                            ' generation');
			}
			return candidateString;
		}	
  		*/
  		return Conference;
  	};
  	exports.Conference = Conference;
}(window, navigator));
