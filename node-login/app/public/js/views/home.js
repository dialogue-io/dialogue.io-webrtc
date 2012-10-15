
$(document).ready(function(){
	
	var hc = new HomeController();
	var av = new AccountValidator();
	
	$('#account-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (av.validateForm() == false){
				return false;
			} 	else{
			// push the disabled username field onto the form data array //	
				formData.push({name:'user', value:$('#user-tf').val()})
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') hc.onUpdateSuccess();
		},
		error : function(e){
			if (e.responseText == 'email-taken'){
			    av.showInvalidEmail();
			}	else if (e.responseText == 'username-taken'){
			    av.showInvalidUserName();
			}
		}
	});
	$('#name-tf').focus();
	//$('#github-banner').css('top', '41px');

// customize the account form //
	
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
	    var geocoder;
    
//GEOLOCATION
	if (navigator.geolocation) {
	  navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
	} 
	//Get the latitude and the longitude;
	function successFunction(position) {
	  var lat = position.coords.latitude;
	  var lng = position.coords.longitude;
	  codeLatLng(lat, lng)
	}
      
	function errorFunction(){
	  alert("Geocoder failed");
	}
      
	function initialize() {
	  geocoder = new google.maps.Geocoder();
	}
	function codeLatLng(lat, lng) {
	var latlng = new google.maps.LatLng(lat, lng);
	geocoder.geocode({'latLng': latlng}, function(results, status) {
	  if (status == google.maps.GeocoderStatus.OK) {
	  //console.log(results)
	    if (results[1]) {
	     //formatted address
	     //alert(results[0].formatted_address)
	    //find country name
		 for (var i=0; i<results[0].address_components.length; i++) {
		for (var b=0;b<results[0].address_components[i].types.length;b++) {
    
		//there are different types that might hold a city admin_area_lvl_1 usually does in come cases looking for sublocality type will be more appropriate
		    if (results[0].address_components[i].types[b] == "locality") {
			//this is the object you are looking for
			city= results[0].address_components[i];
			//console.log(results[0].address_components[i])
			break;
		    }
		}
	    }
	    //city data
	    //console.log(city.long_name);
		mixpanel.track('Home visit', {'page name' : document.title, 'url' : window.location.pathname, 'usr' : userName.value, 'location' : city.long_name});
    
	    } else {
	      alert("No results found");
	    }
	  } else {
	    alert("Geocoder failed due to: " + status);
	  }
	});
      }
      
      initialize();
})