$(document).ready(function(){
	var that = this;
	var userList={users:[]};
	var counter=0;
	
	/*
	$(":checkbox").click(function(){
		counter=0;
		userList={users:[]};
        if($(this).is(':checked') == false) {
    		userList.users.push({name: $(this).attr('id'), admin: $(this).is(':checked')});
 		}
		$("input.admin[type=checkbox]:[checked]").each( 
		    function() {
		    	userList.users.push({name: $(this).attr('id'), admin: $(this).is(':checked')});
		    	counter=counter+1;
		    }
		);
		console.log(JSON.stringify(userList));
	});
	*/

	$(":checkbox").click(function(){
		userList.users.push({name: $(this).attr('id'), admin: $(this).is(':checked')});
		//console.log(JSON.stringify(userList));
	});



	//Updating database
	$('#admin-form-btn2').click(function(){
		var that = this;
		if (userList.users == ''){
			setTimeout(function(){window.location.href = '/admin';}, 3000);	
		} else{
			$.ajax({
				url: "/admin",
				type: "POST",
				data: {update: true, users: userList.users},
				//beforeSend: function (xhr) { xhr.setRequestHeader('X-CSRF-Token', $('#_csrf').val()) },
				success: function(data){	
					$('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });				
					$('.modal-alert .modal-header h3').text('Success!');
					$('.modal-alert .modal-body p').html('Accounts updated. Redirecting to admin page.');
					$('.modal-alert').modal('show');
					$('.modal-alert button').click(function(){window.location.href = '/admin';})
					setTimeout(function(){window.location.href = '/admin';}, 3000);	
				},
				error: function(jqXHR){
					console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
				}		
			});
		}
	});


})