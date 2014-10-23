
(function() {
	// initialize angular module
	var app = angular.module('Todo', [])
		.controller('DocsController', function() {
			this.showing = false;
			this.titleText = 'show help';
			
			this.toggle = function() {
				this.showing = !this.showing;
				this.titleText = this.showing ? 'hide help' : 'show help';
				
				// TODO scroll down when showing help
				// doesnt work right now because of delay for angular to show '.docs-text'
				var currScrollTop = $(document.body).scrollTop();
				console.log(currScrollTop);
				console.log($('.docs-text').height());
				if (this.showing) $(document.body).scrollTop(currScrollTop + $('.docs-text').height());
				console.log($(document.body).scrollTop());
			};
		}).controller('StatusController', function() {
			this.buttonsShowing = true;
			this.formShowing = false;
			this.formType = 'login';
			this.showForm = function(type) {
				this.formShowing = true;
				if (type) this.formType = type;
				$('.shield').show();
			};
			this.hideForm = function() {
				this.formShowing = false;
				$('.shield').hide();
			};
			this.logout = function() {				
				window.location = 'php/logout.php';
			};

			/* --- Check if user is verifying account --- */
			if (window.location.search.substr(0, 7) === '?token=') {
				this.showForm();
				noty({type: 'success', timeout: 3000, text: 'Log in to complete verification!'});
			}
		}).controller('TaskController', function() {
			this.completeTask = function() {
				
			};
		});
})();
