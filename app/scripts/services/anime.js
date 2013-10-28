/* jslint white: false */
/* global $: false */
/* global _: false */
/* node: true */
/* camelcase: true */

(function (angular) {
	'use strict';
	
	angular.module('MALApp').service('$serviceAnime', function ($rootScope, $dialog, $filter, $compile) {
		return {
			animes: [],
			watching: localStorage['watching'] ? JSON.parse(localStorage['watching']) : [],
			completed: localStorage['completed'] ? JSON.parse(localStorage['completed']) : [],
			onhold: localStorage['on-hold'] ? JSON.parse(localStorage['on-hold']) : [],
			dropped: localStorage['dropped'] ? JSON.parse(localStorage['dropped']) : [],
			plantowatch: localStorage['plan to watch'] ? JSON.parse(localStorage['plan to watch']) : [],
			search: [],
			login: localStorage.login,
			password: localStorage.password,
			imagesWidth: 224,
			imagesHeight: 336,
			viewAboutModal: false,
			viewLoginModal: false,
			viewSearchModal: false,
			viewEditModal: false,
			viewDetailsModal: false,
			viewHistoryModal: false,
			viewStatsModal: false,
			viewAddButton: false,
			viewEditButtons: false,
			viewLBadge: false,
			loadStatus: '',
			loginStatus: '',
			searchStatus: '',
			watchingList: '',
			orderBy: 'title',
			orderReverse: false,
			page: 1,
			scope: [],
			history: [],
			statistics: {},
			
			about: function () {
				this.openModal('about');
			},
			
			addAnime: function (id, status) {				
				var self = this;
				
				$.xhrPool.abortAll();
				
				self.loadStatus = 'Anime adding...';
				self.viewLoadStatus();

				$.ajax({
					type: 'POST',
					url: 'http://mal-api.com/animelist/anime',
					dataType: 'text',
					data: { anime_id: id, status: status },
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Authorization', 'Basic ' + btoa(self.login + ':' + self.password));
					}
				}).done(function () {
					self.scope.dAnime.watched_status = status;
					self.animes[self.checkAnime(self.animes, id)].watched_status = status;
					
					if (self.viewDetailsModal) {
						self.viewAddButton = false;
						self.viewEditButtons = true;
					}
					
					self.safeApply();
					
					self.updateLoadBar(1, 1);
					
					setTimeout(function () {
						self.hideLoadStatus();
					}, 100);
				}).fail(function (error) {
					self.showError(error.status, error.statusText);
				});
			},
			
			applySearch: function (search, loadDetails) {
				var self = this;
				
				$.xhrPool.abortAll();
				self.searchStatus = 'Searching...';
				
				$.ajax({
					dataType : 'json',
					url: 'http://mal-api.com/anime/search?q=' + encodeURIComponent(search),
					
				}).done(function (data) {

					if (data.length === 0) {
						self.searchStatus = 'No result :(';
						self.safeApply();
					}
					
					else {
						self.search = [];
						
						var nbAnimesToLoad = data.length;
						var nbAnimesLoaded = 0;
					
						_.each(data, function (anime) {
							anime.image_url = anime.image_url.substring(0,anime.image_url.length - 5) + '.jpg';
							self.pushAnime(self.search, anime);
						}, self);
							
						self.closeModal('search');
						self.viewList('search');
						self.loadStatus = 'Animes details loading...';
						self.viewLoadStatus();
						self.updateWatchedData();
						self.safeApply();
							
						_.each(data, function (anime) {
							
							$.ajax({
								dataType : 'json',
								url: 'http://mal-api.com/anime/' + parseInt(anime.id)
							}).done(function (data) {									
								self.pushAnime(self.animes, data);
								
								nbAnimesLoaded++;
								self.updateLoadBar(nbAnimesLoaded, nbAnimesToLoad);
								
								if (nbAnimesLoaded >= nbAnimesToLoad) {									
									setTimeout(function () {
										self.hideLoadStatus();
										self.safeApply();
									}, 500);
								}
		
							}).fail(function (error) {
								if (error.statusText !== 'abort') {
									self.showError(error.status, error.statusText);
								}
							});
						}, self);
					}
				});
			},
			
			changeAnimeFocus: function (anime) {
				this.scope.dAnime = anime;
				
				if (anime.watched_status !== '-') {
					this.viewAddButton = false;
					this.viewEditButtons = true;
				} else {
					this.viewAddButton = true;
					this.viewEditButtons = false;
				}
			},
			
			changeOrderBy: function (orderBy) {
				this.orderBy = orderBy;
				
				$('#orderBy').show();
				
				switch (orderBy) {
				case 'end_date':
					$('#orderByButton').text('End date');
					this.changeOrderReverse(true);
					break;
				case 'members_score':
					$('#orderByButton').text('Members score');
					this.changeOrderReverse(true);
					break;
				case 'none':
					$('#orderBy').hide();
					this.orderBy = null;
					break;
				case 'popularity_rank':
					$('#orderByButton').text('Popularity');
					this.changeOrderReverse(false);
					break;
				case 'rank':
					$('#orderByButton').text('Rank');
					this.changeOrderReverse(false);
					break;
				case 'score':
					$('#orderByButton').text('Score');
					this.changeOrderReverse(true);
					break;
				case 'start_date':
					$('#orderByButton').text('Start date');
					this.changeOrderReverse(true);
					break;
				case 'title':
					$('#orderByButton').text('Title');
					this.changeOrderReverse(false);
					break;
				case 'type':
					$('#orderByButton').text('Type');
					this.changeOrderReverse(false);
					break;
				}
			},
			
			changeOrderReverse: function (orderReverse) {
				this.orderReverse = orderReverse;

				if (orderReverse === true) {
					$('#orderReverseButton').text('Desc');
				} else {
					$('#orderReverseButton').text('Asc');
				}
				
				this.safeApply();
			},
			
			checkAnime: function (list, id) {
			    for (var i = 0; i < list.length; i++) {
					if (list[i]['id'] === id) {
						return i;
					}
			    }
			    return -1;
			},
			
			chgLogin: function () {
				this.loginStatus = '';
				this.openModal('login');
			},
			
			closeModal: function (modal) {
				switch (modal) {
				case 'about':
					this.viewAboutModal = false;
				break;
				case 'details':
					if (!this.viewEditModal) {
						this.viewDetailsModal = false;
					}
				break;
				case 'edit':
					this.viewEditModal = false;
				break;
				case 'history':
					this.viewHistoryModal = false;
				break;
				case 'login':
					this.viewLoginModal = false;
				break;
				case 'search':
					this.viewSearchModal = false;
				break;
				case 'stats':
					this.viewStatsModal = false;
				break;
				}

				this.enableBodyScrolling();
			},
			
			delAnime: function (id) {
			    var self = this;
			    
				var title = 'Are you sure ?';
				var msg = 'All data of this anime will be lost !';
			    var btns = [{result:false, label: 'Cancel'}, {result:true, label: 'OK'}];

			    $dialog.messageBox(title, msg, btns).open().then(function (result) {
			        if (result) {
			        	if ((self.watchingList.match(/(watching|completed|on-hold|dropped|plan to watch)/)) && (self.viewDetailsModal)) {
			        		self.closeModal('details');
			        	}
			        	
			        	$.xhrPool.abortAll();
			        	
						self.loadStatus = 'Anime deleting...';
						self.viewLoadStatus();
						
			        	$.ajax({
							type: 'DELETE',
							url: 'http://mal-api.com/animelist/anime/' + id,
							beforeSend: function (xhr) {
								xhr.setRequestHeader('Authorization', 'Basic ' + btoa(self.login + ':' + self.password));
							},
						}).done(function () {
				        	if (self.watchingList.match(/(watching|completed|on-hold|dropped|plan to watch)/)) {
								self.viewList(self.watchingList);
				        	} else {
				        		self.scope.dAnime.score = 0;
				        		self.scope.dAnime.watched_episodes = '-';
				        		self.scope.dAnime.watched_status = '-';
				        		
				        		var key = self.checkAnime(self.animes, id);
				        		
				        		self.animes[key].score = 0;
				        		self.animes[key].watched_episodes = '-';
								self.animes[key].watched_status = '-';

				        		if (self.viewDetailsModal) {
									self.viewAddButton = true;
									self.viewEditButtons = false;
				        		}
				        		
								self.safeApply();
								
								self.updateLoadBar(1, 1);
								
								setTimeout(function () {
									self.hideLoadStatus();
								}, 100);
				        	}
						}).fail(function (error) {
							self.showError(error.status, error.statusText);
						});
			        }
			    });
			},
			
			
			disableBodyScrolling: function () {
				$('body').css('overflow', 'hidden');
			},
			
			editAnime: function (anime, episodes, score, status) {
				var self = this;
				
				$.xhrPool.abortAll();

				if (!episodes) {
					episodes = anime.watched_episodes;
				}
				
				if (!score) {
					score = anime.score;
				}
				
				if (!status) {
					status = anime.watched_status;
				}
				
				$.ajax({
					type: 'PUT',
					url: 'http://mal-api.com/animelist/anime/' + anime.id,
					dataType: 'text',
					data: { episodes: episodes, score: score, status: status },
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Authorization', 'Basic ' + btoa(self.login + ':' + self.password));
					}
				}).done(function () {
					anime.watched_episodes = parseInt(episodes);
					anime.score = parseInt(score);
					anime.watched_status = status;
					self.safeApply();

					if (self.watchingList.match(/(watching|completed|on-hold|dropped|plan to watch)/)) {
						if ((anime.watched_status) && (anime.watched_status !== status)) {
							self.viewList(self.watchingList);
						} else {
							localStorage[self.watchingList] = JSON.stringify(self.animes);
						}
					}
				}).fail(function (error) {
					self.showError(error.status, error.statusText);
				});
			},
			
			editDetails: function (anime) {
				this.scope.watched_status = anime.watched_status;
				this.scope.watched_episodes = anime.watched_episodes;
				this.scope.score = anime.score;
					
				this.openModal('edit');
			},
			
			enableBodyScrolling: function () {
				$('body').css('overflow', 'auto');
			},
			
			formatInt: function (integer) {
				return (integer > 0) ? integer : '-';
			},
			
			getDetails: function (anime) {
				this.changeAnimeFocus(anime);

				this.openModal('details');
			},
			
			getLBadge: function (anime) {
				var res, watchingList = this.watchingList;
								
				if (watchingList.substr(0,3) === 'top') {
					watchingList = 'top';
				}

				switch (watchingList) {
				case 'watching':
					res = this.formatInt(anime.watched_episodes) + ' / ' + this.formatInt(anime.episodes) + ' <i class="icon-plus incEpisode" ng-click="editAnime(anime, anime.watched_episodes + 1)"></i>';
					break;
					
				case 'on-hold':
					res = this.formatInt(anime.watched_episodes) + ' / ' + this.formatInt(anime.episodes);
					break;
					
				case 'dropped':
					res = this.formatInt(anime.watched_episodes) + ' / ' + this.formatInt(anime.episodes);
					break;

				case 'popular':
					res = anime.popularity_rank;
					break;
				
				case 'top':
					res = anime.rank;
					break;
					
				case 'search':
					res = anime.type;
					break;
				}
				
				return res;
			},
			
			getRBadge: function (anime) {
				var res, watchingList = this.watchingList;
								
				if (watchingList.substr(0,3) === 'top') {
					watchingList = 'top';
				}
				
				var score = this.formatInt(anime.score), members_score = this.formatInt(anime.members_score);
				
				switch (watchingList) {
				case 'popular':
					res =  members_score;
					break;
					
				case 'top':
					res = members_score;
					break;

				default:
					switch (this.orderBy) {
					case 'end_date':
						res = $filter('date')(anime.end_date, 'MMM d, y');
						break;
					case 'members_score':
						res = members_score;
						break;
					case 'popularity_rank':
						res = anime.popularity_rank;
						break;
					case 'rank':
						res = anime.rank;
						break;
					case 'start_date':
						res = $filter('date')(anime.start_date, 'MMM d, y');
						break;
					case 'type':
						res = anime.type;
						break;
					default:
						res =  ((watchingList === 'plan to watch') || (watchingList === 'search')) ? members_score : score;
						break;
					}
					break;
				}
				
				return res;
			},
			
			getWeek: function (d) {
			    d = new Date(d);
			    d.setHours(0,0,0);
			    d.setDate(d.getDate() + 4 - (d.getDay()||7));
			    var yearStart = new Date(d.getFullYear(),0,1);
			    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
			    return weekNo;
			},
			
			hideLoadStatus: function () {
				$('.loadStatus').addClass('invisible');
				this.updateLoadBar(0, 1);
			},
			
			hist: function () {
				var self = this, time = new Date().getTime(), week = this.getWeek(time);
				
				self.history = [];
				
				$.xhrPool.abortAll();
				
				self.loadStatus = 'History loading...';
				self.viewLoadStatus();
				
				$.ajax({
					dataType : 'json',
					url: 'http://mal-api.com/history/' + self.login + '/anime?nocache=' + time
				})
				.done(function (data) {
					var i = -1, oldDate, oldWeek;
					
					_.each(data, function (anime) {
						var hDate = new Date (anime.time.toString()).getTime(), hTime, hWeek;
						
						if (((time - hDate) / 3600000) < 13) {
							if (((time - hDate) / 1000) < 60) {
								hTime = ((time - hDate) / 1000).toFixed(0);
								hTime += (hDate > 1) ? ' seconds ago' : ' second ago';
							} else if (((time - hDate) / 60000) < 60) {
								hTime = ((time - hDate) / 60000).toFixed(0);
								hTime += (hDate > 1) ? ' minutes ago' : ' minute ago';
							} else {
								hTime = ((time - hDate) / 3600000).toFixed(0);
								hTime += (hDate > 1) ? ' hours ago' : ' hour ago';
							}
						} else {
							hDate += 25200000; // /!\ Strange offset /!\
							hTime = $filter('date')(hDate, 'MMM d, y') + ' &nbsp; ' + $filter('date')(hDate, 'hh:mm a');
						}
						
						hWeek = this.getWeek(hDate);
						
						if (hWeek === week) {
							hDate = new Date(hDate).toDateString();
							
							if (new Date (hDate).toDateString() === new Date (time).toDateString()) {
								hDate = 'Today';
							} else if (new Date (hDate).toDateString() === new Date (time - 86400000).toDateString()) {
								hDate = 'Yesterday';
							} else {
								hDate = $filter('date')(new Date (hDate), 'EEEE');
							}
							
							if (oldDate !== hDate) {
								i++;
							}
							
							oldDate = hDate;
						} else {
							if (Math.abs(week - hWeek) === 1) {
								hDate = 'Last week';
							} else {
								var n = (week > hWeek) ? (week - hWeek) : ((52 - hWeek) + week);
								var numbers = ['Two', 'Three', 'Four', 'Five'];
								
								hDate = numbers[n-2] + ' weeks ago';
							}
							
							if (hWeek !== oldWeek) {
								i++;
							}
							
							oldWeek = hWeek;
						}
						
						if (!self.history[i]) {
							self.history[i] = [];
						}
						
						self.history[i].push({
							date: hDate,
							time: hTime,
							title: anime.title.toString(),
							episode: parseInt(anime.episode)
						});
					}, self);
					
					self.updateLoadBar(1, 1);
					
					setTimeout(function () {
						self.hideLoadStatus();
						setTimeout(function () {
							self.openModal('history');
							self.safeApply();
						}, 50);
					}, 100);
				}).fail(function (error) {
					if (error.statusText !== 'abort') {
						self.showError(error.status);
					}
				});
			},
			
			initApp: function (scope) {
				this.scope = scope;
				var self = this;
				
				$('#contextMenu .dropdown-submenu').on('mouseover', function (event) {
					if ($('#contextMenu .dropdown-submenu .dropdown-menu').has(event.target).length === 0) {
						if ($('#contextMenu').hasClass('dropup')) {
							$('#contextMenu').removeClass('dropup');
						}
						
						if (($(window).height() - $(this).children('.dropdown-menu').offset().top - $('.navbar-fixed-bottom').height() - 13) < $(this).children('.dropdown-menu').height()) {
							$('#contextMenu').addClass('dropup');
						}
					}
				});
				
				$(document).bind('contextmenu', function (event) {
					event.preventDefault();
					
					if (!self.viewLoginModal && !self.viewSearchModal && !self.viewDetailsModal && !$('.dropdown-menu').parent().hasClass('open')) {
						$('.thumbnail').css('background-color', '#272b30');
						
						if ($('.thumbnails li').has(event.target).length > 0) {
							$(event.target).parents('.thumbnail').css('background-color', 'rgb(91,91,91)');
					    }
						
						if ((!($('.thumbnails li').has(event.target).length > 0)) && ($('#contextMenu').css('display') === 'block')) {
							$('#contextMenu').css('display', 'none');
							self.enableBodyScrolling();
						}
					}
				});
				
				$(document).click(function (event) {
					if (!self.viewLoginModal && !self.viewSearchModal && !self.viewDetailsModal && !$('.dropdown-menu').parent().hasClass('open')) {
						if (event.target.className.indexOf('incEpisode') === -1) {
							$('.thumbnail').css('background-color', '#272b30');
							
							if ($('.thumbnails li').has(event.target).length > 0) {
								$(event.target).parents('.thumbnail').css('background-color', 'rgb(91,91,91)');
						    }
						}
						
						if ($('#contextMenu').css('display') === 'block') {
							$('#contextMenu').css('display', 'none');
							self.enableBodyScrolling();
						}
					}
				});
				
				if (navigator.platform.substr(0,3) === 'Win') {
					$('head').append($(document.createElement('link')).attr({rel:'stylesheet', type:'text/css', href:'styles/scrollbar.css'}));
				}
				
				$.xhrPool = [];
				$.xhrPool.abortAll = function () {
				    $(this).each(function (idx, jqXHR) { 
				        jqXHR.abort();
				    });
				    $.xhrPool.length = 0;
				};

				$.ajaxSetup({
				    beforeSend: function (jqXHR) {
				        $.xhrPool.push(jqXHR);
				    },
				    complete: function (jqXHR) {
				        var index = $.xhrPool.indexOf(jqXHR);
				        if (index > -1) {
				            $.xhrPool.splice(index, 1);
				        }
				    }
				});
				
				if (this.login) {
					this.viewList('watching');
				} else {
					this.chgLogin();
				}
			},

			objectToString: function (obj) {
				var res = '';
				
				for (var key in obj)
					res += obj[key].toString() + ',';
				
				res = res.substr(0, res.length - 1).replace(/,/gi, ', ');
				
				return res ? res : '-';
			},
			
			openModal: function (modal) {
				switch (modal) {
				case 'about':
					this.viewAboutModal = true;
				break;
				case 'details':
					this.viewDetailsModal = true;
				break;
				case 'edit':
					this.viewEditModal = true;
				break;
				case 'history':
					this.viewHistoryModal = true;
				break;
				case 'login':
					this.viewLoginModal = true;
				break;
				case 'search':
					this.viewSearchModal = true;
				break;
				case 'stats':
					this.viewStatsModal = true;
				break;
				}

				this.disableBodyScrolling();
			},
			
			pushAnime: function (list, aData, lData) {
				var id = parseInt(aData.id), checkRes = this.checkAnime(list, id);
				
				var details = {					
					//aData
					id: id,
					title: aData.title.toString(),
					other_titles: this.objectToString(aData.other_titles),
					synopsis: aData.synopsis ? aData.synopsis.toString() : '-',
					type: aData.type ? aData.type.toString() : '-',
					rank: aData.rank ? parseInt(aData.rank) : 0,
					popularity_rank: aData.popularity_rank ? parseInt(aData.popularity_rank) : 0,
					image_url: aData.image_url.toString(),
					episodes: parseInt(aData.episodes) ? parseInt(aData.episodes) : 0,
					status: aData.status ? aData.status.toString().charAt(0).toUpperCase() + aData.status.toString().substring(1) : '-',
					start_date: aData.start_date ? new Date (aData.start_date.toString()) : '-',
					end_date: aData.end_date ? new Date (aData.end_date.toString()) : '-',
					genres: this.objectToString(aData.genres),
					tags: this.objectToString(aData.tags),
					classification: aData.classification ? aData.classification.toString() : '-',
					members_score: aData.members_score ? parseFloat(aData.members_score) : 0,
					
					//lData
					score: lData ? parseInt(lData.score) : 0,
					watched_episodes: (lData && parseInt(lData.watched_episodes)) ? parseInt(lData.watched_episodes) : 0,
					watched_status: lData ? lData.watched_status.toString() : '-'
				};

				if (checkRes === -1) {
					list.push(details);
				} else if (!angular.equals($filter('json')(list[checkRes]), $filter('json')(details))) {
					list.splice(checkRes, 1, details);
				}
				
				if ((this.viewDetailsModal) && (this.scope.dAnime.id === id)) {
					this.scope.dAnime = details;
				}
				
				this.safeApply();
			},
			
			safeApply: function () {
				var phase = $rootScope.$$phase;
				
		        if ((phase !== '$apply') && (phase !== '$digest')) {
		        	$rootScope.$apply();
		        }
			},
			
			saveLogin: function (login, password) {
				var self = this;
				
				self.loginStatus = '';
				self.safeApply();
				
				if ($(location).attr('href').substr(7, 9) !== 'localhost') {
		             $.ajax({
		            	 url: 'scripts/verify_credentials.php',
						 type: 'POST',
						 data: 'login=' + login + '&password=' + password
		             }).done(function (data) {
		            	 if (data === 'Invalid credentials') {
		            		 self.loginStatus = '<i class="icon-warning-sign"></i> Invalid credentials !';
		            		 self.safeApply();
		            	 } else {
		     				self.login = login;
		    				self.password = password;
		    				localStorage.login = login;
		    				localStorage.password = password; 
		    				
		    				self.closeModal('login');
		    				self.viewList('watching');
		            	 }
		             }).fail(function (error) {
						self.showError(error.status, error.statusText);
					});
				} else {
					alert('Localhost exception');
					
					self.login = login;
    				self.password = password;
    				localStorage.login = login;
    				localStorage.password = password; 
    				
    				self.closeModal('login');
    				self.viewList('watching');
				}
			},
			
			searchAnime: function () {
				this.searchStatus = '';
				this.openModal('search');
			},
			
			showError: function (status, statusText) {
				
				if (status === 0) {
					statusText = 'The server may be unavailable, please try again later.';
				}
				
			    $dialog.messageBox('Error ' + status, statusText, [{label: 'OK'}]).open();
			    this.safeApply();
			},
			
			stats: function () {
				var self = this, total_general_scored = 0, total_general_members_scored = 0, total_scored = 0, total_members_scored = 0;
				
				// To avoid problemes during lists updating
				var watching = localStorage['watching'] ? JSON.parse(localStorage['watching']) : [];
				var completed = localStorage['completed'] ? JSON.parse(localStorage['completed']) : [];
				var onhold = localStorage['on-hold'] ? JSON.parse(localStorage['on-hold']) : [];
				var dropped = localStorage['dropped'] ? JSON.parse(localStorage['dropped']) : [];
				var plantowatch = localStorage['plan to watch'] ? JSON.parse(localStorage['plan to watch']) : [];
				
				self.statistics = {
					general: { movies: 0, ova: 0, specials: 0, tv: 0, total: 0, total_scored: 0, total_members_scored: 0, episodes: 0, watched: 0, mean_score: 0, members: 0, mean_gap: 0, kindProgress: [], episodesProgress: [], scoreProgress: [] },
					'watching': { movies: 0, ova: 0, specials: 0, tv: 0, total: 0, total_scored: 0, total_members_scored: 0, episodes: 0, watched: 0, mean_score: 0, members: 0, mean_gap: 0, kindProgress: [], episodesProgress: [], scoreProgress: [] },
					'completed': { movies: 0, ova: 0, specials: 0, tv: 0, total: 0, total_scored: 0, total_members_scored: 0, episodes: 0, watched: 0, mean_score: 0, members: 0, mean_gap: 0, kindProgress: [], episodesProgress: [], scoreProgress: [] },
					'on-hold': { movies: 0, ova: 0, specials: 0, tv: 0, total: 0, total_scored: 0, total_members_scored: 0, episodes: 0, watched: 0, mean_score: 0, members: 0, mean_gap: 0, kindProgress: [], episodesProgress: [], scoreProgress: [] },
					'dropped': { movies: 0, ova: 0, specials: 0, tv: 0, total: 0, total_scored: 0, total_members_scored: 0, episodes: 0, watched: 0, mean_score: 0, members: 0, mean_gap: 0, kindProgress: [], episodesProgress: [], scoreProgress: [] },
					'plan to watch': { movies: 0, ova: 0, specials: 0, tv: 0, total: 0, total_scored: 0, total_members_scored: 0, episodes: 0, watched: 0, mean_score: 0, members: 0, mean_gap: 0, kindProgress: [], episodesProgress: [], scoreProgress: [] },
				};
				
				_.each(_.union(watching, completed, onhold, dropped, plantowatch), function (anime) {
					switch (anime.type) {
					case 'Movie':
						self.statistics[anime.watched_status].movies++;
						self.statistics.general.movies++;
						break;
					case 'OVA':
						self.statistics[anime.watched_status].ova++;
						self.statistics.general.ova++;
						break;
					case 'Special':
						self.statistics[anime.watched_status].specials++;
						self.statistics.general.specials++;
						break;
					case 'TV':
						self.statistics[anime.watched_status].tv++;
						self.statistics.general.tv++;
						break;
					}
					
					self.statistics[anime.watched_status].total++;
					self.statistics.general.total++;
					
					self.statistics[anime.watched_status].episodes += anime.episodes;
					self.statistics.general.episodes += anime.episodes;
					
					if ((anime.episodes === 0) && (anime.watched_episodes > 0)) {
						self.statistics[anime.watched_status].episodes += anime.watched_episodes;
						self.statistics.general.episodes += anime.watched_episodes;
					}
					
					self.statistics[anime.watched_status].watched += anime.watched_episodes;
					
					self.statistics.general.watched += anime.watched_episodes;
						
					if (anime.score > 0) {
						self.statistics[anime.watched_status].mean_score += anime.score;
						self.statistics[anime.watched_status].total_scored++;
						
						self.statistics.general.mean_score += anime.score;
						self.statistics.general.total_scored++;
					}
					
					if (anime.members_score > 0) {
						self.statistics[anime.watched_status].members += anime.members_score;
						self.statistics[anime.watched_status].total_members_scored++;
						
						self.statistics.general.members += anime.members_score;
						self.statistics.general.total_members_scored++;
						
						if (anime.score > 0) {
							self.statistics[anime.watched_status].mean_gap += anime.members_score;
							self.statistics.general.mean_gap += anime.members_score;
						}
					}
				}, self);
				
				// General
				self.statistics.general.mean_score = (self.statistics.general.mean_score / self.statistics.general.total_scored).toFixed(2);
				self.statistics.general.members = (self.statistics.general.members / self.statistics.general.total_members_scored).toFixed(2);
				self.statistics.general.mean_gap = (self.statistics.general.mean_score - (self.statistics.general.mean_gap / self.statistics.general.total_scored)).toFixed(2);
				if (self.statistics.general.mean_gap > 0) {
					self.statistics.general.mean_gap = '+' + self.statistics.general.mean_gap;
				}
				self.statistics.general.kindProgress = [{ value: (self.statistics.general.movies / self.statistics.general.total * 100), type: 'success'}, { value: (self.statistics.general.ova / self.statistics.general.total * 100), type: 'warning'}, { value: (self.statistics.general.specials / self.statistics.general.total * 100), type: 'danger'}, { value: (self.statistics.general.tv / self.statistics.general.total * 100), type: 'info'}];
				self.statistics.general.episodesProgress = [{ value: (self.statistics.general.watched / self.statistics.general.episodes * 100), type: 'success'}];
				if (self.statistics.general.mean_score > self.statistics.general.members) {
					self.statistics.general.scoreProgress = [{ value: (self.statistics.general.members * 10), type: 'success'}, { value: ((self.statistics.general.mean_score - self.statistics.general.members) * 10), type: 'info'}];
				} else {
					self.statistics.general.scoreProgress = [{ value: (self.statistics.general.mean_score * 10), type: 'success'}, { value: ((self.statistics.general.members - self.statistics.general.mean_score) * 10), type: 'info'}];
				}
				
				
				// Watching
				self.statistics.watching.mean_score = (self.statistics.watching.mean_score / self.statistics.watching.total_scored).toFixed(2);
				self.statistics.watching.members = (self.statistics.watching.members / self.statistics.watching.total_members_scored).toFixed(2);
				self.statistics.watching.mean_gap = (self.statistics.watching.mean_score - (self.statistics.watching.mean_gap / self.statistics.watching.total_scored)).toFixed(2);
				if (self.statistics.watching.mean_gap > 0) {
					self.statistics.watching.mean_gap = '+' + self.statistics.watching.mean_gap;
				}
				self.statistics.watching.kindProgress = [{ value: (self.statistics.watching.movies / self.statistics.watching.total * 100), type: 'success'}, { value: (self.statistics.watching.ova / self.statistics.watching.total * 100), type: 'warning'}, { value: (self.statistics.watching.specials / self.statistics.watching.total * 100), type: 'danger'}, { value: (self.statistics.watching.tv / self.statistics.watching.total * 100), type: 'info'}];
				self.statistics.watching.episodesProgress = [{ value: (self.statistics.watching.watched / self.statistics.watching.episodes * 100), type: 'success'}];
				if (self.statistics.watching.mean_score > self.statistics.watching.members) {
					self.statistics.watching.scoreProgress = [{ value: (self.statistics.watching.members * 10), type: 'success'}, { value: ((self.statistics.watching.mean_score - self.statistics.watching.members) * 10), type: 'info'}];
				} else {
					self.statistics.watching.scoreProgress = [{ value: (self.statistics.watching.mean_score * 10), type: 'success'}, { value: ((self.statistics.watching.members - self.statistics.watching.mean_score) * 10), type: 'info'}];
				}
				
				// Completed
				self.statistics.completed.mean_score = (self.statistics.completed.mean_score / self.statistics.completed.total_scored).toFixed(2);
				self.statistics.completed.members = (self.statistics.completed.members / self.statistics.completed.total_members_scored).toFixed(2);
				self.statistics.completed.mean_gap = (self.statistics.completed.mean_score - (self.statistics.completed.mean_gap / self.statistics.completed.total_scored)).toFixed(2);
				if (self.statistics.completed.mean_gap > 0) {
					self.statistics.completed.mean_gap = '+' + self.statistics.completed.mean_gap;
				}
				self.statistics.completed.kindProgress = [{ value: (self.statistics.completed.movies / self.statistics.completed.total * 100), type: 'success'}, { value: (self.statistics.completed.ova / self.statistics.completed.total * 100), type: 'warning'}, { value: (self.statistics.completed.specials / self.statistics.completed.total * 100), type: 'danger'}, { value: (self.statistics.completed.tv / self.statistics.completed.total * 100), type: 'info'}];
				self.statistics.completed.episodesProgress = [{ value: (self.statistics.completed.watched / self.statistics.completed.episodes * 100), type: 'success'}];
				if (self.statistics.completed.mean_score > self.statistics.completed.members) {
					self.statistics.completed.scoreProgress = [{ value: (self.statistics.completed.members * 10), type: 'success'}, { value: ((self.statistics.completed.mean_score - self.statistics.completed.members) * 10), type: 'info'}];
				} else {
					self.statistics.completed.scoreProgress = [{ value: (self.statistics.completed.mean_score * 10), type: 'success'}, { value: ((self.statistics.completed.members - self.statistics.completed.mean_score) * 10), type: 'info'}];
				}
				
				// On-hold
				self.statistics['on-hold'].mean_score = (self.statistics['on-hold'].mean_score / self.statistics['on-hold'].total_scored).toFixed(2);
				self.statistics['on-hold'].members = (self.statistics['on-hold'].members / self.statistics['on-hold'].total_members_scored).toFixed(2);
				self.statistics['on-hold'].mean_gap = (self.statistics['on-hold'].mean_score - (self.statistics['on-hold'].mean_gap / self.statistics['on-hold'].total_scored)).toFixed(2);
				if (self.statistics['on-hold'].mean_gap > 0) {
					self.statistics['on-hold'].mean_gap = '+' + self.statistics['on-hold'].mean_gap;
				}
				self.statistics['on-hold'].kindProgress = [{ value: (self.statistics['on-hold'].movies / self.statistics['on-hold'].total * 100), type: 'success'}, { value: (self.statistics['on-hold'].ova / self.statistics['on-hold'].total * 100), type: 'warning'}, { value: (self.statistics['on-hold'].specials / self.statistics['on-hold'].total * 100), type: 'danger'}, { value: (self.statistics['on-hold'].tv / self.statistics['on-hold'].total * 100), type: 'info'}];
				self.statistics['on-hold'].episodesProgress = [{ value: (self.statistics['on-hold'].watched / self.statistics['on-hold'].episodes * 100), type: 'success'}];
				if (self.statistics['on-hold'].mean_score > self.statistics['on-hold'].members) {
					self.statistics['on-hold'].scoreProgress = [{ value: (self.statistics['on-hold'].members * 10), type: 'success'}, { value: ((self.statistics['on-hold'].mean_score - self.statistics['on-hold'].members) * 10), type: 'info'}];
				} else {
					self.statistics['on-hold'].scoreProgress = [{ value: (self.statistics['on-hold'].mean_score * 10), type: 'success'}, { value: ((self.statistics['on-hold'].members - self.statistics['on-hold'].mean_score) * 10), type: 'info'}];
				}
				
				// Dropped
				self.statistics.dropped.mean_score = (self.statistics.dropped.mean_score / self.statistics.dropped.total_scored).toFixed(2);
				self.statistics.dropped.members = (self.statistics.dropped.members / self.statistics.dropped.total_members_scored).toFixed(2);
				self.statistics.dropped.mean_gap = (self.statistics.dropped.mean_score - (self.statistics.dropped.mean_gap / self.statistics.dropped.total_scored)).toFixed(2);
				if (self.statistics.dropped.mean_gap > 0) {
					self.statistics.dropped.mean_gap = '+' + self.statistics.dropped.mean_gap;
				}
				self.statistics.dropped.kindProgress = [{ value: (self.statistics.dropped.movies / self.statistics.dropped.total * 100), type: 'success'}, { value: (self.statistics.dropped.ova / self.statistics.dropped.total * 100), type: 'warning'}, { value: (self.statistics.dropped.specials / self.statistics.dropped.total * 100), type: 'danger'}, { value: (self.statistics.dropped.tv / self.statistics.dropped.total * 100), type: 'info'}];
				self.statistics.dropped.episodesProgress = [{ value: (self.statistics.dropped.watched / self.statistics.dropped.episodes * 100), type: 'success'}];
				if (self.statistics.dropped.mean_score > self.statistics.dropped.members) {
					self.statistics.dropped.scoreProgress = [{ value: (self.statistics.dropped.members * 10), type: 'success'}, { value: ((self.statistics.dropped.mean_score - self.statistics.dropped.members) * 10), type: 'info'}];
				} else {
					self.statistics.dropped.scoreProgress = [{ value: (self.statistics.dropped.mean_score * 10), type: 'success'}, { value: ((self.statistics.dropped.members - self.statistics.dropped.mean_score) * 10), type: 'info'}];
				}
				
				// Plan to watch
				self.statistics['plan to watch'].mean_score = (self.statistics['plan to watch'].mean_score / ((self.statistics['plan to watch'].total_scored > 0) ? self.statistics['plan to watch'].total_scored : 1)).toFixed(2);
				self.statistics['plan to watch'].members = (self.statistics['plan to watch'].members / ((self.statistics['plan to watch'].total_members_scored > 0) ? self.statistics['plan to watch'].total_members_scored : 1)).toFixed(2);
				self.statistics['plan to watch'].mean_gap = (self.statistics['plan to watch'].mean_score - (self.statistics['plan to watch'].mean_gap / ((self.statistics['plan to watch'].total_scored > 0) ? self.statistics['plan to watch'].total_scored > 0 : 1))).toFixed(2);
				if (self.statistics['plan to watch'].mean_gap > 0) {
					self.statistics['plan to watch'].mean_gap = '+' + self.statistics['plan to watch'].mean_gap;
				}
				self.statistics['plan to watch'].kindProgress = [{ value: (self.statistics['plan to watch'].movies / self.statistics['plan to watch'].total * 100), type: 'success'}, { value: (self.statistics['plan to watch'].ova / self.statistics['plan to watch'].total * 100), type: 'warning'}, { value: (self.statistics['plan to watch'].specials / self.statistics['plan to watch'].total * 100), type: 'danger'}, { value: (self.statistics['plan to watch'].tv / self.statistics['plan to watch'].total * 100), type: 'info'}];
				self.statistics['plan to watch'].episodesProgress = [{ value: (self.statistics['plan to watch'].watched / self.statistics['plan to watch'].episodes * 100), type: 'success'}];
				if (self.statistics['plan to watch'].mean_score > self.statistics['plan to watch'].members) {
					self.statistics['plan to watch'].scoreProgress = [{ value: (self.statistics['plan to watch'].members * 10), type: 'success'}, { value: ((self.statistics['plan to watch'].mean_score - self.statistics['plan to watch'].members) * 10), type: 'info'}];
				} else {
					self.statistics['plan to watch'].scoreProgress = [{ value: (self.statistics['plan to watch'].mean_score * 10), type: 'success'}, { value: ((self.statistics['plan to watch'].members - self.statistics['plan to watch'].mean_score) * 10), type: 'info'}];
				}

				self.openModal('stats');
			},
			
			updateWatchedData: function () {
				var self = this;

				$.ajax({
					dataType : 'json',
					url: 'http://mal-api.com/animelist/' + self.login + '?nocache=' + (new Date().getTime())
				})
				.done(function (data) {

					_.each(data.anime, function (anime) {
						var key = self.checkAnime(self.animes, parseInt(anime.id));
						
						if (key !== -1) {
							self.animes[key].score = (anime.score) ? parseInt(anime.score) : 0;
							self.animes[key].watched_episodes = (anime.watched_episodes) ? parseInt(anime.watched_episodes) : '-';
							self.animes[key].watched_status = (anime.watched_status) ? anime.watched_status.toString() : '-';
						}
					}, self);
				}).fail(function (error) {
					if (error.statusText !== 'abort') {
						self.showError(error.status);
					}
				});
			},
			
			updateList: function (list, page) {
				var self = this;
				
				$.xhrPool.abortAll();
				
				self.loadStatus = '\'' + list.charAt(0).toUpperCase() + list.substring(1) + '\' list updating...';
				self.viewLoadStatus();
				
				var url;
				
				if (!(page > 0)) {
					page = 1;
				}

				self.page = page;
				
				switch (list) {
				case 'popular':
					url = 'anime/popular?page=' + page + '&';
					break;
				case 'top':
					url = 'anime/top?page=' + page + '&';
					break;
				case 'topmovie':
					url = 'anime/top?type=movie&page=' + page + '&';
					break;
				case 'topova':
					url = 'anime/top?type=ova&page=' + page + '&';
					break;
				case 'topspecial':
					url = 'anime/top?type=special&page=' + page + '&';
					break;
				case 'toptv':
					url = 'anime/top?type=tv&page=' + page + '&';
					break;
				default:
					url = 'animelist/' + self.login + '?';
					break;
				}
		
				$.ajax({
					url: 'http://mal-api.com/' + url + 'nocache=' + (new Date().getTime()),
					dataType : 'json'
				})
				.done(function (data) {
					
					var nbAnimesToLoad = 0;
					var nbAnimesLoaded = 0;
					
					if (list !== self.watchingList) { // Avoid problems with fast watching list changes
						return 0;
					}
					
					switch (list) {
					case 'watching':
						self.watching = [];
						break;
					
					case 'completed':
						self.completed = [];
						break;
					
					case 'on-hold':
						self.onhold = [];
						break;
					
					case 'dropped':
						self.dropped = [];
						break;
					
					case 'plan to watch':
						self.plantowatch = [];
						break;
					}

					if (data.anime) {
						_.each(data.anime, function (anime) {
							if (anime.watched_status.toString() === list) {
								nbAnimesToLoad++;
								
								if (self.checkAnime(self.animes, parseInt(anime.id)) === -1) {
									self.pushAnime(self.animes, anime, anime);
								}
							}
						}, self);
					} else {
						_.each(data, function (anime) {
							anime.image_url = anime.image_url.substring(0,anime.image_url.length - 5) + '.jpg';
							self.pushAnime(self.animes, anime);
							nbAnimesToLoad++;
						}, self);
						
						self.updateWatchedData();
						
						self.viewPagination();
						
						data.anime = _.clone(data);
					}

					if (nbAnimesToLoad > 0) {
						self.loadStatus = 'Animes details updating...';
						self.safeApply();
						
						_.each(data.anime, function (anime) {
							var watched_status = anime.watched_status ? anime.watched_status.toString() : '', id = parseInt(anime.id);
							
							if ((watched_status === list) || (list === 'popular') || (list.substring(0,3) === 'top')) {
								
								$.ajax({
									dataType : 'json',
									url: 'http://mal-api.com/anime/' + id
								}).done(function (data) {
									
									switch (list) {
									case 'watching':
										self.pushAnime(self.watching, data, anime);
										self.pushAnime(self.animes, data, anime);
										break;
									
									case 'completed':
										self.pushAnime(self.completed, data, anime);
										self.pushAnime(self.animes, data, anime);
										break;
									
									case 'on-hold':
										self.pushAnime(self.onhold, data, anime);
										self.pushAnime(self.animes, data, anime);
										break;
									
									case 'dropped':
										self.pushAnime(self.dropped, data, anime);
										self.pushAnime(self.animes, data, anime);
										break;
									
									case 'plan to watch':
										self.pushAnime(self.plantowatch, data, anime);
										self.pushAnime(self.animes, data, anime);
										break;
									default:
										self.pushAnime(self.animes, data);
										break;
									}


									nbAnimesLoaded++;
									
									self.updateLoadBar(nbAnimesLoaded, nbAnimesToLoad);
									
									if (nbAnimesLoaded >= nbAnimesToLoad) {

										switch (list) {
										
										case 'watching':
											if (!angular.equals(self.animes, self.watching)) {
												self.animes = _.clone(self.watching);
												self.safeApply();
											}
											localStorage['watching'] = JSON.stringify(self.watching);
											break;
										
										case 'completed':
											if (!angular.equals(self.animes, self.completed)) {
												self.animes = _.clone(self.completed);
												self.safeApply();
											}
											localStorage['completed'] = JSON.stringify(self.completed);
											break;
										
										case 'on-hold':
											if (!angular.equals(self.animes, self.onhold)) {
												self.animes = _.clone(self.onhold);
												self.safeApply();
											}
											localStorage['on-hold'] = JSON.stringify(self.onhold);
											break;
										
										case 'dropped':
											if (!angular.equals(self.animes, self.dropped)) {
												self.animes = _.clone(self.dropped);
												self.safeApply();
											}
											localStorage['dropped'] = JSON.stringify(self.dropped);
											break;
										
										case 'plan to watch':
											if (!angular.equals(self.animes, self.plantowatch)) {
												self.animes = _.clone(self.plantowatch);
												self.safeApply();
											}
											localStorage['plan to watch'] = JSON.stringify(self.plantowatch);
											break;
										}
										
										setTimeout(function () {
											self.hideLoadStatus();
										}, 100);
									}

								}).fail(function (error) {
									if (error.statusText !== 'abort') {
										if (error.status === 0) {
											self.hideLoadStatus();
											self.showError(error.status);
										} else {
											self.loadStatus = 'Error ' + error.status + ': retry...';
											self.safeApply();
											
											setTimeout(function () {
												self.updateList(list);
											}, 100);
										}
									}
								});
							}
						}, self);
					} else {
						self.updateLoadBar(1, 1);
						
						setTimeout(function () {
							self.hideLoadStatus();
						}, 100);
					}
				}).fail(function (error) {
					if (error.statusText !== 'abort') {
						if (error.status === 0) {
							self.hideLoadStatus();
							self.showError(error.status);
						} else {
							self.loadStatus = 'Error ' + error.status + ': retry...';
							self.safeApply();
							
							setTimeout(function () {
								self.updateList(list);
							}, 100);
						}
					}
				});
			},
			
			updateLoadBar: function (a, b) {
				$('#loadBar').css('width', Math.floor(a / b * 100) + '%');
			},
			
			updateSize: function (size) {
				this.imagesWidth = size;
				this.imagesHeight = 1.5 * size;
				this.safeApply();
			},
			
			viewList: function (list, page) {					
				this.updateLoadBar(0, 1);
				$('.pagination').hide();
				$('.nav').children().removeClass('active');
				$('#orderByList #score').hide();
				this.watchingList = list;
				
				var switchList = list;
				
				if (list.substr(0,3) === 'top') {
					switchList = 'top';
				}

				switch (switchList) {
				case 'watching':
					$('#watching').addClass('active');
					this.animes = _.clone(this.watching);
					this.viewLBadge = true;
					$('#orderByList #score').show();
					this.changeOrderBy('title');
					this.updateList('watching');
					break;
					
				case 'completed':
					$('#completed').addClass('active');
					this.animes = _.clone(this.completed);
					this.viewLBadge = false;
					$('#orderByList #score').show();
					this.changeOrderBy('title');
					this.updateList('completed');
					break;
					
				case 'on-hold':
					$('#onhold').addClass('active');
					this.animes = _.clone(this.onhold);
					this.viewLBadge = true;
					$('#orderByList #score').show();
					this.changeOrderBy('title');
					this.updateList('on-hold');
					break;
					
				case 'dropped':
					$('#dropped').addClass('active');
					this.animes = _.clone(this.dropped);
					this.viewLBadge = true;
					$('#orderByList #score').show();
					this.changeOrderBy('title');
					this.updateList('dropped');
					break;
					
				case 'plan to watch':
					$('#plantowatch').addClass('active');
					this.animes = _.clone(this.plantowatch);
					this.viewLBadge = false;
					this.changeOrderBy('title');
					this.updateList('plan to watch');
					break;
					
				case 'popular':
					$('#popular').addClass('active');
					this.animes = [];
					this.viewLBadge = true;
					this.changeOrderBy('none');
					this.updateList('popular', page);
					break;
					
				case 'top':
					$('#top').addClass('active');
					this.animes = [];
					this.viewLBadge = true;
					this.changeOrderBy('none');
					this.updateList(list, page);
					break;
					
				case 'search':
					this.animes = _.clone(this.search);
					this.viewLBadge = true;
					this.changeOrderBy('title', page);
					break;
				}
			},
			
			viewLoadStatus: function () {
				this.updateLoadBar(0, 1);
				$('.loadStatus').removeClass('invisible');
			},
			
			viewNextPage: function () {
				this.viewList(this.watchingList, this.page + 1);
			},
			
			viewPagination: function () {
				$('#prevPage').removeClass('disabled');

				if (this.page === 1) {
					$('#prevPage').addClass('disabled');
				}
				
				$('#page').text(this.page);
				$('.pagination').show();
			},
			
			viewPrevPage: function () {
				if (this.page > 1) {
					this.viewList(this.watchingList, this.page - 1);
				}
			}
		};
	});
}(this.angular));