$.noty.defaults.layout = 'bottom';
$.noty.defaults.killer = true;
$.noty.defaults.timeout = 1500;
$.noty.defaults.closeWith = ['click', 'button'];

(function() {
	// user information (username, email, etc.)
	var USR = {
		logged_in: false,
		num_lists: 3
	};


	/* --- Check for Returning User --- */
	$.post('php/init.php').done(function(data) {		
		var response = $.parseJSON(data);		
		if (!response.hasOwnProperty('error')) {
			USR.logged_in = true;
			for (var ind in response) USR[ind] = response[ind];			

			// hide buttons and show logged in text
			$('.logged-in-text').html('logged in as ' + USR.username);
			var scope = angular.element($('.status-overlay')).scope();
			scope.$apply(function() {
				scope.sc.buttonsShowing = false;
			});
			
			// fill in list names
			for (var i = 1; i <= USR.num_lists; i++) {
				$('.block-title[name="list-name-' + i + '"]').html(USR['list_name_' + i]);
			}
			
			// get tasks			
			getTasks();
		}
	});


	/* --- Register --- */
	$('#register-form').on('submit', function(evt) {
		evt.preventDefault();
		
		// check if passwords match
		if ($('#register-form-password').val() !== $('#register-form-confirm-pw').val()) {
			$('#register-form-password, #register-form-confirm-pw').val('');
			noty({layout: 'center', type: 'warning', text: '<strong>Passwords do not match!</strong><br/>Try harder ;)'});
			return;
		}
		
		NProgress.start();
		
		$.post('php/register.php', {
			email: $('#register-form-email').val(),
			username: $('#register-form-username').val(),
			passhash: md5($('#register-form-password').val())
		}).always(function() {
			NProgress.done();
		}).done(function(data) {
			var response = $.parseJSON(data);
			if (response.hasOwnProperty('success')) {
				noty({type: 'success', text: "<strong>You're registered!</strong><br/>Check your email to log in."});
				var scope = angular.element($('.status-overlay')).scope();
				scope.$apply(function() {
					scope.sc.hideForm();
				});
			} else {
				noty({type: 'warning', text: response.error});
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

		var loginData = {
			username: $('#login-form-username').val(),
			passhash: md5($('#login-form-password').val()),
			autologin: $('#login-form input[type="checkbox"]').prop('checked')
		};

		// check for verification code in url
		if (window.location.search.substr(0, 7) === '?token=') {
			loginData.token = window.location.search.substring(7);
		}
		
		$.post('php/login.php', loginData).always(function() {
			$('.login-container').hide();
			NProgress.done();
		}).done(function(data) {

			console.log(data);

			var response = $.parseJSON(data);
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
			
			var cmd = parseCommand($('.cmdline').val());			
			if (cmd.isValid) {
				NProgress.start();
				
				if (cmd.action === 'add') addTask(cmd.description, cmd.list);
				else if (cmd.action === 'rename') renameList(cmd.description, cmd.list);
				
			} else {
				if (cmd.error) {
					noty({type: 'warning', text: '<strong>Invalid command!</strong><br/>' + cmd.error});	
				} else {
					noty({type: 'warning', text: '<strong>Invalid command!</strong><br/>Look at the docs below for clarification.'});
				}
			}
			$('.cmdline').val('');
		}
	});


	/* --- Task Management --- */
	var getTasks = function() {
		$.post('php/get_tasks.php', {
			user_id: USR.user_id
		}).always(function() {
			
		}).done(function(data) {
			var tasks = $.parseJSON(data);
			for (var i = 0; i < tasks.length; i++) addTaskToDisplay(tasks[i].description, tasks[i].list_num);
		}).fail(function() {
			console.log(data);
			noty({type: 'warning', text: 'Failed to contact server'});
		});
	};
	var addTask = function(task, list) {		
		$.post('php/add_task.php', {
			user_id: USR.user_id,
			description: task,
			list_num: list
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
	var addTaskToDisplay = function(description, list_num) {
		$('.block-' + list_num).append('<div class="task">' + description + '</div>');	
	};
	var renameList = function(list_name, list_num) {
		NProgress.done();
		$.post('php/rename_list.php', {
			
		});
	};
	
	/* --- Command Validation --- */
	var parseCommand = function(str) {
		var cmd = {isValid: false};
		
		// determine action
		if (str.indexOf(' ') === -1) return cmd;
		var action = str.substr(0, str.indexOf(' '));
		if (action === 'add' || action === 'rename') cmd.action = action;
		else return cmd;
		
		// first check if quotes are being used
		var singleQuote = "'", doubleQuote = '"';
		var singleQuoteIndex = str.indexOf(singleQuote),
			doubleQuoteIndex = str.indexOf(doubleQuote);
			
		if (singleQuoteIndex === -1 && doubleQuoteIndex === -1) {
			var splitArr = str.split(' ');
			if (splitArr.length === 2) {
				// ex: "add clean"
				cmd.isValid = true;
				cmd.description = splitArr[1];
				cmd.list = 1;
			} else if (splitArr.length === 3) {
				// ex: "add clean -1"
				var list = parseListStr(splitArr[2]);
				if (list.isValid) {
					cmd.isValid = true;
					cmd.description = splitArr[1];
					cmd.list = list.list_num;
				}
			}
		} else {
			// determine which type of quote to use
			var quote = singleQuote;
			if (doubleQuoteIndex <= singleQuoteIndex) quote = doubleQuote;
			
			// split into the three parts: action, description, list
			var splitByQuote = str.split(quote);
			if (splitByQuote.length === 3) {
				var list = parseListStr(splitByQuote[2].trim());
				if (list.isValid) {
					cmd.isValid = true;
					cmd.description = splitByQuote[1];
					cmd.list = list.list_num;
				}
			}				
		}
		return cmd;
	};
	var parseListStr = function(str) {
		var list = {isValid: false};
		if (str.length === 2) {
			list.list_num = parseInt(str.substr(1, 1));
			if (!isNaN(list.list_num) && list.list_num >= 1 && list.list_num <= USR.num_lists) {
				list.isValid = true;
			}
		}
		return list;
	};
})();