/*
*Updated to work with the last version of WebRTC no more Deprecated, 
*always using polyfill for chrome-firefox compatibility
*/

RTCchan = function(receiver,from,div,pass_stream){
    this.div = div;
    this.from = from;
    this.receiver = receiver;
    var started = false;
    var localStream;
    var localVideo;
    var miniVideo;
    var remoteVideo;
    var remoteStream;
    var pc;
    var initiator = 0;
    /*var mediaConstraints = {
       'has_audio': true,
       'has_video': true
    };*/
    var isVideoMuted = false;
    var isAudioMuted = false;
    var constraints_html;
    var constraints_html_bw;
    var mediaConstraints = {'mandatory': {
                              'OfferToReceiveAudio':true, 
                              'OfferToReceiveVideo':true }};

    if (pass_stream != null) {
      console.log("Stream added previously");
      localStream = pass_stream;
    }

    this.getConstraints = function(){
      return constraints_html;
    }


    this.getLocalStream = function(){
      return localStream;
    }

    this.setAudioStatus = function(status){
      isAudioMuted = status;
      toggleAudioMute();
    }

    this.setVideoStatus = function(status){
      isVideoMuted = status;
      toggleVideoMute();
    }

    this.Call = function(callback){
     setLocalVideo('localVideo', function(status){
        if (status == true) {
          setRemoteVideo(receiver,function(status){
            if (status == true) {
               initiator = 1;
               resetStatus();
               doGetUserMedia(function(status){
                if (status == true) {
                  callback(true);
                }
               });
            } else {
              //Build remotevideo tag
              return false;
            }
          });
        } else {
          //Create local video tag
          return false;
        }
     });
    }

    this.Answer = function(callback){
     setLocalVideo('localVideo', function(status){
        if (status == true) {
          setRemoteVideo(receiver,function(status){
            if (status == true) {
               resetStatus();
               doGetUserMedia(function(status){
                if (status == true) {
                  callback(true);
                }
               });
            } else {
              //Build remotevideo tag
              return false;
            }
          });
        } else {
          //Create local video tag
          return false;
        }
     });
    }
    
    //When incomming message from websocket this function will process it into the PC
    this.onChannelMessage = function(message) {
       log = JSON.parse(message);
       if (log.sdp != undefined)
       console.log('S->C: ' +log.type+'\n'+ log.sdp);
       else
       console.log('S->C: '+ JSON.stringify(message));
       processSignalingMessage(message);
    }

    function initialize() {
       remoteVideo = document.getElementById("remoteVideo");
       resetStatus();
       doGetUserMedia();
    }

    function resetStatus() {
       if (!initiator) {
           //setStatus('');
          setStatus('0%');       
       } else {
          //setStatus("Initializing...");
          setStatus('10%');
       }
    }

    //Getting access to the media
    function doGetUserMedia(callback) {
      if (!localStream) {
        // Call into getUserMedia via the polyfill (adapter.js).
        //var constraints = {{mediaConstraints|safe}}
        try {
          getUserMedia(cameraConstraints(), function(stream) {
                   console.log("User has granted access to local media.");
                   attachMediaStream(localVideo,stream);
                   localVideo.style.opacity = 1;
                   localStream = stream;
                   // Caller creates PeerConnection.
                   if (initiator) maybeStart();
                   if (callback)
                          callback(true);
                          },
                       onUserMediaError);
          console.log("Requested access to local media with mediaConstraints");
        } catch (e) {
          alert("getUserMedia() failed. Is this a WebRTC capable browser?");
          console.log("getUserMedia failed with exception: " + e.message);
        }
     } else {
       // Caller creates PeerConnection.
       if (initiator) maybeStart();
       if (callback)
              callback(true);     
     }
    }

    //If media is adcquired
    function onUserMediaSuccess(stream) {
       console.log("User has granted access to local media.");
       attachMediaStream(localVideo,stream);
       localVideo.style.opacity = 1;
       localStream = stream;
       // Caller creates PeerConnection.
       if (initiator) maybeStart();
    }

    function createPeerConnection() {
       var pc_config = {
           "iceServers": [{
               "url": "stun:stun.fwdnet.net"
           }]
       };
       try {
           //Using polyfill also for the PeerConnection
           pc = new RTCPeerConnection(pc_config);
           pc.onicecandidate = onIceCandidate;
           console.log("Created RTCPeerConnection with config \"" + JSON.stringify(pc_config) + "\".");
       } catch (e) {
           console.log("Failed to create RTCPeerConnection, exception: " + e.message);
           alert("Cannot create RTCPeerConnection object; Is the 'PeerConnection' flag enabled in about:flags?");
       }

       pc.onconnecting = onSessionConnecting;
       pc.onopen = onSessionOpened;
       pc.onaddstream = onRemoteStreamAdded;
       pc.onremovestream = onRemoteStreamRemoved;

       pc.ondatachannel = onChanDataChan;
    }

    function maybeStart() {
       if (!started && localStream) {
           //setStatus("Connecting...");
           setStatus('60%');
           console.log("Creating PeerConnection.");
           createPeerConnection();
           console.log("Adding local stream.");
           pc.addStream(localStream, streamConstraints());
           //pc.addStream(localStream);
           started = true;
           // Caller initiates offer to peer.
           if (initiator) doCall();
       }
    }

    function setStatus(state) {
       //footer.innerHTML = state;
      $('.bar').css('width',state)
    }

    function doCall() {
       console.log("Sending offer to peer.");
       //pc.createOffer(setLocalAndSendMessage, null, mediaConstraints);
      pc.createOffer(setLocalAndSendMessage);
    }

    function doAnswer() {
       console.log("Sending answer to peer.");
       //pc.createAnswer(setLocalAndSendMessage, null, mediaConstraints);
       pc.createAnswer(setLocalAndSendMessage);
    }

    setRemoteVideo = function(tag,callback) {
      getElement(tag, function(element){
        if (element==false || element == null) {
          //console.log("No DOM "+tag+" found");
          //remoteVideo = null;
          var _div = document.getElementById(div);
          remoteVideo = document.createElement("video");
          remoteVideo.setAttribute("id",'video_'+tag);
          remoteVideo.setAttribute("autoplay","autoplay");
          remoteVideo.setAttribute("style","-webkit-transition: opacity 2s; opacity: 1; margin-right: 3px;");
          remoteVideo.setAttribute("height","240px");
          remoteVideo.setAttribute("onclick","mainWindow(this)");
          _div.appendChild(remoteVideo);
          callback(true);
        } else {
          //console.log("remote video set");
          remoteVideo = element;
          callback(true);
        }
      });
    };

    setLocalVideo = function(tag,callback) {
      getElement(tag, function(element){
        if (element==false || element == null) {
          //console.log("No DOM "+tag+" found");
          //remoteVideo = null;
          var _div = document.getElementById(div);
          localVideo = document.createElement("video");
          localVideo.setAttribute("id",tag);
          localVideo.setAttribute("autoplay","autoplay");
          localVideo.setAttribute("style","-webkit-transition: opacity 2s; -webkit-transform: scale(-1, 1); opacity: 1; margin-right: 3px;");
          localVideo.setAttribute("height","240px");
          localVideo.setAttribute("onclick","mainWindow(this)");
          _div.appendChild(localVideo);
          callback(true);
        } else {
          localVideo = element;
          //console.log("Local video set");
          callback(true);
        }
      });
    };

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
   
    function setLocalAndSendMessage(sessionDescription) {
       //Prefer Opus if avaliable, good for performance comparisions? 
       sessionDescription.sdp = preferOpus(sessionDescription.sdp);
       //comment the above function to go back to VP8 
       pc.setLocalDescription(sessionDescription);
       sendMessage(sessionDescription,receiver,from);
    }

    function processSignalingMessage(message) {
       var msg = JSON.parse(message);
       if (msg.type === 'offer') {
           // Callee creates PeerConnection
           if (!initiator && !started) maybeStart();
           pc.setRemoteDescription(new RTCSessionDescription(msg));
           doAnswer();
       } else if (msg.type === 'answer' && started) {
           pc.setRemoteDescription(new RTCSessionDescription(msg));
       } else if (msg.type === 'candidate' && started) {
           var candidate = new RTCIceCandidate({
               sdpMLineIndex: msg.label,
               candidate: msg.candidate
           });
           pc.addIceCandidate(candidate);
       } else if (msg.type === 'bye' && started) {
           onRemoteHangup();
       }
    }

    function onUserMediaError(error) {
       console.log("Failed to get access to local media. Error code was " + error.code);
       alert("Failed to get access to local media. Error code was " + error.code + ".");
    }

    function onIceCandidate(event) {
       if (event.candidate) {
           sendMessage({
               type: 'candidate',
               label: event.candidate.sdpMLineIndex,
               id: event.candidate.sdpMid,
               candidate: event.candidate.candidate
           },receiver,from);
       } else {
           console.log("End of candidates.");
       }
    }

    function onSessionConnecting(message) {
       console.log("Session connecting.");
       setStatus('70%');
    }

    function onSessionOpened(message) {
       console.log("Session opened.");
       setStatus('80%');
    }

    function onRemoteStreamAdded(event) {
       console.log("Remote stream added.");
       attachMediaStream(remoteVideo,event.stream);
       remoteStream = event.stream;
       waitForRemoteVideo();
    }

    function onRemoteStreamRemoved(event) {
       console.log("Remote stream removed.");
    }

    function onHangup() {
       console.log("Hanging up.");
       //transitionToDone();
       stop();
    }

    function onRemoteHangup() {
       console.log('Session terminated.');
       //transitionToWaiting();
       stop();
       initiator = 0;
    }

    function stop() {
      setStatus("Hanging up...");
      remoteVideo.style.opacity = 0;
      remoteVideo.src = null;
      var _div = document.getElementById(div);
      _div.removeChild(remoteVideo);
       started = false;
       isAudioMuted = false;
       isVideoMuted = false;
       pc.close();
       pc = null;
      initiator = 0;
      //setStatus("");
      setStatus('0%');
    }

    function waitForRemoteVideo() {
       if (remoteStream.videoTracks.length === 0 || remoteVideo.currentTime > 0) {
         //setStatus("");         
          setStatus('0%');
          //if (initiator == 1)
          //doDataChan();
       } else {
           setStatus('90%');
           setTimeout(waitForRemoteVideo, 100);
       }
    }


    //Datachannel testing!
    var chan;
    doDataChan = function(){
      console.log("building datachan");
      chan = pc.createDataChannel("chat");
      chan.onmessage = onChanMessage;
      chan.send("hello this is chan");
    }

    onChanMessage = function(evt) {
      console.log(evt.data);
      chan.send("hello this is chan");
    }

    onChanClose = function(){
      console.log("close channel");
    }

    onChanDataChan = function(evt){
      chan = evt.channel;
      chan.onmessage  = onChanMessage;
      chan.onclose = onChanClose;
    }

    function transitionToActive() {
       remoteVideo.style.opacity = 1;
       card.style.webkitTransform = "rotateY(180deg)";
       setTimeout(function () {
           localVideo.src = "";
       }, 500);
       setTimeout(function () {
           miniVideo.style.opacity = 1;
       }, 1000);
       setStatus("<input type=\"button\" id=\"hangup\" value=\"Hang up\" onclick=\"onHangup()\" />");
    }

    function transitionToWaiting() {
       card.style.webkitTransform = "rotateY(0deg)";
       setTimeout(function () {
           localVideo.src = miniVideo.src;
           miniVideo.src = "";
           remoteVideo.src = ""
       }, 500);
       miniVideo.style.opacity = 0;
       remoteVideo.style.opacity = 0;
       resetStatus();
    }

    function transitionToDone() {
       localVideo.style.opacity = 0;
       remoteVideo.style.opacity = 0;
       miniVideo.style.opacity = 0;
       setStatus("You have left the call. <a href=\"https://apprtc.appspot.com/?r=33107712\">Click here</a> to rejoin.");
    }

    function enterFullScreen() {
       container.webkitRequestFullScreen();
    }

    function toggleVideoMute() {
       if (localStream.videoTracks.length === 0) {
           console.log("No local video available.");
           return;
       }

       if (isVideoMuted) {
           for (i = 0; i < localStream.videoTracks.length; i++) {
               localStream.videoTracks[i].enabled = true;
           }
           console.log("Video unmuted.");
       } else {
           for (i = 0; i < localStream.videoTracks.length; i++) {
               localStream.videoTracks[i].enabled = false;
           }
           console.log("Video muted.");
       }

       isVideoMuted = !isVideoMuted;
    }

    function toggleAudioMute() {
       if (localStream.audioTracks.length === 0) {
           console.log("No local audio available.");
           return;
       }

       if (isAudioMuted) {
           for (i = 0; i < localStream.audioTracks.length; i++) {
               localStream.audioTracks[i].enabled = true;
           }
           console.log("Audio unmuted.");
       } else {
           for (i = 0; i < localStream.audioTracks.length; i++) {
               localStream.audioTracks[i].enabled = false;
           }
           console.log("Audio muted.");
       }

       isAudioMuted = !isAudioMuted;
    }

    // Send BYE on refreshing(or leaving) a demo page
    // to ensure the room is cleaned for next session.
    window.onbeforeunload = function () {
       sendMessage({
           type: 'bye'
       },receiver,from);
            //Delay 100ms to ensure 'bye' arrives first.
       setTimeout(function(){}, 100);
    }

    // Ctrl-D: toggle audio mute; Ctrl-E: toggle video mute.
    // On Mac, Command key is instead of Ctrl.
    // Return false to screen out original Chrome shortcuts.
    document.onkeydown = function () {
       if (navigator.appVersion.indexOf("Mac") != -1) {
           if (event.metaKey && event.keyCode === 68) {
               toggleAudioMute();
               return false;
           }
           if (event.metaKey && event.keyCode === 69) {
               toggleVideoMute();
               return false;
           }
       } else {
           if (event.ctrlKey && event.keyCode === 68) {
               toggleAudioMute();
               return false;
           }
           if (event.ctrlKey && event.keyCode === 69) {
               toggleVideoMute();
               return false;
           }
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

    function streamConstraints() {
      var constraints = { mandatory: {}, optional: [] };
      if ($("#bandwidth").val() != "0") {
        constraints.optional[0] = { 'bandwidth' : $('#bandwidth').val() };
      }
      $('#bitrateConstraints').append('<p>'+JSON.stringify(constraints, null, ' ')+'</p>');;
      return constraints;
    }

    // Display statistics
    var statCollector = setInterval(function() {
      var display = function(str) {
        document.getElementById("stats").innerHTML = str;
      }

      display("No stream");
      if (pc && pc.remoteStreams[0]) {
        if (pc.getStats) {
          display('No stats callback');
          pc.getStats(function(stats) {
            console.log('Raw stats ' + stats);
            var statsString = '';
            var results = stats.result();
            console.log('Raw results ' + results);
            for (var i = 0; i < results.length; ++i) {
              var res = results[i];
              log(i + ': ' + JSON.stringify(res));
              statsString += '<h3>Report ';
              statsString += i;
              statsString += '</h3>';
              if (res.local) {
                statsString += "<p>Local ";
                statsString += dumpStats(res.local);
              }
              if (res.remote) {
                statsString += "<p>Remote ";
                statsString += dumpStats(res.remote);
              }
            }
            $('#stats').append(statsString);
            display('No bitrate stats');
          });
        } else {
          display('No stats function. Use at least Chrome 24.0.1285');
        }
      } else {
        log('Not connected yet');
      }
      // Collect some stats from the video tags.
      if (localVideo) {
         document.getElementById('localVideoConstraints').innerHTML=localVideo.videoWidth +
             'x' + localVideo.videoHeight;
      }
      if (remoteVideo) {
         document.getElementById('remoteVideoConstraints').innerHTML=remoteVideo.videoWidth +
             'x' + remoteVideo.videoHeight;
      }
    }, 1000);

    // Dumping a stats variable as a string.
    // might be named toString? Harald version of stats objects
    function dumpStats(obj) {
      var statsString = 'Timestamp:';
      statsString += obj.timestamp;
      if (obj.names) {
        log('Have names function');
        names = obj.names();
        for (var i = 0; i < names.length; ++i) {
           statsString += '<br>';
           statsString += names[i];
           statsString += ':';
           statsString += obj.stat(names[i]);
        }
      } else {
        log('No names function');
        if (obj.stat('audioOutputLevel')) {
          statsString += "audioOutputLevel: ";
          statsString += obj.stat('audioOutputLevel');
          statsString += "<br>";
        }
      }
      return statsString;
    }

    //Opus part just in case we need to run performance tests
    // Set Opus as the default audio codec if it's present.
    function preferOpus(sdp) {
      var sdpLines = sdp.split('\r\n');

      // Search for m line.
      for (var i = 0; i < sdpLines.length; i++) {
          if (sdpLines[i].search('m=audio') !== -1) {
            var mLineIndex = i;
            break;
          } 
      }
      if (mLineIndex === null)
        return sdp;

      // If Opus is available, set it as the default in m line.
      for (var i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('opus/48000') !== -1) {        
          var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
          if (opusPayload)
            sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
          break;
        }
      }

      // Remove CN in m line and sdp.
      sdpLines = removeCN(sdpLines, mLineIndex);

      sdp = sdpLines.join('\r\n');
      return sdp;
    }

    function extractSdp(sdpLine, pattern) {
      var result = sdpLine.match(pattern);
      return (result && result.length == 2)? result[1]: null;
    }

    // Set the selected codec to the first in m line.
    function setDefaultCodec(mLine, payload) {
      var elements = mLine.split(' ');
      var newLine = new Array();
      var index = 0;
      for (var i = 0; i < elements.length; i++) {
        if (index === 3) // Format of media starts from the fourth.
          newLine[index++] = payload; // Put target payload to the first.
        if (elements[i] !== payload)
          newLine[index++] = elements[i];
      }
      return newLine.join(' ');
    }

    // Strip CN from sdp before CN constraints is ready.
    function removeCN(sdpLines, mLineIndex) {
      var mLineElements = sdpLines[mLineIndex].split(' ');
      // Scan from end for the convenience of removing an item.
      for (var i = sdpLines.length-1; i >= 0; i--) {
        var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
        if (payload) {
          var cnPos = mLineElements.indexOf(payload);
          if (cnPos !== -1) {
            // Remove CN payload from m line.
            mLineElements.splice(cnPos, 1);
          }
          // Remove CN line in sdp
          sdpLines.splice(i, 1);
        }
      }

      sdpLines[mLineIndex] = mLineElements.join(' ');
      return sdpLines;
    }

  }
