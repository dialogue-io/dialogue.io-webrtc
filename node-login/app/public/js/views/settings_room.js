$(document).ready(function(){


	formFields = [$('#name-tf'), $('#address-tf'), $('#token-tf'), $('#members-tf')];    		
	controlGroups = [$('#name-cg'), $('#address-cg'), $('#token-cg'), $('#members-cg')];

	var memberslist = [];
	//File that controls the createRoom page

	/*$('#address-tf').change(function(){
		text = $('#address-tf').val();
		text = text.toLowerCase();
		$('#address-tf').val(text);
	});*/
	$('#address-tf').attr('disabled', true);
	//$('#address-tf').val(randomizer(10,true));

	//Generate random token for access
	$('#randomtoken').click(function(){
		randomstring = randomizer(8);
		$('#token-tf').val(randomstring);
	});

	$('.close').bind('click',function(event){
		console.log("delete user");
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


	$('#updateroom-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			var e = [];
			if (formFields[2].val().length < 6 && formFields[2].val().length != 0) {
				controlGroups[2].addClass('error'); e.push('Invalid token, should contain 6 characters');
				$('#tokenhelp').html('Invalid token, must contain 6 characters minimum');
				return false;
			} else if (formFields[0].val() == '' || formFields[0].val() == null || formFields[0].val().length < 4){
				controlGroups[0].addClass('error'); e.push('Invalid name, should contain 4 characters');
				$('#namehelp').html('Invalid name, must contain 4 characters minimum');
				return false;
			} else if (formFields[1].val() == '' || formFields[1].val() == null || formFields[1].val().length < 4){
				controlGroups[1].addClass('error'); e.push('Invalid url, should contain 4 characters');
				$('#urlhelp').html('Invalid url, must contain 4 characters minimum');
				return false;
			} else {
				formData.push({name:'updateroom', value: userUserName.value},{name:'memberslist', value: memberslist},{name:'address', value: formFields[1].val()});
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
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
		$('.modal-alert .modal-body p').html('Your room has been updated.'); 				
		$('.modal-alert').modal('show');
		$('.modal-alert button').off('click');
		$('.modal-alert #ok').click(function(){ setTimeout(function(){window.location.href = '/room/'+formFields[1].val()}, 300)});		
	}

	$('#deleteroom-form-btn').addClass('btn-danger');

	$('#memberstable').ready(function(){
		for(i=0;i<roomMembers.value.split(',').length;i++) {
			$('#memberstable').append('<tr id="table'+roomMembers.value.split(',')[i]+'"><td><strong>'+roomMembers.value.split(',')[i]+'</strong></td><td><a id='+roomMembers.value.split(',')[i]+' class="close">&times;</a><br></td></tr>');
			memberslist.push(roomMembers.value.split(',')[i]);
		}
		$('.close').click(function(){
			elem = $(this).attr('id')
			$.each(memberslist, function( index, result) {
				if(result == elem) {
					//Remove from array
					memberslist.splice(index, 1);
				}
		    });
		    $('#table'+$(this).attr('id')).remove();
		});
	});

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
		    if (exists != true) {
				memberslist.push(formFields[3].val());
				$('#memberstable').append('<tr id="table'+formFields[3].val()+'"><td><strong>'+formFields[3].val()+'</strong></td><td><a id='+formFields[3].val()+' class="close" onclick="removeMember($(this))">&times;</a><br></td></tr>');
				//console.log(memberslist);
		    }
		}
	});

	removeMember = function(name){
		elem = name.attr('id');
		$.each(memberslist, function( index, result) {
			if(result == elem) {
				//Remove from array
				memberslist.splice(index, 1);
			}
	    });
	    $('#table'+name.attr('id')).remove();
	}

	$('#deleteroom-form-btn').click(function()
	{
		var answer = confirm("Delete room?")
		if (answer){
			var that = this;	
			$.ajax({ 
				url: '/room/' + roomAddress.value + '/delete',
				type: 'POST',
				data: {id: roomId.value},
				success: function(data){
		 			onUpdateSuccess();
				},
				error: function(jqXHR){
					console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
				}
			});	
		}
	});


	

});