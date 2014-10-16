$.noty.defaults.layout = 'bottom';
$.noty.defaults.killer = true;
$.noty.defaults.timeout = 1500;
$.noty.defaults.closeWith = ['click', 'button'];

(function() {
	var user_id = -1,
		username = '';
	
	/* --- Login --- */
	$('.login-container').hide();
	$('.login-link').click(function() {
		$('.login-link').hide();
		$('.login-container').show();
	});
	
	$('#login-form').on('submit', function(evt) {
		evt.preventDefault();
		NProgress.start();
		
		$.post('php/login.php', {
			username: $('#login-form-username').val(),
			password: $('#login-form-password').val()
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

			if (user_id) {
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
			}
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
				addTaskToDisplay(tasks[i].task, tasks[i].list);
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

			addTaskToDisplay(taskObj.task, taskObj.list, taskObj.date_created);
		}).fail(function(data) {
			console.log(data);
			noty({type: 'warning', text: 'Failed to contact server'});
		});
	};
	var addTaskToDisplay = function(task, list, date_created) {
		$('.block-' + list).append('<div class="task">' + task + '</div>');	
	};

		
	/* --- Docs functionality --- */
	$('.docs-title').click(function() {
		$('.docs-text').toggle();
		$('.docs-title').text(function() {
			return ($('.docs-text').is(':visible'))	? 'hide help' : 'show help';
		});
	});
})();
