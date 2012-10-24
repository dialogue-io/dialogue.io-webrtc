$(document).ready(function(){

var globalLocalStream;
      var localVideo = document.getElementById("localVideo");
      var mainVideo = document.getElementById("mainVideo");
      // on load of page
      $(function(){
      // when the client hits ENTER on their keyboard
      $('#data').keypress(function(e) {
      if ((me != null) || (me != "")) {
      if(e.which == 13) {
      if ($("#data").val()!=null || $("#data").val()!=""){
      if($(this).val().length > 0){ //If something is written
      e.preventDefault();
      var message = $('#data').val();
      $('#data').val('');
      $(this).blur();
      socket.emit('sendchat', message);
      $('#chat').scrollTop(9000);
        mixpanel.track('Chat message', {'page name' : document.title, 'url' : window.location.pathname, 'user': userUserName.value});
      }
      }
      $('#data').focus();
      }
      }
      });
      $('#data').focus();
      });
      getUserMedia = function(callback) {
      // getUserMedia() feature detection
      navigator.getUserMedia_ = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
      if (navigator.getUserMedia_) {
      try {
      //Object based request (new versions of Chrome)
      navigator.getUserMedia_({audio:true, video:true}, function(stream){
      console.log("User has granted access to local media.");
      if ((typeof MediaStream !== "undefined" && MediaStream !== null) && stream instanceof MediaStream) {
      localVideo.src = stream;
      globalLocalStream = stream;
      return localVideo.pl
      } else {
      globalLocalStream = stream;
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
      if ((typeof MediaStream !== "undefined" && MediaStream !== null) && stream instanceof MediaStream) {
      localVideo.src = stream;
      globalLocalStream = stream;
      return localVideo.pl
      } else {
      globalLocalStream = stream;
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
      };
      function onUserMediaError(error) {
      console.log("Failed to get access to local media. Error code was " + error.code);
      alert("Failed to get access to local media. Error code was " + error.code + ".");
      };
      function start(id) {
      if ((Meeting[id] == undefined) || (Meeting[id] == null)) {
      console.log("Starting call to "+id);
      Meeting[id] = new Conference();
      Meeting[id].setLocalVideo("localVideo",function(status){
      if (status == true){
      //Meeting[id].setLocalStream(globalLocalStream);
      Meeting[id].Call(id,"webcam",function(status){
      if (status==false){
      alert("Call error!");
      } else {
      addHangButton(id);
      }
      });
      } else {
      console.log("Error");
      }
      });
      }
      }
      function addHangButton(id){
      //$('#'+id).attr('onclick','');
      document.getElementById(id).setAttribute('style','color:#A65500;');
      //_elem = "<input type=\\"button\" id=\"hangup"+id+"\" value=\""+id+" (Hang up)\" onclick=\"Meeting['"+id+"'].onHangup()\" />"
      //$('#buttons').append(_elem);
      }
      //Drag and drop
      var totFSize = 0;
      if(window.FileReader) {
      addEventHandler(window, 'load', function() {
      var status = document.getElementById('status');
      var drop   = document.getElementById('drop');
      function cancel(e) {
      if (e.preventDefault) { e.preventDefault(); }
      return false;
      }
      // Tells the browser that we *can* drop on this target
      addEventHandler(drop, 'dragover', cancel);
      addEventHandler(drop, 'dragenter', cancel);
      });
      } else {
      footer.innerHTML = 'Your browser does not support the HTML5 FileReader.';
      }
      function addEventHandler(obj, evt, handler) {
      if(obj.addEventListener) {
      // W3C method
      obj.addEventListener(evt, handler, false);
      } else if(obj.attachEvent) {
      // IE method.
      obj.attachEvent('on'+evt, handler);
      } else {
      // Old school method.
      obj['on'+evt] = handler;
      }
      }
      addEventHandler(drop, 'drop', function (e) {
      e = e || window.event; // get window.event if e argument missing (in IE)
      if (e.preventDefault) { e.preventDefault(); } // stops the browser from redirecting off to the image.
      var dt    = e.dataTransfer;
      var files = dt.files;
      for (var i=0; i<files.length; i++) {
      uploadFile(files[i],i);
      }
      return false;
      });
      //Process the file and if it conains text or img
      function uploadFile(file, totalFiles) {
      var reader = new FileReader();
      // Handle errors that might occur while reading the file (before upload).
      reader.onerror = function(evt) {
      var message;
      // REF: http://www.w3.org/TR/FileAPI/#ErrorDescriptions
      switch(evt.target.error.code) {
      case 1:
      message = file.name + " not found.";
      break;
      case 2:
      message = file.name + " has changed on disk, please re-try.";
      break;
      case 3:
      messsage = "Upload cancelled.";
      break;
      case 4:
      message = "Cannot read " + file.name + ".";
      break;
      case 5:
      message = "File too large for browser to upload.";
      break;
      }
      //$("#upload-status-text").html(message);
      console.log(message);
      }
      if(file.type.indexOf("text") >= 0){
      var reader = new FileReader();
      reader.onload = function(e) {
      result = e.target.result;
      console.log(result);
      socket.emit('file', result);
      console.log('File correctly sent');
      document.getElementById('drop').innerHTML='File sent. Drag another file to send again.';
      }
      reader.readAsBinaryString(file);
      } else {
      // When the file is done loading, POST to the server.
      reader.onloadend = function(evt){
      var data = evt.target.result;
      // Make sure the data loaded is long enough to represent a real file.
      if(data.length > 128){
      /*
      * Per the Data URI spec, the only comma that appears is right after
      * 'base64' and before the encoded content.
      */
      var base64StartIndex = data.indexOf(',') + 1;
      /*
      * Make sure the index we've computed is valid, otherwise something
      * is wrong and we need to forget this upload.
      */
      if(base64StartIndex < data.length) {
      socket.emit('image', data.substring(base64StartIndex));
      }
      }
      };
      // Start reading the image off disk into a Data URI format.
      reader.readAsDataURL(file);
      };
      }
      /*$("video").click(function() {
      console.log("here");
      var src = $(this).attr("src");
      console.log(src);
      return;
      });*/
      mainWindow = function(object) {
      $("video").css("border","0px");
      document.getElementById("mainVideo").style.opacity = 1;
      document.getElementById("mainVideo").setAttribute("src","");
      document.getElementById("mainVideo").setAttribute("src",object.getAttribute("src"));
      object.setAttribute("style","-webkit-transition: opacity 2s; -webkit-transform: scale(-1, 1); opacity: 1; margin-right: 3px; height:90%; border: 2px solid #6C7B84; padding:1px;");
      }

});