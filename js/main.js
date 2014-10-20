$.noty.defaults.layout = 'bottom';
$.noty.defaults.killer = true;
$.noty.defaults.timeout = 1500;
$.noty.defaults.closeWith = ['click', 'button'];

(function() {
	var USR = {'logged_in': false}; // user information (username, email, etc.)
	
	/* --- Check for Returning User --- */
	$.post('php/init.php').done(function(data) {
		var response = $.parseJSON(data);
		
		console.log(response);
		
		if (!response.hasOwnProperty('error')) {
			USR.logged_in = true;
			for (var ind in response) USR[ind] = response[ind];			

			// hide buttons and show logged in text
			$('.logged-in-text').html('logged in as ' + USR.username);	
			var scope = angular.element($('.status-overlay')).scope();
			scope.$apply(function() {
				scope.sc.buttonsShowing = false;
			});
			
			getTasks();
		}
	});


	/* --- Register --- */
	$('#register-form').on('submit', function(evt) {
		evt.preventDefault();
		NProgress.start();
		
		$.post('php/register.php', {
			email: $('#register-form-email').val(),
			username: $('#register-form-username').val(),
			passhash: md5($('#register-form-password').val())
		}).always(function() {
			NProgress.done();
		}).done(function(data) {
			if (data.hasOwnProperty('success')) {
				noty({type: 'success', text: "<strong>You're registered!</strong><br/>Now log in."});
			} else {
				noty({type: 'warning', text: data.error});
			}
		}).fail(function(data) {
			console.log('Error with register.php');
			console.log(data);
		});
	});
	
	/* --- Login --- */
	$('#login-form').on('submit', function(evt) {
		evt.preventDefault();
		NProgress.start();
		
		$.post('php/login.php', {
			username: $('#login-form-username').val(),
			passhash: md5($('#login-form-password').val())
		}).always(function() {
			$('.login-container').hide();
			NProgress.done();
		}).done(function(data) {			
			try { var response = $.parseJSON(data); }
			catch(e) {
				console.log(e);
				noty({type: 'warning', text: 'There was a problem logging in. =('});
				return;
			}

			if (response.hasOwnProperty('error')) {
				noty({type: 'warning', text: response.error, timeout: 3000});
			} else {
				// on success: refresh page
				window.location = './index.html';
			}
		}).fail(function(data) {
			console.log(data);
			noty({type: 'warning', text: 'Failed to contact server'});			
		});
	});
	
	
	/* --- Command Line Input --- */
	$('.cmdline').on('keypress', function(evt) {
		if (evt.which === 13) {
			if (!USR.logged_in) {
				noty({type: 'warning', text: 'Log in first!'});				
				return;
			}
			
			// TODO write command line validation
			var cmdStr = $('.cmdline').val();
			var cmdIsValid = true;
			
			if (cmdIsValid) {
				NProgress.start();
				
				var taskName = cmdStr.split('"')[1]; // TODO add support for single quotes
				var listName = cmdStr.substr(cmdStr.indexOf('-') + 1, 1);
				addTask(taskName, listName);

				$('.cmdline').val('');
				NProgress.done();
			}
		}
	});


	/* --- Task Management --- */
	var getTasks = function() {
		$.post('php/get_tasks.php', {
			user_id: USR.user_id
		}).always(function() {
			
		}).done(function(data) {
			var tasks = $.parseJSON(data);
			for (var i = 0; i < tasks.length; i++) addTaskToDisplay(tasks[i].description, tasks[i].list_name);
		}).fail(function() {
			console.log(data);
			noty({type: 'warning', text: 'Failed to contact server'});
		});
	};
	var addTask = function(task, list) {		
		$.post('php/add_task.php', {
			user_id: USR.user_id,
			description: task,
			list_name: list
		}).always(function() {
			NProgress.done();
		}).done(function(data) {
			var taskObj = $.parseJSON(data);
			addTaskToDisplay(task, list);
		}).fail(function(data) {
			console.log(data);
			noty({type: 'warning', text: 'Failed to contact server'});
		});
	};
	var addTaskToDisplay = function(description, list_name) {
		$('.block-' + list_name).append('<div class="task">' + description + '</div>');	
	};
})();