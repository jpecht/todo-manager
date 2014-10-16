
(function() {
	// initialize angular module
	var app = angular.module('Todo', [])
		.controller('DocsController', function() {
			this.showing = false;
			this.titleText = 'show help';
			
			this.toggle = function() {
				this.showing = !this.showing;
				this.titleText = this.showing ? 'hide help' : 'show help';
			};
		}).controller('StatusController', function() {
			this.buttonsShowing = true;
			this.formShowing = false;
			this.formType = 'login';
			this.showForm = function(type) {
				this.formShowing = true;
				this.formType = type;
			};
			this.hideForm = function() {
				this.formShowing = false;
			};
		});
})();
