(function (angular) {
	'use strict';

	angular.module('MALApp').controller('ListAnimes', function ($scope, $serviceAnime) {
		$scope.serviceAnime = $serviceAnime;
		$scope.login = $serviceAnime.login;
		$scope.password = $serviceAnime.password;
		$scope.max = 10;
		$scope.dAnime = [];
		
		$scope.addAnime = function (id, status) {
			$serviceAnime.addAnime(id, status, $scope);
		};
		
		$scope.applySearch = function () {
			$serviceAnime.applySearch($scope.search, $scope.loadDetails);
		};
		
		$scope.changeAnimeFocus = function (anime) {
			$serviceAnime.changeAnimeFocus(anime);
		};
		
		$scope.closeModal = function (modal) {
			$serviceAnime.closeModal(modal);
		};
		
		$scope.delAnime = function (id) {
			$serviceAnime.delAnime(id);
		};
		
		$scope.editAnime = function (anime, episodes, score, status) {
			$serviceAnime.editAnime(anime, episodes, score, status);
		};
		
		$scope.editDetails = function (anime) {
			$serviceAnime.editDetails(anime);
		};
		
		$scope.formatInt = function (integer) {
			return $serviceAnime.formatInt(integer);
		};
		
		$scope.getDetails = function (anime) {
			$serviceAnime.getDetails(anime);
		};
		
		$scope.getLBadge = function (anime) {
			return $serviceAnime.getLBadge(anime);
		};
		
		$scope.getRBadge = function (anime) {
			return $serviceAnime.getRBadge(anime);
		};
		
		$scope.hoveringOver = function (value) {
			$scope.overStar = value;
		};
		
		$scope.initApp = function () {
			$serviceAnime.initApp($scope);
		};
		
		$scope.openContextMenu = function (anime) {
			$scope.dAnime = anime;
			$serviceAnime.openContextMenu();
		};
		
		$scope.optsAboutModal = {
			keyboard: false,
			backdropClick: false,
			backdropFade : false,
			dialogFade : false,
			dialogClass:'modal aboutModal'
		};
		
		$scope.optsDetailsModal = {
			keyboard: false,
			backdropClick: false,
			backdropFade : false,
			dialogFade : false,
			dialogClass:'modal detailsModal'
		};
		
		$scope.optsEditModal = {
			keyboard: false,
			backdropClick: false,
			backdropFade : false,
			dialogFade : false,
			dialogClass:'modal editModal'
		};
		
		$scope.optsHistoryModal = {
				keyboard: false,
				backdropClick: false,
				backdropFade : false,
				dialogFade : false,
				dialogClass:'modal historyModal'
			};

		$scope.optsLoginModal = {
			keyboard: false,
			backdropClick: false,
			backdropFade : false,
			dialogFade : false,
			dialogClass:'modal loginModal'
		};
		
		$scope.optsSearchModal = {
			keyboard: false,
			backdropClick: false,
			backdropFade : false,
			dialogFade : false,
			dialogClass:'modal searchModal'
		};
		
		$scope.optsStatsModal = {
			keyboard: false,
			backdropClick: false,
			backdropFade : false,
			dialogFade : false,
			dialogClass:'modal statsModal'
		};
		
		$scope.saveLogin = function (login, password) {
			$serviceAnime.saveLogin(login, password);
		};
		
		$scope.viewPrevPage = function () {
			$serviceAnime.viewPrevPage();
		};
		
		$scope.viewNextPage = function () {
			$serviceAnime.viewNextPage();
		};

	}).directive('ngBackimg', function(){
	    return function(scope, element, attrs){
	        attrs.$observe('ngBackimg', function(value) {
	            element.css({
	                'background-image': 'url(' + value + ')'
	            });
	        });
	    };
	}).directive('ngRepeatdone', function () {
		return function (scope, element, attrs) {
			if (scope.$last) { // all are rendered
				scope.$eval(attrs.ngRepeatdone);
			}
		};
	}).directive('ngRclick', function($serviceAnime) {
	    return function(scope, element, attrs) {
	        if (element.context.className === 'thumbnail') {
		        element.bind('contextmenu', function(event) {
					scope.$eval(attrs.ngRclick);
					$serviceAnime.safeApply();

					$(event.target).parents('.thumbnail').css('background-color', 'rgb(91,91,91)');
					
					if ($('#contextMenu .dropdown-submenu').hasClass('pull-left')) {
						$('#contextMenu .dropdown-submenu').removeClass('pull-left');
					}
					
					if (($(window).width() - event.clientX) < ($('#contextMenu').width() * 2)) {
						$('#contextMenu .dropdown-submenu').addClass('pull-left');
					}

					$('#contextMenu').css({
			            position: "fixed",
			            display: "block",
			            left: (($(window).width() - event.clientX) > $('#contextMenu').width()) ? (event.clientX + 'px') : (($(window).width() - $('#contextMenu').width()) + 'px'),
			            top:  (($(window).height() - event.clientY) > ($('#contextMenu').height() + $('.navbar-fixed-bottom').height() + 13)) ? (event.clientY + 'px') : (($(window).height() - $('#contextMenu').height() - $('.navbar-fixed-bottom').height() - 13) + 'px')
					});
					
					if ($('#contextMenu').css('top') + $('#contextMenu').height() + $('#contextMenu .dropdown-submenu').height())
					
					$serviceAnime.disableBodyScrolling();
		        });
	        }
	    };
	}).directive('ngCompile', function($compile) {
		return function(scope, element, attrs) {
			scope.$watch(
				function (scope) {
					return scope.$eval(attrs.ngCompile);
				},
				function(value) {
					element.html(value);
					$compile(element.contents())(scope);
				}
			);
		};
	});
	
}(this.angular));