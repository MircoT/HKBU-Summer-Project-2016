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
    localStorageService) 
  {

    if (localStorageService.get('list') === null) {
      localStorageService.set('list', []);
    }

    // bind $scope.list array
    $scope.unbindList = localStorageService.bind($scope, 'list');

    var beacon_region = null;
    var beacon_list = [];

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
    
    /**
     * @param  {string} string
     * @return {object}
     */
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

    /**
     * @param  {integer} number the number to search
     * @return {boolean}
     */
    function searchDiscount(number) {
      var found = false;
      $scope.list.forEach(function(discount) {
        found = found || discount.number === number;
      });
      return found;
    }

    /**
     * @description Scan a QrCode and extract the JWT data that
     *              should be inserted in the list
     * @return {undefined}
     */
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

    /**
     * @description Start the research of the beacon and set
     *              a the function to call after a certain amount
     *              of time
     * @param  {Function} callback the function to call after
     *                    the research of the beacon
     * @return {undefined}
     */
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

    /**
     * @description Create a function that activate the discount
     *              passed as data
     * @param  {object} data the discount data
     * @return {Function}
     */
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

    /**
     * @description Create a function that redeem the discount
     *              passed as data
     * @param  {object} data the discount data
     * @return {Function}
     */
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

    /**
     * @description register the rangeBeacon event to update the beacon list
     */
    $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function (event, pluginResult) {
      // console.log(JSON.stringify(pluginResult));
      beacon_list = pluginResult.beacons;
    });

    /**
     * @description Activate the current discount selected
     * @param  {object} data the current discount selected
     * @return {undefined}
     */
    $scope.activate = function(data) {
      var beacon = getNearestBeacon(activateWithNearestBeacon(data));
    };

    /**
     * @description Redeem the current discount selected
     * @param  {object} data the current discount selected
     * @return {undefined}
     */
    $scope.redeem = function(data) {
      var beacon = getNearestBeacon(redeemWithNearestBeacon(data));
    };

    /**
     * @description Update the status to delete a discount
     * @param  {object} data the current discount selected
     * @return {undefined}
     */
    $scope.wantToDelete = function(data) {
      data.deleteMe = !data.deleteMe;
    };

    /**
     * @description Delete the current discount selected
     * @param  {object} data the current discount selected
     * @return {undefined}
     */
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
