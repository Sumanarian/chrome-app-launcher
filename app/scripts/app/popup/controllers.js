'use strict'

var ENTER = 13;

var GRID_MOVES = {
  38: 'up',
  40: 'down',
  37: 'left',
  39: 'right'
};

var GRID_WIDTHS = {
  'large': 3,
  'small': 5
};

angular.module('launcher').controller(
  'AppsController',
  [ 
    '$scope', 
    '$q', 
    'appsService', 
    'iconsService', 
    'gridFactory', 
    'settingsService',
    function ($scope, $q, appsService, iconsService, gridFactory, settingsService) {

      $scope.apps = [];
      $scope.focusedAppIndex = 0;
      $scope.grid = null;

      var reloadApps = function () {
        appsService.loadApps()
        .then(function (apps) {
            $scope.apps = apps;
        });
      };

      var postLoad = function() {
        chrome.management.onInstalled.addListener(reloadApps);
        chrome.management.onUninstalled.addListener(reloadApps);
        chrome.management.onEnabled.addListener(reloadApps);
        chrome.management.onDisabled.addListener(reloadApps);

        $scope.$watch('apps', function (o) {
          appsService.saveOrder($scope.apps);

          if (!$scope.grid){
            $scope.grid = gridFactory.buildGrid($scope.apps.length, GRID_WIDTHS[$scope.settings.iconSize]);   
          }

          if ($scope.grid.itemsCount != $scope.apps.length) {
            $scope.grid.itemsCount = $scope.apps.length;
          }
        }, true);  
      };

      var initialize = function () {
        $q.all([ settingsService.get(), appsService.loadApps() ])
          .then(function (results) {

            var settings = results[0];
            var apps = results[1];

            $scope.settings = settings;
            $scope.apps = apps;

            postLoad();
          });
      };

      $scope.launch = function (app) {
        chrome.management.launchApp(app.id);
        window.close();
      }

      $scope.uninstall = function (app) {
        chrome.management.uninstall(app.id, { showConfirmDialog: true });
        window.close();
      }

      $scope.getIconUrl = function (app) {
        return iconsService.getIconUrl(app, $scope.settings.iconSize);
      };

      $scope.getBgImageStyle = function (app) {
        return {
          'background-image': 'url(' + $scope.getIconUrl(app) + ')'
        };
      };

      $scope.sortableOptions = function () {
        return {
          items: 'li',
          placeholder: '<li><div class="app card" ><div class="icon"></div><div class="name"></div></div></li>'
        };
      };

      $scope.handleKeys = function (e, appIndex, app) {
        var key = e.keyCode;

        if (key == 13) {
          $scope.launch(app);
        } else if (key == 46) { 
          $scope.uninstall(app);
        } else if (key >= 37 && key <= 40) {
          var index = $scope.grid.moveOnGrid(appIndex, GRID_MOVES[key]);
          $scope.updateFocusedApp(index);
        }
      };

      $scope.updateFocusedApp = function (index) {
        $scope.focusedAppIndex = index;
      };

      initialize();
    }]);
