$.noty.defaults.layout = 'bottom';
$.noty.defaults.killer = true;
$.noty.defaults.timeout = 1500;
$.noty.defaults.closeWith = ['click', 'button'];

// colors!
var TASK_COLORS = ['#FFFFFF', '#AEC7E8', '#FFBB78', '#98DF8A', '#FF9896', '#C5B0D5', '#C49C94', '#F7B6D2', '#C7C7C7'];
var TASK_HOVER_COLORS = ['#DDDDDD', '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD', '#8C564B', '#E377C2', '#7F7F7F'];
var COLOR_SCHEMES = {
	light: {
		color: '#333333',
		background_color: '#FFFFFF',
		color_task_hover: '#B0A593', // not implemented
		color_task_complete: '#5EC85E', // not implemented
		color_logged_in_text: '#008000'
	},
	dark: {
		color: '#FFFFFF',
		background_color: '#272B30', // main primary
		color_task_hover: '#808080',
		color_task_complete: '#86977E', // light secondary
		color_logged_in_text: '#5EC85E'
	}
};
COLOR_SCHEMES.default = COLOR_SCHEMES.light;


(function() {
	// user information (username, email, etc.)
	var USR = {
		logged_in: false,
		num_lists: 3,
		tasks: []
	};
	
	// command line variables
	var cmd_history = [],
		cmd_history_index = -1,
		cmd_history_search_type = 'basic';

	// state variables
	var showing_completed_tasks = false;
	

	/* --- Check for Returning User --- */
	NProgress.start();		
	$.post('php/init.php')
		.always(function() { NProgress.done(); })
		.done(function(data) {
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
				
				applyColorScheme();
				$('.block-completed-link').show();
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
	$('.cmdline').on('keyup', function(evt) {
		var cmd_str = $('.cmdline').val().trim();
		
		// command history (up arrow)
		if (evt.which === 38) {
			if (cmd_history.length > 0 && cmd_history_index >= 0) {
				if (cmd_history_search_type !== 'match' && ((cmd_history_index === cmd_history.length - 1 && cmd_str === '') || (cmd_str === cmd_history[cmd_history_index + 1]))) {
					// going through command line history
					cmd_history_search_type = 'basic';
					$('.cmdline').val(cmd_history[cmd_history_index]);
					cmd_history_index--;			
				} else {
					// matching current string with history
					if (cmd_history_search_type !== 'match') {
						cmd_history_search_type = 'match';
						cmd_history_index = cmd_history.length - 1;
					}
					
					for (var i = cmd_history_index; i >= 0; i--) {
						if (cmd_history[i].substr(0, cmd_str.length) === cmd_str) {
							$('.cmdline').val(cmd_history[i]);
							cmd_history_index = i - 1; 
							break;
						}
					}
				}
			}
		} else {
			cmd_history_search_type = 'basic';
			cmd_history_index = cmd_history.length - 1;
		}

		// command submittal (enter)
		if (evt.which === 13) {
			if (!USR.logged_in) {
				noty({type: 'warning', text: 'Log in first!'});				
				return;
			}
			
			var cmd = parseCommand(cmd_str);			
			if (cmd.isValid) {
				// if only given list name, find list num
				if (!cmd.hasOwnProperty('list_num') && cmd.hasOwnProperty('list_name')) {
					if (cmd.action === 'rename') {
						// for rename, switch the second and third word
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
				else if (cmd.action === 'scheme') changeColorScheme(cmd.description);
			} else {
				if (cmd.error) {
					noty({type: 'warning', text: '<strong>Invalid command!</strong><br/>' + cmd.error});	
				} else {
					noty({type: 'warning', text: '<strong>Invalid command!</strong><br/>Look at the docs below for clarification.'});
				}
			}
			
			// store in history and empty
			cmd_history.push(cmd_str);
			cmd_history_index = cmd_history.length - 1;
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
					return +a.order_id - +b.order_id;
				});
				for (var i = 0; i < tasks.length; i++) {
					USR.tasks.push(tasks[i]);
					addTaskToDisplay(tasks[i]);
				}
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
			.attr('task-id', taskObj.task_id)
			.attr('order-id', taskObj.order_id)
			.attr('color-id', taskObj.color)
			.css('background-color', TASK_COLORS[taskObj.color])
			.css('opacity', 0.75)
			.toggleClass('task-complete', taskObj.date_completed !== null)
			.click(function() {
				var curr_color_id = +$(this).attr('color-id');
				var new_color_id = (curr_color_id < TASK_COLORS.length - 1) ? curr_color_id + 1 : 0;
				$(this)
					.attr('color-id', new_color_id)
					.css('background-color', TASK_COLORS[new_color_id]);
			}).mouseover(function() {
				$(this).css('opacity', 1);
			}).mouseout(function() {
				$(this).css('opacity', 0.75);
			});
		if (taskObj.date_completed !== null) {
			task.hide();
		} else {
			task_close.appendTo(task)
				.click(function() {
					completeTask(taskObj.task_id);
				});
		}
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

				// disable x'ing out task
				task_element.find('.task-close-icon').unbind('click');

				// complete task animation
				if (showing_completed_tasks) {
					task_element.addClass('task-complete');
				} else {
					task_element.animate({
						color: 'white',
						backgroundColor: COLOR_SCHEMES[USR.color_scheme].color_task_complete
					}, 300, 'linear', function() {
						setTimeout(function() {
							task_element.animate({
								opacity: 0
							}, 300, 'linear', function() {
								task_element.hide();
								task_element.addClass('task-complete');
							});
						}, 200);
					});
				}
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
		if (action === 'add' || action === 'rename' || action === 'scheme') {
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
			
			if (action === 'scheme' && !COLOR_SCHEMES.hasOwnProperty(splitArr[1])) {
				cmd.error = 'Color scheme not found';
				return cmd;				
			}
			
			cmd.isValid = true;
			cmd.description = splitArr[1];
			cmd.list_num = 1;
		} else if (splitArr.length >= 3) {
			// ex: "add clean -1" or "rename small mysmall"
			
			if (action === 'scheme') {
				cmd.error = 'Too many arguments given';
				return cmd;
			}
			
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
	
	
	/* --- Color Scheme --- */
	var applyColorScheme = function() {
		var current_scheme = COLOR_SCHEMES[USR.color_scheme];
		$(document.body)
			.css('background-color', current_scheme.background_color)
			.css('color', current_scheme.color);
		$('.logged-in-text')
			.css('color', current_scheme.color_logged_in_text);
	};
	var changeColorScheme = function(scheme) {
		NProgress.start();
		$.post('php/change_color_scheme.php', {
			color_scheme: scheme
		}).always(function(data) {
			NProgress.done();
		}).done(function(data) {
			var response = $.parseJSON(data);
			if (response.hasOwnProperty('error')) noty({type: 'warning', text: response.error});
			else {
				USR.color_scheme = scheme;
				applyColorScheme();
			}
		});
	};


	/* --- Initialize Task Sortability --- */
	$('.block').sortable({
		cancel: 'div',
		connectWith: '.block',
		update: function(evt, ui) {
			// reordering task within list
			var new_order_id,
				prev_order_id = +ui.item.prev().attr('order-id');
				next_order_id = +ui.item.next().attr('order-id');

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
				task_id: ui.item.attr('task-id')
			}, function(data) {
				var response = $.parseJSON(data);
				if (response.hasOwnProperty('error')) noty({type: 'warning', text: response.error});
			});

			ui.item.attr('order-id', new_order_id);
		},
		receive: function(evt, ui) {
			// moving task to another list (update gets fired twice as well)
			$.post('php/change_list.php', {
				task_id: ui.item.attr('task-id'),
				list_num: $(evt.target).attr('block-id')
			}, function(data) {
				var response = $.parseJSON(data);
				if (response.hasOwnProperty('error')) noty({type: 'warning', text: response.error});
			});
		}
	});


	// --- Shield --- //
	$('.shield').click(function() {
		var scope = angular.element($('.status-overlay')).scope();
		scope.$apply(function() { scope.sc.hideForm(); });		
	});

	// --- Showing Completed Tasks --- //
	$('.completed-task-toggle').click(function() {
		showing_completed_tasks = !showing_completed_tasks;
		$('.completed-task-toggle').html(function() {
			return showing_completed_tasks ? 'hide completed' : 'show completed';
		});
		$('.task-complete').toggle();
	});

	/* --- Helper Functions --- */
	var failFunction = function(data) {
		console.log(data);
		noty({type: 'warning', text: 'Failed to contact server'});
	};
})();