$(document).ready(function(){
	
	var socket = io.connect('http://localhost:8000');
	//var socket = io.connect('https://dialogue.io', {secure: true});
	var me;
	var Meeting = new Array();
	var calls = 0;
	var ready = false;
	var localStream = null;

	$('#loginModal').modal({
		keyboard: false,
	  	backdrop: false,
	  	show: true
	});

	$('#loginModal').on('shown', function () {
		$('#username_input').focus();
	})

	$('#submit_modal').click(function(){
		if ($('#username_input').val() != '') {
			$('#loginModal').modal('hide');
		    me = $('#username_input').val();
		    //Get the media to avoid repeating the dialogue, until then no pc are built
		    if ($('#hdcheckbox').is(':checked')) {
		    	$('#width').val('1280');
		    	$('#height').val('720');
    	        $('#widthDisplay').html('1280');
    	        $('#heightDisplay').html('720');
		    }
		    doGetUserMedia(function(status){
		    	if (status == true)
			    socket.emit('participant', {username: me});
		    });
		    ready = true;
		} else {
			$('#username_helper').html('Cannot be blank, are you invisible?');
		}
	});

	socket.on('userlist', function (usernames) {
		$('#member_list').html('');
		$.each(usernames, function(key, value) { 
		    $('#member_list').append('<li><a href="#" id="'+value+' class="member">'+value+'</a></li>');
		});
	});

	socket.on('newUser', function (username) {
		//Perform call to that user
		if ((username != me) && (ready == true)) {
			$('#webcam').append('<div class="span4" id='+username+'_div></div>');
		    Meeting[username] = new RTCchan(username,me,username+'_div',localStream);
		    Meeting[username].Call(function(status){
		    	if (status==true) {
		    		if (localStream == null)
		    		localStream = Meeting[username].getLocalStream();
		    	}
		    });
	    } 
	});

	socket.on('onSignaling', function (message,to,from) {
		onSignaling(message,to,from);
   	});

	doGetUserMedia = function(callback){
		localVideo = document.getElementById("localVideo");
        // Call into getUserMedia via the polyfill (adapter.js).
        //var constraints = {{mediaConstraints|safe}}
        try {
          getUserMedia(cameraConstraints(), function(stream) {
                   console.log("User has granted access to local media.");
                   attachMediaStream(localVideo,stream);
                   localVideo.style.opacity = 1;
                   localStream = stream;
                   if (callback)
                          callback(true);
                          },
                       onUserMediaError);
          console.log("Requested access to local media with mediaConstraints");
        } catch (e) {
          alert("getUserMedia() failed. Is this a WebRTC capable browser?");
          console.log("getUserMedia failed with exception: " + e.message);
        }
	}

    function cameraConstraints() {
      var constraints = {};
      constraints.audio = true;
      constraints.video = { mandatory: {}, optional: [] };
      if ($("#width").val() != "0") {
        constraints.video.mandatory.minWidth = $("#width").val();
      }
      if ($("#height").val() != "0") {
        constraints.video.mandatory.minHeight = $("#height").val();
      }
      if ($("#frameRate").val() != "0") {
        constraints.video.mandatory.minFrameRate = $("#frameRate").val();
      }
      $('#localConstraints').append('<p>'+JSON.stringify(constraints, null, ' ')+'</p>');
      return constraints;
    }

    function onUserMediaError(error) {
       console.log("Failed to get access to local media. Error code was " + error.code);
       alert("Failed to get access to local media. Error code was " + error.code + ".");
    }

	onSignaling = function(message,to,from) {
		if ((Meeting[to] == undefined) || (Meeting[to] == null)) {
	      var msg = JSON.parse(message);
	      if (msg.type == "bye") {
	        Meeting[to]=null;
	      } else {
	        //Call does not exist
			$('#webcam').append('<div class="span4" id='+to+'_div></div>');
	        Meeting[to] = new RTCchan(to,from,to+'_div',localStream);
	        Meeting[to].Answer(function(status){
	          if (status ==true) {
	            calls++;
	            if (localStream == null)
	    		localStream = Meeting[to].getLocalStream();
	            Meeting[to].onChannelMessage(message);
	          }
	        });
	      }
	    } else if (Meeting[to]) {
	        Meeting[to].onChannelMessage(message);
	        var msg = JSON.parse(message);
	        if (msg.type == "bye") {
	          Meeting[to]=null;
	          calls = calls - 1;
	        }
	    } else {
	        console.log("Unexpected error, message:" + message);
	    }		
	}
    sendMessage = function(message,receiver,from) {
      if ((message.type == "offer") || (message.type == "answer")) {
      	if ($('#bwinput').val() != "") {
      		//message.sdp = message.sdp.replace('m=video 1 RTP/SAVPF 100 101 102\r\n', 'm=video 1 RTP/SAVPF 100 101 102\r\nb=AS:'+$('#bwinput').val()+'\r\n');
	      	message.sdp = message.sdp.concat('b=AS:'+$('#bandwidth').val()+'\r\n');
      	}
      }
      var msgString = JSON.stringify(message);
       if (message.sdp != undefined)
       console.log('C->S: ' +message.type+'\n'+ message.sdp);
       else
       console.log('C->S: '+ JSON.stringify(message, null, ' '));
      socket.emit('signaling', msgString, receiver,from);
    }	
});