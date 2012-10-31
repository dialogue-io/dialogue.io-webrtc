
$(document).ready(function(){

	var hc = new roomController();

	$('#name-tf').focus();
	//$('#github-banner').css('top', '41px');
	
	//$('#name_label').html(userName.value);

	//$('#name_user').html('Welcome '+userName.value);

	//Starting chat code
	var socket = io.connect('http://localhost:8080');
	var me;
	var Meeting = new Array();
	var index = {};
	var counter = 0;
	// on connection to server, ask for user's name with an anonymous callback
	socket.on('connect', function () {
	    // call the server-side function 'adduser' and send one parameter (value of prompt)
	    //getUserMedia(function(status) {
	    //if (status == true){
	    me = userName.value + ' (@' + userUserName.value + ')';
	    //socket.emit('adduser', me);
	    socket.emit('setRoom', {username: me, room: roomAddress.value});
	    //console.log("I am "+me);
	    $('#data').focus();
	    //} else {
	    //window.location.reload()
	    //}
	    //});
	});
	socket.on('logfiles', function (logs) {
	    //Updates the list of logfiles avaliable for download
	    $('#logfiles').empty();
	    $.each(logs, function (key, value) {
	        if (value.split('.')[0].length = !0) {
	            //console.log(value.split('.'));
	            $('#logfiles').append('<tr><td id="' + value + '"><a href="/room/'+roomAddress.value+'/logs/' + value + '" target="_blank">' + value.split('.')[0] + '</a></td></tr>');
	        }
	    });
	});
	socket.on('disconnect', function (username) {
	    console.log(username + " has disconnected");
	    try {
	        d = document.getElementById("webcam");
	        Meeting[username].onForcedHangup();
	        Meeting[username] = null;
	        d.removeChild(document.getElementById("video" + username));
	    } catch (e) {
	        console.log("User not avaliable to remove " + e);
	    }
	});
	// listener, whenever the server emits 'updatechat', this updates the chat body
	socket.on('updatechat', function (username, data, sticky) {
	    $.titleAlert("New chat message!", {
	        requireBlur: false,
	        stopOnFocus: true,
	        stopOnMouseMove: true,
	        interval: 700
	    });
	    date = new Date();
	    var hours = date.getHours()
	    var minutes = date.getMinutes()
	    if (minutes < 10) {
	        minutes = "0" + minutes
	    }
	    if (sticky == 'true') {
	        $('#chat-body').append('<tr"><td style="min-width: 140px; color: black; word-wrap: break-word;"><strong><i>' + username.split('[')[0] + ' </strong> [' + username.split('[')[1] + '</i>: <i>' + data + '</i></td></tr>');
	    } else {
	        $('#chat-body').append('<tr"><td style="min-width: 140px; color: black; word-wrap: break-word;"><strong>' + username + '</strong> [' + hours + ':' + minutes + ']: ' + data + '</td></tr>');
	    }
	    $('#chat').scrollTop(9000);
	});

	//Listener for incomming signaling messages
	socket.on('onSignaling', function (message) {
	    if ((Meeting[message.from] == undefined) || (Meeting[message.from] == null)) {
	        console.log("Starting call with " + message.from);
	        Meeting[message.from] = new Conference();
	        Meeting[message.from].setLocalVideo("localVideo", function (status) {
	            if (status == true) {
	                //Meeting[message.from].setLocalStream(globalLocalStream);
	                Meeting[message.from].Answer(message.from, "webcam", function (status) {
	                    if (status == true) {
	                        addHangButton(message.from);
	                        Meeting[message.from].onChannelMessage(message);
	                    } else {
	                        console.log("Error answering call");
	                    }
	                });
	            } else {
	                console.log("Error");
	            }
	        });
	        counter = counter + 1;
	    } else if (Meeting[message.from]) {
	        Meeting[message.from].onChannelMessage(message);
	    } else {
	        console.log("Unexpected error");
	    }
	});
	// listener, whenever the server emits 'updateusers', this updates the username list
	socket.on('updateusers', function (data) {
	    $('#users-body').empty();
	    $.each(data, function (key, value) {
	        if (value == me) {
	            $('#users-body').append('<tr><td id="' + userName.value + '"><h4 style="font-size: 13px;">' + userName.value + ' (me)</h4></td></tr>');
	        } else {
	            $('#users-body').append('<tr><td id="' + value + '"><h4 style="font-size: 13px;">' + value + '</h4></td></tr>');
	            $('#' + key).attr('onclick', 'start("' + value + '")');
	        }
	    });
	});
	socket.on('file', function (username, data) {
	    //console.log('HERE');
	    //console.log(username +' sent ' + data);
	    document.getElementById('drop').innerHTML = username + ' sent:<br>' + data;
	});
	socket.on('image', function (username, data) {
	    //console.log('HERE');
	    //console.log(username +' sent ' + data);
	    img = document.createElement('img');
	    img.style.height = "100%";
	    img.src = 'data:image/bmp;base64,' + data;
	    document.getElementById('drop').innerHTML = '';
	    document.getElementById('drop').appendChild(img);
	});

	var globalLocalStream;
	var localVideo = document.getElementById("localVideo");
	var mainVideo = document.getElementById("mainVideo");
	// on load of page
	$(function () {
	    // when the client hits ENTER on their keyboard
	    $('#data').keypress(function (e) {
	        if ((me != null) || (me != "")) {
	            if (e.which == 13) {
	                if ($("#data").val() != null || $("#data").val() != "") {
	                    if ($(this).val().length > 0) { //If something is written
	                        e.preventDefault();
	                        var message = $('#data').val();
	                        $('#data').val('');
	                        $(this).blur();
	                        socket.emit('sendchat', message);
	                        $('#chat').scrollTop(9000);
	                        mixpanel.track('Chat message', {
	                            'page name': document.title,
	                            'url': window.location.pathname,
	                            'user': userUserName.value
	                        });
	                    }
	                }
	                $('#data').focus();
	            }
	        }
	    });
	    $('#data').focus();
	});
	getUserMedia = function (callback) {
	    // getUserMedia() feature detection
	    navigator.getUserMedia_ = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
	    if (navigator.getUserMedia_) {
	        try {
	            //Object based request (new versions of Chrome)
	            navigator.getUserMedia_({
	                audio: true,
	                video: true
	            }, function (stream) {
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
	                if (callback) callback(true);
	            }, onUserMediaError);
	            console.log("Requested access to local media with new syntax.");
	        } catch (e) {
	            try {
	                //String based request for usermedia (Opera and old Chrome versions)
	                navigator.getUserMedia_("video,audio", function (stream) {
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
	                    if (callback) callback(true);
	                }, onUserMediaError);
	                console.log("Requested access to local media with old syntax.");
	            } catch (e) {
	                alert("webkitGetUserMedia() failed. Is the MediaStream flag enabled in about:flags?");
	                console.log("webkitGetUserMedia failed with exception: " + e.message);
	                if (callback) callback(false);
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
	        console.log("Starting call to " + id);
	        Meeting[id] = new Conference();
	        Meeting[id].setLocalVideo("localVideo", function (status) {
	            if (status == true) {
	                //Meeting[id].setLocalStream(globalLocalStream);
	                Meeting[id].Call(id, "webcam", function (status) {
	                    if (status == false) {
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

	function addHangButton(id) {
	    //$('#'+id).attr('onclick','');
	    document.getElementById(id).setAttribute('style', 'color:#A65500;');
	    //_elem = "<input type=\\"button\" id=\"hangup"+id+"\" value=\""+id+" (Hang up)\" onclick=\"Meeting['"+id+"'].onHangup()\" />"
	    //$('#buttons').append(_elem);
	}
	//Drag and drop
	var totFSize = 0;
	if (window.FileReader) {
	    addEventHandler(window, 'load', function () {
	        var status = document.getElementById('status');
	        var drop = document.getElementById('drop');

	        function cancel(e) {
	            if (e.preventDefault) {
	                e.preventDefault();
	            }
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
	    if (obj.addEventListener) {
	        // W3C method
	        obj.addEventListener(evt, handler, false);
	    } else if (obj.attachEvent) {
	        // IE method.
	        obj.attachEvent('on' + evt, handler);
	    } else {
	        // Old school method.
	        obj['on' + evt] = handler;
	    }
	}
	addEventHandler(drop, 'drop', function (e) {
	    e = e || window.event; // get window.event if e argument missing (in IE)
	    if (e.preventDefault) {
	        e.preventDefault();
	    } // stops the browser from redirecting off to the image.
	    var dt = e.dataTransfer;
	    var files = dt.files;
	    for (var i = 0; i < files.length; i++) {
	        uploadFile(files[i], i);
	    }
	    return false;
	});
	//Process the file and if it conains text or img
	function uploadFile(file, totalFiles) {
	    var reader = new FileReader();
	    // Handle errors that might occur while reading the file (before upload).
	    reader.onerror = function (evt) {
	        var message;
	        // REF: http://www.w3.org/TR/FileAPI/#ErrorDescriptions
	        switch (evt.target.error.code) {
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
	    if (file.type.indexOf("text") >= 0) {
	        var reader = new FileReader();
	        reader.onload = function (e) {
	            result = e.target.result;
	            console.log(result);
	            socket.emit('file', result);
	            console.log('File correctly sent');
	            document.getElementById('drop').innerHTML = 'File sent. Drag another file to send again.';
	        }
	        reader.readAsBinaryString(file);
	    } else {
	        // When the file is done loading, POST to the server.
	        reader.onloadend = function (evt) {
	            var data = evt.target.result;
	            // Make sure the data loaded is long enough to represent a real file.
	            if (data.length > 128) {
	                /*
	                 * Per the Data URI spec, the only comma that appears is right after
	                 * 'base64' and before the encoded content.
	                 */
	                var base64StartIndex = data.indexOf(',') + 1;
	                /*
	                 * Make sure the index we've computed is valid, otherwise something
	                 * is wrong and we need to forget this upload.
	                 */
	                if (base64StartIndex < data.length) {
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
	mainWindow = function (object) {
	    $("video").css("border", "0px");
	    document.getElementById("mainVideo").style.opacity = 1;
	    document.getElementById("mainVideo").setAttribute("src", "");
	    document.getElementById("mainVideo").setAttribute("src", object.getAttribute("src"));
	    object.setAttribute("style", "-webkit-transition: opacity 2s; -webkit-transform: scale(-1, 1); opacity: 1; margin-right: 3px; height:90%; border: 2px solid #6C7B84; padding:1px;");
	}	
})