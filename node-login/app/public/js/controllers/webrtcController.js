$(document).ready(function(){

  /**
    RTC library works calling it by:
    var x = new RTCchan(to,from,div_for_video_tags);
    x.Call();
    x.Answer();
    callback avaliables
  */

  var Meeting = new Array();
  //Listener for incomming signaling messages
  onSignaling = function (message,to,from) {
    if ((Meeting[to] == undefined) || (Meeting[to] == null)) {
      //Call does not exist
      Meeting[to] = new RTCchan(to,from,'webcam');
      Meeting[to].Answer(function(status){
        if (status ==true) {
          Meeting[to].onChannelMessage(message);
        }
      });    
    } else if (Meeting[to]) {
        Meeting[to].onChannelMessage(message);
    } else {
        console.log("Unexpected error, message:" + message);
    }    
  }

  //Listener for calls
  $('#users-body').delegate( '.call', 'click', function(){
    me=userUserName.value;
    id = $(this).attr('id').split('@')[1].split(')')[0];
    if ((Meeting[id] == undefined) || (Meeting[id] == null)) {
        /*createTag(id,function(status){
          if (status == true){*/
            //DOM created
            console.log("Starting call to " + id);
            Meeting[id] = new RTCchan(id,me,'webcam');
            Meeting[id].Call();            
          /*} else {
            //Failed to build video tag and call
            alert('Error in call, your browser might be outdated!');
          }
        })*/
    }   
  });


  //Mute all video/audio outgoing PC, works with a toggle class audio!
  $('.audio').click(function(){
    console.log("audio toggle");
    if($(this).hasClass('active')){
      console.log('audio');
      for (var i in Meeting) {
        Meeting[i].setAudioStatus(true);
      }
    } else {
      console.log('no audio');
      for (var i in Meeting) {
        Meeting[i].setAudioStatus(false);
      }
    }
  });

  $('.video').click(function(){
    console.log("video toggle");
    if($(this).hasClass('active')){
      console.log('videop');
      for (var i in Meeting) {
        Meeting[i].setVideoStatus(true);
      }
    } else {
      console.log('no video');
      for (var i in Meeting) {
        Meeting[i].setVideoStatus(false);
      }
    }
  });

  RTCchan = function(receiver,from,div){
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
    var isRTCPeerConnection = true;
    var mediaConstraints = {
       'has_audio': true,
       'has_video': true
    };
    var isVideoMuted = false;
    var isAudioMuted = false;


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
               getUserMedia(); 
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
               getUserMedia(function(status){
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
       console.log('S->C: ' + message);
       if (isRTCPeerConnection) processSignalingMessage(message);
       else processSignalingMessage00(message);
    }

    function initialize() {
       remoteVideo = document.getElementById("remoteVideo");
       resetStatus();
       getUserMedia();
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

    function resetStatus() {
       if (!initiator) {
           setStatus("");
       } else {
           setStatus("Initializing...");
       }
    }

    //Getting access to the media
    function getUserMedia(callback) {
       try {
           navigator.webkitGetUserMedia({
               'audio': true,
               'video': true
           }, function(stream) {
                   console.log("User has granted access to local media.");
                   var url = webkitURL.createObjectURL(stream);
                   localVideo.style.opacity = 1;
                   localVideo.src = url;
                   localStream = stream;
                   // Caller creates PeerConnection.
                   if (initiator) maybeStart();
                   if (callback)
                          callback(true);
                          },
           onUserMediaError);
           console.log("Requested access to local media with new syntax.");
       } catch (e) {
           try {
               navigator.webkitGetUserMedia("video,audio", function(stream) {
                   console.log("User has granted access to local media.");
                   var url = webkitURL.createObjectURL(stream);
                   localVideo.style.opacity = 1;
                   localVideo.src = url;
                   localStream = stream;
                   // Caller creates PeerConnection.
                   if (initiator) maybeStart();
                   if (callback)
                    callback(true);
                    },
               onUserMediaError);
               console.log("Requested access to local media with old syntax.");
           } catch (e) {
               alert("webkitGetUserMedia() failed. Is the MediaStream flag enabled in about:flags?");
               console.log("webkitGetUserMedia failed with exception: " + e.message);
           }
       }
    }

    //If media is adcquired
    function onUserMediaSuccess(stream) {
       console.log("User has granted access to local media.");
       var url = webkitURL.createObjectURL(stream);
       localVideo.style.opacity = 1;
       localVideo.src = url;
       localStream = stream;
       // Caller creates PeerConnection.
       if (initiator) maybeStart();
    }

    function createPeerConnection() {
       var pc_config = {
           "iceServers": [{
               "url": "stun:dialogue.io:3478"
           }]
       };
       try {
           pc = new webkitRTCPeerConnection(pc_config);
           pc.onicecandidate = onIceCandidate;
           console.log("Created webkitRTCPeerConnnection with config \"" + JSON.stringify(pc_config) + "\".");
       } catch (e) {
           try {
               var stun_server = "";
               if (pc_config.iceServers.length !== 0) {
                   stun_server = pc_config.iceServers[0].url.replace('stun:', 'STUN ');
               }
               pc = new webkitPeerConnection00(stun_server, onIceCandidate00);
               isRTCPeerConnection = false;
               console.log("Created webkitPeerConnnection00 with config \"" + stun_server + "\".");
           } catch (e) {
               console.log("Failed to create PeerConnection, exception: " + e.message);
               alert("Cannot create PeerConnection object; Is the 'PeerConnection' flag enabled in about:flags?");
               return;
           }
       }

       pc.onconnecting = onSessionConnecting;
       pc.onopen = onSessionOpened;
       pc.onaddstream = onRemoteStreamAdded;
       pc.onremovestream = onRemoteStreamRemoved;
    }

    function maybeStart() {
       if (!started && localStream) {
           setStatus("Connecting...");
           console.log("Creating PeerConnection.");
           createPeerConnection();
           console.log("Adding local stream.");
           pc.addStream(localStream);
           started = true;
           // Caller initiates offer to peer.
           if (initiator) doCall();
       }
    }

    function setStatus(state) {
       footer.innerHTML = state;
    }

    function doCall() {
       console.log("Sending offer to peer.");
       if (isRTCPeerConnection) {
           pc.createOffer(setLocalAndSendMessage, null, mediaConstraints);
       } else {
           var offer = pc.createOffer(mediaConstraints);
           pc.setLocalDescription(pc.SDP_OFFER, offer);
           sendMessage({
               type: 'offer',
               sdp: offer.toSdp()
           },receiver,from);
           pc.startIce();
       }
    }

    function doAnswer() {
       console.log("Sending answer to peer.");
       if (isRTCPeerConnection) {
           pc.createAnswer(setLocalAndSendMessage, null, mediaConstraints);
       } else {
           var offer = pc.remoteDescription;
           var answer = pc.createAnswer(offer.toSdp(), mediaConstraints);
           pc.setLocalDescription(pc.SDP_ANSWER, answer);
           sendMessage({
               type: 'answer',
               sdp: answer.toSdp()
           },receiver,from);
           pc.startIce();
       }
    }

    setRemoteVideo = function(tag,callback) {
      getElement(tag, function(element){
        if (element==false || element == null) {
          console.log("No DOM "+tag+" found");
          //remoteVideo = null;
          var _div = document.getElementById(div);
          remoteVideo = document.createElement("video");
          remoteVideo.setAttribute("id",'video_'+tag);
          remoteVideo.setAttribute("autoplay","autoplay");
          remoteVideo.setAttribute("style","-webkit-transition: opacity 2s; opacity: 1; margin-right: 3px; height:90%;");
          remoteVideo.setAttribute("height","240px");
          remoteVideo.setAttribute("onclick","mainWindow(this)");
          _div.appendChild(remoteVideo);
          console.log("remoteVideo configuration finished, waiting for call");
          callback(true);
        } else {
          console.log("remote video set");
          remoteVideo = element;
          callback(true);
        }
      });
    };

    setLocalVideo = function(tag,callback) {
      getElement(tag, function(element){
        if (element==false || element == null) {
          console.log("No DOM "+tag+" found");
          //remoteVideo = null;
          var _div = document.getElementById(div);
          localVideo = document.createElement("video");
          localVideo.setAttribute("id",tag);
          localVideo.setAttribute("autoplay","autoplay");
          localVideo.setAttribute("style","-webkit-transition: opacity 2s; -webkit-transform: scale(-1, 1); opacity: 1; margin-right: 3px; height:90%;");
          localVideo.setAttribute("height","240px");
          localVideo.setAttribute("onclick","mainWindow(this)");
          _div.appendChild(localVideo);
          console.log("remoteVideo configuration finished, waiting for call");
          callback(true);
        } else {
          localVideo = element;
          console.log("Local video set");
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
                        console.log(input);

        } else if (!input) {
                callback(false);
        }
        callback(element);
    };
   
    function setLocalAndSendMessage(sessionDescription) {
       pc.setLocalDescription(sessionDescription);
       sendMessage(sessionDescription,receiver,from);
    }

    function processSignalingMessage(message) {
       var msg = JSON.parse(message);
       if (msg.type === 'offer') {
           // Callee creates PeerConnection
           if (!initiator && !started) maybeStart();

           // We only know JSEP version after createPeerConnection().
           if (isRTCPeerConnection) pc.setRemoteDescription(new RTCSessionDescription(msg));
           else pc.setRemoteDescription(pc.SDP_OFFER, new SessionDescription(msg.sdp));

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

    function processSignalingMessage00(message) {
       var msg = JSON.parse(message);

       // if (msg.type === 'offer') should not happen here.
       if (msg.type === 'answer' && started) {
           pc.setRemoteDescription(pc.SDP_ANSWER, new SessionDescription(msg.sdp));
       } else if (msg.type === 'candidate' && started) {
           var candidate = new IceCandidate(msg.label, msg.candidate);
           pc.processIceMessage(candidate);
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

    function onIceCandidate00(candidate, moreToFollow) {
       if (candidate) {
           sendMessage({
               type: 'candidate',
               label: candidate.label,
               candidate: candidate.toSdp()
           },receiver,from);
       }

       if (!moreToFollow) {
           console.log("End of candidates.");
       }
    }

    function onSessionConnecting(message) {
       console.log("Session connecting.");
    }

    function onSessionOpened(message) {
       console.log("Session opened.");
    }

    function onRemoteStreamAdded(event) {
       console.log("Remote stream added.");
       var url = webkitURL.createObjectURL(event.stream);
       remoteVideo.src = url;
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
       isRTCPeerConnection = true;
       isAudioMuted = false;
       isVideoMuted = false;
       pc.close();
       pc = null;
      initiator = 0;
      setStatus("");
    }

    function waitForRemoteVideo() {
       if (remoteStream.videoTracks.length === 0 || remoteVideo.currentTime > 0) {
         setStatus("");         
       } else {
           setTimeout(waitForRemoteVideo, 100);
       }
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
  }

});