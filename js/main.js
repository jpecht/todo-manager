$.noty.defaults.layout = 'bottom';
$.noty.defaults.killer = true;
$.noty.defaults.timeout = 1500;
$.noty.defaults.closeWith = ['click', 'button'];

(function() {
	var user_id = -1,
		username = '';
	
	/* --- Check for Session --- */
	$.post('php/init.php').done(function(data) {

		console.log(data);

		var response = $.parseJSON(data);
		if (response.hasOwnProperty('username')) {
			$('.logged-in-text').html('logged in as ' + response.username);

			var scope = angular.element($('.status-overlay')).scope();
			scope.$apply(function() {
				scope.sc.buttonsShowing = false;
			});
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
		}).always(function(data) {
			NProgress.done();
			
			console.log('always');
			console.log(data);
		}).done(function(data) {
			console.log('done');
			console.log(data);
		}).fail(function() {
			console.log('fail');
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
				window.location = './index.html';
			}

			/*if (user_id) {
				user_id = response.user_id;
				username = response.user_name;
				$('.login-info').html('logged in as ' + username);
				getTasks(user_id);
			} else {
				user_id = -1;
				username = '';
				$('.login-link').show();
				noty({
					type: 'warning', 
					text: '<strong>Username/password combination is wrong.</strong><br/>Try using test/test for now.', 
					timeout: 3000
				});
			}*/
		}).fail(function(data) {
			console.log(data);
			noty({type: 'warning', text: 'Failed to contact server'});			
		});
	});
	
	
	/* --- Command Line Input --- */
	$('.cmdline').on('keypress', function(evt) {
		if (evt.which === 13) {
			if (username === '') {
				noty({type: 'warning', text: 'Log in first!'});				
				return;
			}
			
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
	var getTasks = function(user_id) {
		$.post('php/get_tasks.php', {
			user_id: user_id			
		}).always(function() {
			
		}).done(function(data) {
			try { var tasks = $.parseJSON(data); }
			catch(e) {
				console.log(e);
				noty({type: 'warning', text: 'There was a problem retrieving your tasks. =('});
				return;
			}

			for (var i = 0; i < tasks.length; i++) {
				addTaskToDisplay(tasks[i]);
			}
		}).fail(function() {
			
		});
	};
	var addTask = function(task, list) {
		$.post('php/add_task.php', {
			user_id: user_id,
			taskName: task,
			listName: list
		}).always(function() {
			NProgress.done();
		}).done(function(data) {
			try { var taskObj = $.parseJSON(data); }
			catch(e) {
				console.log(e);
				noty({type: 'warning', text: 'There was a problem adding your task. =('});
				return;
			}

			addTaskToDisplay(taskObj);
		}).fail(function(data) {
			console.log(data);
			noty({type: 'warning', text: 'Failed to contact server'});
		});
	};
	var addTaskToDisplay = function(task) {
		$('.block-' + task.list).append('<div class="task">' + task.task + '</div>');	
	};
})();