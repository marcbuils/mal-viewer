(function(angular) {
	'use strict';

	angular.module('MALApp').controller('NavBar', function ($scope, $serviceAnime) {
		
		$scope.about = function () {
			$serviceAnime.about();
		};
		
		$scope.chgLogin = function() {
			$serviceAnime.chgLogin();
		};
		
		$scope.hist = function() {
			$serviceAnime.hist();
		};
		
		$scope.search = function() {
			$serviceAnime.searchAnime();
		};
		
		$scope.stats = function () {
			$serviceAnime.stats();
		};
		
		$scope.viewList = function(list) {
			$serviceAnime.viewList(list);
		};
	});
}(this.angular));