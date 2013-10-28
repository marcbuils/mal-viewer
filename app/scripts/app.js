'use strict';

angular.module('MALApp', [ 'ui.bootstrap' ]).config(function($routeProvider) {
	$routeProvider.when('/', {
		templateUrl : 'views/main.html',
	}).otherwise({
		redirectTo : '/'
	});
});