
$(document).ready(function(){

	var hc = new HomeController();

	$('#name-tf').focus();
	//$('#github-banner').css('top', '41px');

// customize the account settings form //
	
	$('#account-form h1').text('Account Settings');
	$('#account-form #sub1').text('Here are the current settings for your account.');
	$('#user-tf').attr('disabled', 'disabled');
	$('#account-form-btn1').html('Delete');
	$('#account-form-btn1').addClass('btn-danger');
	$('#account-form-btn2').html('Update');


// customize the home form //
	
	$('#home-form h1').text('Rooms');
	$('#home-form #sub1').text('Hi '+userName.value+' here are your avaliable rooms');
	
// setup the confirm window that displays when the user chooses to delete their account //

	$('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
	$('.modal-confirm .modal-header h3').text('Delete Account');
	$('.modal-confirm .modal-body p').html('Are you sure you want to delete your account?');
	$('.modal-confirm .cancel').html('Cancel');
	$('.modal-confirm .submit').html('Delete');
	$('.modal-confirm .submit').addClass('btn-danger');
	
	//$('#name_label').html(userName.value);

	//$('#name_user').html('Welcome '+userName.value);
	
})