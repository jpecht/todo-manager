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
	
	// colors!
	var color_task_complete = '#5EC85E';


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
						
			fillListNames();
			getTasks();
		}
	}).fail(failFunction);


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
		}).fail(failFunction);
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
			var response = $.parseJSON(data);
			if (response.hasOwnProperty('error')) {
				noty({type: 'warning', text: response.error, timeout: 3000});
			} else {
				// on success: refresh page
				window.location = './index.html';
			}
		}).fail(failFunction);
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
				// if only given list name, find list num
				if (!cmd.hasOwnProperty('list_num') && cmd.hasOwnProperty('list_name')) {
					// for rename, switch the second and third word
					if (cmd.action === 'rename') {
						var oldListName = cmd.description;
						var newListName = cmd.list_name;
						cmd.list_name = oldListName;
						cmd.description = newListName;
					}
					
					var matched_list_name = false;
					for (var i = 1; i <= USR.num_lists; i++) {
						if (USR['list_name_' + i] === cmd.list_name) {
							matched_list_name = true;
							cmd.list_num = i;
							break;
						}
					}
					if (matched_list_name === false) {
						noty({type: 'warning', text: '<strong>Invalid command!</strong><br/>List name does not match existing lists.'});
						return;
					}
				}
				
				// execute action
				if (cmd.action === 'add') addTask(cmd.description, cmd.list_num, cmd.options);
				else if (cmd.action === 'rename') renameList(cmd.description, cmd.list_num, cmd.options);
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
	
	
	/* --- Task Manipulation --- */
	// -------- tasks --------- //
	var getTasks = function() {
		$.post('php/get_tasks.php')
			.done(function(data) {
				var tasks = $.parseJSON(data);
				tasks.sort(function(a, b) {
					return a.order_id - b.order_id;
				});
				for (var i = 0; i < tasks.length; i++) addTaskToDisplay(tasks[i]);
			})
			.fail(failFunction);
	};
	var addTask = function(task, list, opts) {
		NProgress.start();
		$.post('php/add_task.php', {
			description: task,
			list_num: list
		}).always(function() {
			NProgress.done();
		}).done(function(data) {
			var response = $.parseJSON(data);
			if (response.hasOwnProperty('error')) {
				noty({type: 'warning', text: '<strong>Trouble adding task</strong><br/>' + response.error});
			} else {
				addTaskToDisplay(response);				
			}
		}).fail(failFunction);
	};
	var addTaskToDisplay = function(taskObj) {
		var task = $('<li class="task">' + taskObj.description + '</li>');
		var task_close = $('<img class="task-close-icon" src="img/square_close_16.png" height="16" width="16">');
		task.appendTo('.block-' + taskObj.list_num)
			.attr('id', 'task-' + taskObj.task_id)
			.attr('task_id', taskObj.task_id)
			.attr('order_id', taskObj.order_id);
		task_close.appendTo(task)
			.click(function() {
				completeTask(taskObj.task_id);
			});
	};
	var completeTask = function(task_id) {
		NProgress.start();
		$.post('php/complete_task.php', {
			task_id: task_id
		}).done(function(data) {			
			var response = $.parseJSON(data);
			if (response.hasOwnProperty('error')) {
				noty({type: 'warning', text: '<strong>Trouble with server completing task</strong><br/>' + response.error});
			} else {
				// animate task out then disappear
				NProgress.done();
				
				var task_element = $('#task-' + task_id);
				task_element.animate({
					color: 'white',
					backgroundColor: color_task_complete
				}, 300, 'linear', function() {
					setTimeout(function() {
						task_element.animate({
							opacity: 0
						}, 300, 'linear', function() {
							task_element.remove();
						});
					}, 200);
				});
			}		
		}).fail(failFunction);
	};

	// --------- lists ---------- //
	var fillListName = function(num) {
		$('.block-title[name="list-name-' + num + '"]').html(USR['list_name_' + num]);
	};
	var fillListNames = function() {
		for (var i = 1; i <= USR.num_lists; i++) fillListName(i);
	};
	var renameList = function(list_name, list_num, opts) {
		NProgress.start();
		$.post('php/rename_list.php', {
			list_name: list_name,
			list_num: list_num
		}).always(function() {
			NProgress.done();
		}).done(function(data) {
			var response = $.parseJSON(data);
			if (response.hasOwnProperty('error')) {
				noty({type: 'warning', text: '<strong>Trouble renaming list</strong><br/>' + response.error});
			} else {
				USR['list_name_'+list_num] = list_name;
				fillListName(list_num);
			}
		}).fail(failFunction);
	};

	
	/* --- Command Line Validation --- */
	var parseCommand = function(str) {
		var cmd = {
			isValid: false,
			options: {}
		};
		
		// determine action
		if (str.indexOf(' ') === -1) {
			cmd.error = 'No spaces T_T';
			return cmd;
		}
		var action = str.substr(0, str.indexOf(' '));
		if (action === 'add' || action === 'rename') {
			cmd.action = action;
		} else {
			cmd.error = 'Unrecognizable action';
			return cmd;
		}

		// split string into action, description, list
		var splitArr = [];
		var singleQuote = "'", doubleQuote = '"';
		var singleQuoteIndex = str.indexOf(singleQuote),
			doubleQuoteIndex = str.indexOf(doubleQuote);			
		if (singleQuoteIndex === -1 && doubleQuoteIndex === -1) {
			// no quotes being used
			splitArr = str.split(' ');
		} else {
			if (singleQuoteIndex === -1 || (doubleQuoteIndex <= singleQuoteIndex && doubleQuoteIndex !== -1)) {
				// double quote being used
				splitArr = str.match(/(?:[^\s"]+|"[^"]*")+/g);
			} else {
				// single quote being used
				splitArr = str.match(/(?:[^\s']+|'[^']*')+/g);
			}
			// remove quotes
			for (var i = 0; i < splitArr.length; i++) splitArr[i] = splitArr[i].replace(/['"]+/g, '');
		}

		if (splitArr.length === 2) {
			// ex: "add clean"
			cmd.isValid = true;
			cmd.description = splitArr[1];
			cmd.list_num = 1;
		} else if (splitArr.length >= 3) {
			// ex: "add clean -1" or "rename small mysmall"
			cmd = parseComponents(cmd, splitArr[1], splitArr[2]);
			
			if (splitArr.length > 3) {
				for (var j = 3; j < splitArr.length; j++) {
					var optionArr = splitArr[j].split(':');
					if (optionArr.length != 2) return cmd;
					else cmd.options[optionArr[0]] = optionArr[1];
				}
			}				
		}

		return cmd;
	};
	var parseComponents = function(cmd, description, list) {
		if (list.charAt(0) !== '-') {
			cmd.isValid = true;
			cmd.description = description;
			cmd.list_name = list;
		} else {
			var listObj = parseListStr(list);
			if (listObj.isValid) {
				cmd.isValid = true;
				cmd.description = description;
				cmd.list_num = listObj.list_num;
			} else {
				cmd.error = 'Error with list specification';
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


	/* --- Initialize Task Sortability --- */
	$('.block').sortable({
		update: function(evt, ui) {
			var new_order_id,
				prev_order_id = +ui.item.prev().attr('order_id');
				next_order_id = +ui.item.next().attr('order_id');

			if (isNaN(prev_order_id)) {
				new_order_id = next_order_id / 2;
			} else if (isNaN(next_order_id)) {
				new_order_id = prev_order_id + 1000;
			} else {
				new_order_id = prev_order_id + (next_order_id - prev_order_id) / 2;
			}

			// change order in database
			$.post('php/change_task_order.php', {
				order_id: new_order_id,
				task_id: ui.item.attr('task_id')
			}, function(data) {
				var response = $.parseJSON(data);
			});

			ui.item.attr('order_id', new_order_id);
		}
	});


	// --- Shield --- //
	$('.shield').click(function() {
		var scope = angular.element($('.status-overlay')).scope();
		scope.$apply(function() { scope.sc.hideForm(); });		
	});

	/* --- Helper Functions --- */
	var failFunction = function(data) {
		console.log(data);
		noty({type: 'warning', text: 'Failed to contact server'});
	};
})();