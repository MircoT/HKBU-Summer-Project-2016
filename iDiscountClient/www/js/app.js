// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova', 'LocalStorageModule'])

.config(function(localStorageServiceProvider) {
  localStorageServiceProvider
    .setPrefix('iDiscount');
})

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.controller('mainCtrl', [
  '$rootScope',
  '$scope',
  '$http',
  '$timeout',
  '$ionicPlatform',
  '$ionicModal',
  '$ionicPopup',
  '$ionicLoading',
  '$cordovaNetwork',
  '$cordovaBarcodeScanner',
  '$cordovaBeacon',
  'localStorageService',
  function(
    $rootScope,
    $scope,
    $http,
    $timeout,
    $ionicPlatform,
    $ionicModal,
    $ionicPopup,
    $ionicLoading,
    $cordovaNetwork,
    $cordovaBarcodeScanner, 
    $cordovaBeacon,
    localStorageService) {

    if (localStorageService.get('list') === null) {
      localStorageService.set('list', []);
    }

    // localStorageService.set('list', []);  // DEBUG
    // DEBUG
    // localStorageService.set('list', []);  
    $scope.unbindList = localStorageService.bind($scope, 'list');

    var beacon_region = null;
    var beacon_list = [];

    // DEBUG
    // $scope.QrCodeData = "data:image/png;base64,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";
    $scope.QrCodeData = "";

    $ionicModal.fromTemplateUrl('show-qrcode.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.QrCodeModal = modal;
    });
    $scope.openQrCodeModal = function() {
      $scope.QrCodeModal.show();
    };
    $scope.closeQrCodeModal = function() {
      $scope.QrCodeModal.hide();
    };
    
    function readToken(string) {
      var tmp = string.split(".");
      var uHeader = b64utos(tmp[0]);
      var uClaim = b64utos(tmp[1]);

      var pHeader = KJUR.jws.JWS.readSafeJSONString(uHeader);
      var pClaim = KJUR.jws.JWS.readSafeJSONString(uClaim);

      var sHeader = JSON.stringify(pHeader, null, "  ");
      var sClaim = JSON.stringify(pClaim, null, "  ");

      console.log(pHeader, sHeader);
      console.log(pClaim, sClaim);

      return pClaim;
    }

    function searchDiscount(number) {
      var found = false;
      $scope.list.forEach(function(discount) {
        found = found || discount.number === number;
      });
      return found;
    }

    $scope.scanReceipt = function() {

      $cordovaBarcodeScanner
        .scan({
            "preferFrontCamera" : false, // iOS and Android
            "showFlipCameraButton" : true, // iOS and Android
            "prompt" : "Place the QrCode inside the scan area", // supported on Android only
            "formats" : "QR_CODE", // default: all but PDF_417 and RSS_EXPANDED
            "orientation" : "portrait" // Android only (portrait|landscape), default unset so it rotates with the device
        })
        .then(function(barcodeData) {
          // Success! Barcode data is here
          try {
            var data = readToken(barcodeData.text);
            data.token = barcodeData.text;
            data.activated = false;
            data.redeemed = false;
            data.deleteMe = false;

            if (!searchDiscount(data.number)) $scope.list.push(data);

            console.log($scope.list)
          }
          catch(err) {
            $ionicPopup.alert({
              title: '<i class="icon ion-alert-circled"></i> Attention!',
              template: 'Try to scan again the QrCode...'
            });
          }
          
        }, function(error) {
          $ionicPopup.alert({
            title: '<i class="icon ion-alert-circled"></i> Attention!',
            template: 'Try to scan again the QrCode...'
          });
        });
    };

    function getNearestBeacon(callback) {
      $ionicPlatform.ready(function() {
        if (beacon_region === null) {
          beacon_region = $cordovaBeacon.createBeaconRegion(
            'myBeacon', 'e031cced-1ce9-42c6-a936-83c78157d268',
            null, null, false);
        }

        if (!$cordovaNetwork.isOnline()) {
          $ionicPopup.alert({
            title: '<i class="icon ion-alert-circled"></i> Attention!',
            template: 'An internet connection is required...'
          });
        }
        else if (ionic.Platform.isIOS()) {
          $cordovaBeacon.requestAlwaysAuthorization().then(function() {
            $cordovaBeacon.startRangingBeaconsInRegion(beacon_region).then(function(result) {
              $ionicLoading.show({ template: '<ion-spinner icon="ios"></ion-spinner>'}).then(function() {
                $timeout(callback, 4200);
              });
            });
          });
        }
        else {
          $cordovaBeacon.isBluetoothEnabled().then(function(bluetoothActivated) {
            if (bluetoothActivated) {
              $cordovaBeacon.startRangingBeaconsInRegion(beacon_region).then(function(result) {
                $ionicLoading.show({ template: '<ion-spinner icon="ios"></ion-spinner>'}).then(function() {
                  $timeout(callback, 4200);
                });
              });
            }
            else {
              $ionicPopup.alert({
                title: '<i class="icon ion-alert-circled"></i> Attention!',
                template: 'Please enable bluetooth...'
              });
            }
          });
        }
      })
    }

    function activateWithNearestBeacon(data) {
      return function () {
        $cordovaBeacon.stopRangingBeaconsInRegion(beacon_region).then(function() {
          var nearest = beacon_list.reduce(function(prev, curr) {
            if (prev === null || prev.accuracy > curr.accuracy) prev = curr;
            return prev;
          }, null);

          console.log(nearest);

          if (nearest === null) {
            $ionicLoading.hide().then(function() {
              $ionicPopup.alert({
                title: '<i class="icon ion-alert-circled"></i> Attention!',
                template: 'There was a problem on the activation of the discount, please try again...'
              });
            });
          }
          else {
            $http.post('https://idiscount.herokuapp.com/discount/activate', {
              token: data.token,
              major: +nearest.major,
              minor: +nearest.minor
            })
            .then(
              function(response) {
                console.log(response)
                data.activated = true;
                $ionicLoading.hide().then(function() {
                  $ionicPopup.alert({
                    title: '<i class="icon ion-information-circled"></i> Activated!',
                    template: 'Discount activated, now you can redeem it in the indicated shop...'
                  });
                });
              }, 
              function(response) {
                console.log(response)
                data.activated = false;
                $ionicLoading.hide().then(function() {
                  $ionicPopup.alert({
                    title: '<i class="icon ion-alert-circled"></i> Attention!',
                    template: response.data
                  });
                });
            });
          }
        });
      }
    }

    function redeemWithNearestBeacon(data) {
      return function () {
        $cordovaBeacon.stopRangingBeaconsInRegion(beacon_region).then(function() {
          var nearest = beacon_list.reduce(function(prev, curr) {
            if (prev === null || prev.accuracy > curr.accuracy) prev = curr;
            return prev;
          }, null);

          console.log(nearest);

          if (nearest === null) {
            $ionicLoading.hide().then(function() {
              $ionicPopup.alert({
                title: '<i class="icon ion-alert-circled"></i> Attention!',
                template: 'There was a problem on the redeed the discount, please try again...'
              });
            });
          }
          else {
            $http.post('https://idiscount.herokuapp.com/discount/redeem', {
              token: data.token,
              major: +nearest.major,
              minor: +nearest.minor
            })
            .then(
              function(response) {
                console.log(response)
                $scope.QrCodeData = response.data;
                $ionicLoading.hide().then(function() {
                  $scope.openQrCodeModal();
                });
              }, 
              function(response) {
                console.log(response)
                $ionicLoading.hide().then(function() {
                  $ionicPopup.alert({
                    title: '<i class="icon ion-alert-circled"></i> Attention!',
                    template: response.data
                  });
                });
            });
          }
        });
      }
    }

    $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function (event, pluginResult) {
      // console.log(JSON.stringify(pluginResult));
      beacon_list = pluginResult.beacons;
    });

    $scope.activate = function(data) {
      var beacon = getNearestBeacon(activateWithNearestBeacon(data));
    };

    $scope.redeem = function(data) {
      var beacon = getNearestBeacon(redeemWithNearestBeacon(data));
    };

    $scope.wantToDelete = function(data) {
      data.deleteMe = !data.deleteMe;
    };

    $scope.delete = function(data) {
      $scope.list = $scope.list.reduce(function(newList, curObj) {
        if (curObj.number !== data.number) {
          newList.push(curObj);
        }
        return newList;
      }, []);
    };
  }
]);
