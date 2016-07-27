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
  '$ionicPlatform',
  '$ionicPopup',
  '$cordovaBarcodeScanner',
  '$cordovaBeacon',
  'localStorageService',
  function(
    $rootScope,
    $scope,
    $ionicPlatform,
    $ionicPopup,
    $cordovaBarcodeScanner, 
    $cordovaBeacon,
    localStorageService) {

    if (localStorageService.get('list') === null) {
      localStorageService.set('list', []);
    }

    // localStorageService.set('list', []);  // DEBUG
    $scope.unbindList = localStorageService.bind($scope, 'list');

    var beacon_region = null;
    
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
        .scan()
        .then(function(barcodeData) {
          // Success! Barcode data is here
          try {
            var data = readToken(barcodeData.text);
            data.token = barcodeData.text;
            data.activated = false;
            data.redeemed = false;

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

    function getNearestBeacon() {
      $ionicPlatform.ready(function() {
        if (beacon_region === null) {
          beacon_region = $cordovaBeacon.createBeaconRegion(
            'macaron', 'e031cced-1ce9-42c6-a936-83c78157d268',
            null, null, false);
        }

        if (ionic.Platform.isIOS()) $cordovaBeacon.requestAlwaysAuthorization();

        $cordovaBeacon.isBluetoothEnabled().then(function(bluetoothActivated) {
          if (bluetoothActivated) {
            $cordovaBeacon.startRangingBeaconsInRegion(beacon_region).then(function(result) {
              console.log(result);
            });
          }
          else {
            $ionicPopup.alert({
              title: '<i class="icon ion-alert-circled"></i> Attention!',
              template: 'Please enable bluetooth...'
            });
          }
        });
      })
    }

    $scope.activate = function(token) {
      var beacon = getNearestBeacon();
    };

    $scope.redeem = function(token) {
      var beacon = getNearestBeacon();
    };

    $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function (event, pluginResult) {
      console.log(JSON.stringify(pluginResult));
    });
  }
]);
