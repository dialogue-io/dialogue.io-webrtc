$(document).ready(function(){

	formFields = $('#token-tf');    		
	controlGroups = $('#token-cg');

	tokenErrors = $('.modal-alert');
    tokenErrors.modal({ show : false, keyboard : true, backdrop : true });
	//File that controls the createRoom page

	$('#token-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			var e = [];
			if (formFields.val() == '' || formFields.val() == null || formFields.val().length < 6) {
				controlGroups.addClass('error'); e.push('Invalid token, should contain 6 characters');
				$('#tokenhelp').html('Invalid token, must contain 6 characters minimum');
				return false;
			} else {
				console.log(formFields.val());
				formData.push({name:'token', value: formFields.val()},{name:'address', value: roomAddress.value});
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') onUpdateSuccess();
		},
		error : function(e){
			if (e.responseText == 'invalid-token'){
			    showInvalidToken();
			} else if (e.responseText == 'room-not-found'){
			    showRoomNotFound();
			}
		}
	});
	
	function onUpdateSuccess(){
		$('.modal-alert').modal({ show : false, keyboard : true, backdrop : true });				
		$('.modal-alert .modal-header h3').text('Success!');
		$('.modal-alert .modal-body p').html('Token is correct!'); 				
		$('.modal-alert').modal('show');
		$('.modal-alert button').off('click');
		$('.modal-alert #ok').click(function(){ setTimeout(function(){window.location.href = '/room/'+roomAddress.value}, 300)});		
	}

	showInvalidToken = function()
	{
		controlGroups.addClass('error');
		showErrors(['Token problem'],['The token do not match the requested room, check it again.']);
	}

	showRoomNotFound = function()
	{
		controlGroups.addClass('error');
		showErrors(['Not found.'],['Room not found, are you sure this is the right place?']);
	}

	tokenErrors = $('.modal-alert');
    tokenErrors.modal({ show : false, keyboard : true, backdrop : true });

	showErrors = function(t, m)
	{
	    $('.modal-alert .modal-header h3').text(t);	    
	    $('.modal-alert .modal-body p').text(m);
	    tokenErrors.modal('show');
	}
});