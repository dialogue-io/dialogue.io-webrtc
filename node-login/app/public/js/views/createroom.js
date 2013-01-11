$(document).ready(function(){


	formFields = [$('#name-tf'), $('#address-tf'), $('#token-tf'), $('#members-tf')];    		
	controlGroups = [$('#name-cg'), $('#address-cg'), $('#token-cg'), $('#members-cg')];

	var memberslist = [];
	//File that controls the createRoom page

	$('#token-tf').attr('disabled', true);
	$('#randomtoken').attr('disabled', true);
	$('#address-tf').attr('disabled', true);
	$('#address-tf').val(randomizer(10,true));

	//Generate random token for access
	$('#randomtoken').click(function(){
		randomstring = randomizer(8);
		$('#token-tf').val(randomstring);
	});

	function randomizer(length,bool) {
		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
		var string_length = 8;
		var randomstring = '';
		for (var i=0; i<string_length; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum,rnum+1);
		}
		if (bool == true){
			//If it is used to build the address it should be in lower case
			randomstring = randomstring.toLowerCase();
		}
		return randomstring;
	}


	$('#membersadd').click(function(){
		var e = [];
		if (formFields[3].val() == '' || formFields[3].val() == null) {
			controlGroups[3].addClass('error'); e.push('Invalid username');
			$('#membershelp').html('Invalid username');			
		} else {
			exists = false;
			controlGroups[3].removeClass('error');
			$('#membershelp').html('Add members usernames that will access the room');	
		    for (i=0; i<memberslist.length; i++) {
		    	if (memberslist[i] == formFields[3].val()) {
		    		exists = true;
		    	}
		    }	
		    if ((exists != true) && (formFields[3].val() != userUserName.value)) {
				memberslist.push(formFields[3].val());
				$('#memberslist-div').append('<strong>- '+formFields[3].val()+'</strong><br>');
				console.log(memberslist);
		    } else if (formFields[3].val() == userUserName.value) {
		    	$('#membershelp').html('You cannot add yourself! You are the owner :)');	
		    }
		}
	});

	$("#private_room-tf").click(function() {
	    // this function will get executed every time the #private-tf element is clicked (or tab-spacebar changed)
	    if($(this).is(":checked")) // "this" refers to the element that fired the event
	    {
        	$('#token-tf').attr('disabled', false);
			$('#randomtoken').attr('disabled', false);
	    } else {
			$('#token-tf').attr('disabled', true);
			$('#randomtoken').attr('disabled', true);    	
	    }
	});

	$("#createroom-form-submit").click(function() {
		$("#private_room-tf").attr("disabled", true);
	});
	
	$('#createroom-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			var e = [];
			if (formFields[0].val() == '' || formFields[0].val() == null || formFields[0].val().length < 4){
				controlGroups[0].addClass('error'); e.push('Invalid name, should contain 4 characters');
				$('#namehelp').html('Invalid name, must contain 4 characters minimum');
				return false;
			} else if (formFields[1].val() == '' || formFields[1].val() == null || formFields[1].val().length < 4){
				controlGroups[1].addClass('error'); e.push('Invalid url, should contain 4 characters');
				$('#urlhelp').html('Invalid url, must contain 4 characters minimum');
				return false;
			} else if ($("#private_room-tf").is(":checked") && ((formFields[2].val() == '' || formFields[2].val() == null || formFields[2].val().length < 6))){
				controlGroups[2].addClass('error'); e.push('Invalid token, should contain 6 characters');
				$('#tokenhelp').html('Invalid token, must contain 6 characters minimum');
				return false;
			} else {
				formData.push({name:'createroom', value: userUserName.value},{name:'memberslist', value: memberslist},{name:'address', value: formFields[1].val()},{name:'private_room', value: $("#private_room-tf").is(":checked")});
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
            mixpanel.track('Room created', {
                'page name': document.title,
                'url': window.location.pathname,
                'user': userUserName.value
            });
			if (status == 'success') onUpdateSuccess();
		},
		error : function(e){
			if (e.responseText == 'name-taken'){
			    showInvalidEmail();
			}	else if (e.responseText == 'address-taken'){
			    showInvalidUserName();			
			}
		}
	});
	
	validateAddress = function(e)
	{
	  	var alphaExp = /^[a-zA-Z]+$/;
		if(e.val().match(alphaExp)){
			return true;
		}else{
			e.focus();
			return false;
		}
	}	
	
	function onUpdateSuccess(){
		$('.modal-alert').modal({ show : false, keyboard : true, backdrop : true });				
		$('.modal-alert .modal-header h3').text('Success!');
		$('.modal-alert .modal-body p').html('Your room has been created.'); 				
		$('.modal-alert').modal('show');
		$('.modal-alert button').off('click');
		$('.modal-alert #ok').click(function(){ setTimeout(function(){window.location.href = '/room/'+formFields[1].val()}, 300)});		
	}


});