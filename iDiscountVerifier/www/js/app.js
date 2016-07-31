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

    $scope.device = {
      uuid: ""
    }

    if (localStorageService.get('verifier') === null) {
      localStorageService.set('verifier', { activated: false, code: "", token: ""});
    }

    $scope.unbindVerifier = localStorageService.bind($scope, 'verifier');

    $scope.reset = function() {
      $scope.verifier = { activated: false, code: "", token: ""};
    };    

    $ionicPlatform.ready(function() {
      $scope.device.uuid = $cordovaDevice.getUUID();
      $scope.$apply();
    });
    
    $scope.activateDevice = function() {
      $ionicLoading.show({ template: '<ion-spinner icon="ios"></ion-spinner>'});

      $http.post("https://idiscount.herokuapp.com/device/activate/"+$scope.device.uuid, {
        activationCode: $scope.verifier.code
      })
      .then(
        function(response) {
          $scope.verifier.activated = true;
          $scope.verifier.token = response.data;
          $ionicLoading.hide();
        },
        function(response) {
          $ionicLoading.hide().then(function() {
            $ionicPopup.alert({
              title: '<i class="icon ion-alert-circled"></i> Attention!',
              template: response.data || "Something went wrong, try again"
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
            $http.post("https://idiscount.herokuapp.com/discount/verifyRedeem", {
              uuid: $scope.device.uuid,
              token: barcodeData.text,
              activation_token: $scope.verifier.token
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
        }, function(error) {
          $ionicPopup.alert({
            title: '<i class="icon ion-alert-circled"></i> Attention!',
            template: 'Try to scan again the QrCode...'
          });
        });
    };

}]);