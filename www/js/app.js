// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

/*global cordova, $, console, Firebase, angular, ionic,  window, StatusBar*/

(function () {
    "use strict";

    angular.module('starter', ['ionic', 'ngCordova', 'ionic.contrib.ui.tinderCards'])
        .run(function ($ionicPlatform) {
            $ionicPlatform.ready(function () {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                }
                if (window.StatusBar) {
                    StatusBar.styleDefault();
                }
            });
        })
        .service('StockService', function ($timeout, $cordovaDevice) {

            var DATEFULLSTRING = (new Date(Date.now() + 7 * 60 * 60 * 1000)).toISOString(),
                DATE = ''.concat(DATEFULLSTRING.substr(0, 4), DATEFULLSTRING.substr(5, 2), DATEFULLSTRING.substr(8, 2)),

                ref = new Firebase("https://stock2day.firebaseio.com/"),
                STOCKS = [],
                VOTES = {},
                USERID = '',

                pushSTOCKS = function (stock) {
                    $timeout(function () {
                        STOCKS.push(stock);
                    });
                };

            console.log('TODAY: ', DATE);

            //for DEMO ONLY
            DATE = '20150613';

            if (window.cordova) {
                //                console.log($cordovaDevice.getUUID());
                console.log('PLATFORM: CORDOVA');
                USERID = "U001";
            } else {
                console.log('PLATFORM: WWW');
                USERID = "U001";
            }

            console.log('USERID: ', USERID);
            console.log('TODAY: ', DATE);


            ref.child('STOCKS').once('value', function (snapShot) {
                var stockobj = snapShot.val(),
                    key;

                for (key in stockobj) {
                    if (stockobj.hasOwnProperty(key)) {
                        pushSTOCKS(stockobj[key]);

                        ref.child('STOCKVOTES').child(DATE).child(key).update({
                            symbol: key
                        });
                    }
                }
            });

            ref.child('STOCKVOTES').child(DATE).on('child_added', function (snapshot) {
                $timeout(function () {
                    VOTES[snapshot.key()] = snapshot.val();

                    console.log('STOCKVOTES: child_added: ', snapshot.key(), ': ', JSON.stringify(snapshot.val()));
                });
            });

            ref.child('STOCKVOTES').child(DATE).on('child_changed', function (snapshot) {
                $timeout(function () {
                    VOTES[snapshot.key()] = snapshot.val();

                    console.log('STOCKVOTES: child_changed: ', snapshot.key(), ': ', JSON.stringify(snapshot.val()));
                });
            });

            this.getSTOCKS = function () {
                return STOCKS;
            };

            this.getVOTES = function () {
                return VOTES;
            };

            this.BULL = function (symbol) {
                ref.child('STOCKVOTES').child(DATE).child(symbol).child('bull').transaction(function (count) {
                    return count ? count + 1 : 1;
                }, function () {}, false);
            };

            this.BEAR = function (symbol) {
                ref.child('STOCKVOTES').child(DATE).child(symbol).child('bear').transaction(function (count) {
                    return count ? count + 1 : 1;
                }, function () {}, false);
            };
        })
        .controller('Stock2DayCtrl', function ($scope, TDCardDelegate, StockService, $ionicPopup, $timeout) {

            var ref = new Firebase("https://stock2day.firebaseio.com/"),
                contentSelector = $('#stock-content');

            $scope.mode = 'VOTE';

            ref.child('SYSTEM').on('child_added', function (snapshot) {
                $timeout(function () {
                    if (snapshot.key() === 'MODE') {
                        $scope.mode = snapshot.val();
                    }
                    if (snapshot.key() === 'BEAREST') {
                        $scope.bearest = snapshot.val();
                    }
                    if (snapshot.key() === 'BULLEST') {
                        $scope.bullest = snapshot.val();
                    }
                });
            });

            ref.child('SYSTEM').on('child_changed', function (snapshot) {
                $timeout(function () {
                    if (snapshot.key() === 'MODE') {
                        $scope.mode = snapshot.val();
                    }
                    if (snapshot.key() === 'BEAREST') {
                        $scope.bearest = snapshot.val();
                    }
                    if (snapshot.key() === 'BULLEST') {
                        $scope.bullest = snapshot.val();
                    }
                });
            });

            $scope.cards = StockService.getSTOCKS();
            $scope.votes = StockService.getVOTES();

            $scope.cardSwipedRight = function (symbol) {
                StockService.BULL(symbol);

                console.log('BULL: ', symbol);

                contentSelector.css({
                    background: '#115f11'
                });

                $timeout(function () {
                    contentSelector.css({
                        background: '#FFF'
                    });
                }, 1000);

                $scope.showResultPopup(symbol);
            };

            $scope.cardSwipedLeft = function (symbol) {
                console.log('BEAR: ', symbol);

                StockService.BEAR(symbol);

                contentSelector.css({
                    background: '#913030'
                });

                $timeout(function () {
                    contentSelector.css({
                        background: '#FFF'
                    });
                }, 1000);


                $scope.showResultPopup(symbol);
            };

            $scope.cardPartialSwipe = function (amt) {
                console.log('PARTIAL: ', amt);

                //                if (amt < 0) {
                //                    contentSelector.css({
                //                        background: '#F00'
                //                    });
                //                } else if (amt > 0) {
                //                    contentSelector.css({
                //                        background: '#0F0'
                //                    });
                //                } else {
                //                    contentSelector.css({
                //                        background: '#FFF'
                //                    });
                //                }
            };

            $scope.cardPass = function (symbol) {
                console.log('PASS: ', symbol);
                StockService.PASS(symbol);
            };

            $scope.showResultPopup = function (symbol) {
                $scope.currentStock = symbol;

                console.log('SYMBOL: ', symbol);
                console.log('BULL: ', $scope.votes[symbol].bull);
                console.log('BEAR: ', $scope.votes[symbol].bear);

                // An elaborate, custom popup
                var myPopup = $ionicPopup.show({
                    template: '<div class="popup-content"><div ng-show="votes[currentStock].bear > votes[currentStock].bull" class="popup-symbol-bear">{{currentStock}}</div><div ng-show="votes[currentStock].bear < votes[currentStock].bull" class="popup-symbol-bull">{{currentStock}}</div><div ng-show="votes[currentStock].bear === votes[currentStock].bull" class="popup-symbol-stable">{{currentStock}}</div><div id="popup-result-bear-bar">{{votes[currentStock].bear}}</div><div id="popup-result-bull-bar">{{votes[currentStock].bull}}</div><div class="popup-result-total">Total Votes : {{votes[currentStock].bull+votes[currentStock].bear}}</div>',
                    //                    title: 'BULL-BEAR SCALE',
                    subTitle: '',
                    scope: $scope,
                    buttons: [
                        {
                            text: 'Close'
                        }
                    ]
                });

                //                var bearwidth = 230 * $scope.votes[symbol].bear / ($scope.votes[symbol].bear + $scope.votes[symbol].bull);
                //                $('#popup-result-bear-bar').css({
                //                    width: bearwidth + 'px'
                //                });
                //
                //                console.log('bearwidth: ', bearwidth);
                //
                //                var bullwidth = 230 * $scope.votes[symbol].bear / ($scope.votes[symbol].bear + $scope.votes[symbol].bull);
                //                $('#popup-result-bear-bar').css({
                //                    width: bullwidth + 'px'
                //                });
                //
                //                console.log('bullwidth: ', bearwidth);

                myPopup.then(function (res) {

                });

                $timeout(function () {
                    myPopup.close(); //close the popup after 2 seconds
                }, 2000);
            };
        });
}());