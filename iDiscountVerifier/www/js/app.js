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

.controller('MainCtrl', [
  '$scope',
  '$http',
  '$ionicPlatform',
  '$ionicLoading',
  '$ionicPopup',
  '$cordovaDevice',
  '$cordovaBarcodeScanner',
  'localStorageService',
  function(
    $scope,
    $http,
    $ionicPlatform,
    $ionicLoading,
    $ionicPopup,
    $cordovaDevice,
    $cordovaBarcodeScanner,
    localStorageService) 
  {

    $scope.uuid = "";

    if (localStorageService.get('verifier') === null) {
      localStorageService.set('verifier', { activated: false, code: ""});
    }

    // DEBUG
    // localStorageService.set('verifier', { activated: false, code: ""});

    $scope.unbindVerifier = localStorageService.bind($scope, 'verifier');

    $ionicPlatform.ready(function() {
      $scope.uuid = $cordovaDevice.getUUID();
    });
    
    $scope.activateDevice = function() {
      $ionicLoading.show({ template: '<ion-spinner icon="ios"></ion-spinner>'});

      $http.post("https://idiscount.herokuapp.com/device/activate/"+$scope.uuid, {
        activationCode: $scope.verifier.code
      })
      .then(
        function(response) {
          $scope.verifier.activated = true;
          $ionicLoading.hide();
        },
        function(response) {
          $ionicLoading.hide().then(function() {
            $ionicPopup.alert({
              title: '<i class="icon ion-alert-circled"></i> Attention!',
              template: response.data
            });
          });
        }
      );
    };

    $scope.verifyQrCode = function() {

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
          $ionicLoading.show({ template: '<ion-spinner icon="ios"></ion-spinner>'});
          try {            
            $http.post("https://idiscount.herokuapp.com/discount/verifyRedeem", {
              uuid: $scope.uuid,
              token: barcodeData.text
            })
            .then(
              function(response) {
                $ionicLoading.hide().then(function() {
                  $ionicPopup.alert({
                    title: '<i class="icon ion-information-circled"></i> Redeemed!',
                    template: response.data
                  });
                });
              },
              function(response) {
                $ionicLoading.hide().then(function() {
                  $ionicPopup.alert({
                    title: '<i class="icon ion-alert-circled"></i> Attention!',
                    template: response.data
                  });
                });
              }
            );
          }
          catch(err) {
            $ionicLoading.hide().then(function() {
              $ionicPopup.alert({
                title: '<i class="icon ion-alert-circled"></i> Attention!',
                template: 'Try to scan again the QrCode...'
              });
            });
          }
          
        }, function(error) {
          $ionicPopup.alert({
            title: '<i class="icon ion-alert-circled"></i> Attention!',
            template: 'Try to scan again the QrCode...'
          });
        });
    };

}]);