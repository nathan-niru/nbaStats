$(document).ready(function() {
    
    
    var module = angular.module('nbaStats', ["ngRoute"]);
        
    module.directive('header', function () {
        return {
            restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
            replace: true,
            templateUrl: 'header.html',
            controller: ['$scope', '$filter', function ($scope, $filter) {
                // Your behaviour goes here :)
            }]
        }
    });
    
    module.config(function($routeProvider) {
        $routeProvider
        .when("/", {
            templateUrl : "stats.html"
        })
        .when("/leaders", {
             templateUrl : "leaders.html"
        })
        .when("/compare", {
             templateUrl : "compare.html"
        });
    });
    
    module.controller('nbaStatsController', function nbaStatsController($scope, nbaService) {
    
        //var nba = require('nba');
        $scope.search = {};
        $scope.searchResult = [];
        $scope.season = {
            singleSelect: "",
            options: [
                {year: "2016-17"}, {year: "2015-16"}, {year: "2014-15"}, {year: "2013-14"},
                {year: "2012-13"}, {year: "2011-12"}, {year: "2010-11"}, {year: "2009-10"},
                {year: "2008-09"}, {year: "2007-08"}, {year: "2006-07"}, {year: "2005-06"},
                {year: "2004-05"}, {year: "2003-04"}, {year: "2002-03"}, {year: "2001-02"},
                {year: "2000-01"}, {year: "1999-00"}
            ]
        };
        $scope.seasonType = {
            singleSelect: "",
            options: [
                {type: "Regular Season"}, 
                {type: "Playoffs"}]
        };
        var allPlayers;
        var allPlayoffPlayers;

        $scope.getPlayerData = function(season, seasonType) {
            nbaService.getPlayerList(season, seasonType).then(function(playerList) {
                allPlayers = playerList.leagueDashPlayerStats;
                getTop5();
                $scope.playerList = allPlayers.sort(sortBy("pts"));
                $("#spinner").hide();
                console.log($scope.playerList);
            });
        };
        
        $scope.getPlayerData("2016-17", "Regular Season");
        
        // filter players with less than x games (primarily for fg%, also add 3p and ft %s)
        function getTop5() {
            $scope.top5Pts = allPlayers.sort(sortBy("pts")).slice(0,5);
            $scope.top5Reb = allPlayers.sort(sortBy("reb")).slice(0,5);
            $scope.top5Ast = allPlayers.sort(sortBy("ast")).slice(0,5);
            $scope.top5Stl = allPlayers.sort(sortBy("stl")).slice(0,5);
            $scope.top5Blk = allPlayers.sort(sortBy("blk")).slice(0,5);
            $scope.top5fgPct = allPlayers.sort(sortBy("fgPct")).slice(0,5);
        };
        
        $scope.allPlayers = function() {
            $scope.playerList = allPlayers.sort(sortBy("pts"));
        };
        
        $scope.changeSeason = function() {
            $("#spinner").show();
            $scope.getPlayerData($scope.season.singleSelect, $scope.seasonType.singleSelect);
        };
        
        $scope.search = function() {
            $scope.searchResult = [];
            for (let p in allPlayers) {
                if (allPlayers[p].playerName.toUpperCase().includes($scope.search.text.toUpperCase())) {
                    $scope.searchResult.push(allPlayers[p]);
                }
            }
            $scope.playerList = $scope.searchResult;
            console.log($scope.searchResult);
        };
        

        // TODO tie breakers
        $scope.sort = function(stat) {
            $scope.playerList = allPlayers;
            $scope.playerList.sort(sortBy(stat));
        }
        
        
        /*
        nba.stats.playerStats().then(function(data) {
            console.log(data.leagueDashPlayerStats);
            $scope.playerList = data.leagueDashPlayerStats;
            //data.leagueDashPlayerStats;
            alert($scope.playerList);
            //alert(JSON.stringify(data.leagueDashPlayerStats));
        });//playerInfo("203112");*/
        
        
        function sortBy(stat) {
            return function(x, y) {
                return y[stat] - x[stat];
            }
        };
        
        
        require(['chart.js'], function(Chart) { 
        //var Chart = require('Chart.min.js');
        //alert($("#chart"));
        var chart = $("#chart");
        var chartData = {
            labels: ["Points", "Rebounds", "Assists", "Steals", "Blocks", "Turnovers"],
            datasets: [
                {
                    label: "My First dataset",
                    backgroundColor: "rgba(179,181,198,0.2)",
                    borderColor: "rgba(179,181,198,1)",
                    pointBackgroundColor: "rgba(179,181,198,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(179,181,198,1)",
                    data: [30, 11, 2, 2, 3, 3]
                },
                {
                    label: "My Second dataset",
                    backgroundColor: "rgba(255,99,132,0.2)",
                    borderColor: "rgba(255,99,132,1)",
                    pointBackgroundColor: "rgba(255,99,132,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(255,99,132,1)",
                    data: [25, 7, 11, 2, 0.3, 4]        
                }]
        };
        
        var radarChart = new Chart(chart, {
            type: 'radar',
            data: chartData
        });
        });
        
    });
    
    
        module.factory('nbaService', function($q) {
           var nba = require('nba');
           var getPlayerList = function(season, seasonType, callbackFn) {
               var defer = $q.defer();
               nba.stats.playerStats({Season: season, SeasonType: seasonType}).then(function(data) {
               //nba.stats.homepageV2().then(function(data) {
                   defer.resolve(data);
               });
               return defer.promise;
           };
            
            return {
                getPlayerList : getPlayerList
            }
        });
    
})