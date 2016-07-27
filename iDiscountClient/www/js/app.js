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
  '$scope',
  '$cordovaBarcodeScanner',
  'localStorageService',
  function($scope, $cordovaBarcodeScanner, localStorageService) {

    // if (localStorageService.get('list') === null) {
    //   localStorageService.set('list', []);
    // }

    localStorageService.set('list', []);  // DEBUG
    $scope.unbindList = localStorageService.bind($scope, 'list');
    
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
          console.log(barcodeData);

          var data = readToken(barcodeData.text);
          data.token = barcodeData.text;
          data.activated = false;
          data.redeemed = false;

          if (!searchDiscount(data.number)) $scope.list.push(data);

          console.log($scope.list)
        }, function(error) {
          // An error occurred
        });
    };
  }
]);
