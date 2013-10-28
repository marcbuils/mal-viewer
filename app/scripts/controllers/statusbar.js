/*global $:false */

(function(angular) {
	'use strict';

	angular.module('MALApp').controller('StatusBar', function($scope, $serviceAnime) {
		$scope.serviceAnime = $serviceAnime;
		
		$('#h-slider').change(function(){
			$serviceAnime.updateSize(this.value);
		});
		
		$scope.changeOrderBy = function (orderBy) {
			$serviceAnime.changeOrderBy(orderBy);
		};
		
		$scope.changeOrderReverse = function (orderReverse) {
			$serviceAnime.changeOrderReverse(orderReverse);
		};
	});
}(this.angular));