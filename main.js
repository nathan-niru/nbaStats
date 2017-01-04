$(document).ready(function() {
    
    
    var module = angular.module('nbaStats', ["ngRoute", "chart.js", 'ngAnimate', 'ngSanitize', "ui.bootstrap", "ngMaterial"]);
    
    
    // header for tabs and filters
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
    
    
    // routing
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
        })
        .when("/advanced", {
             templateUrl : "advanced.html"
        });
    });
    
    
    module.controller('nbaStatsController', function nbaStatsController($scope, nbaService, $filter, $route) {
    
        //var nba = require('nba');
        
        // variables
        $scope.searchText = {};
        $scope.compare1 = {};
        $scope.compare2 = {};
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
        $scope.teams = {
            singleSelect: "",
            options: [
                {team: "ALL TEAMS"},
                {team: "ATL"}, {team: "BKN"}, {team: "BOS"}, {team: "CHA"}, {team: "CHI"}, {team: "CLE"}, {team: "DAL"}, {team: "DEN"}, {team: "DET"}, {team: "GSW"}, {team: "HOU"}, {team: "IND"},
                {team: "LAC"}, {team: "LAL"}, {team: "MEM"}, {team: "MIA"}, {team: "MIL"}, {team: "MIN"},
                {team: "NOP"}, {team: "NYK"}, {team: "OKC"}, {team: "ORL"}, {team: "PHI"}, {team: "PHX"},
                {team: "POR"}, {team: "SAC"}, {team: "SAS"}, {team: "TOR"}, {team: "UTA"}, {team: "WAS"}
            ]
        };
        $scope.seasonType = {
            singleSelect: "",
            options: [
                {type: "Regular Season"}, 
                {type: "Playoffs"}]
        };
        $scope.playerList = [];
        $scope.pagination = {
            currentPage: 1,
            itemsPerPage: 25,
            maxSize: 5,
            totalItems: 0
        };
        $scope.selectedPlayer1 = {};
        $scope.selectedPlayer2 = {};
        
        var allPlayers;
        var allPlayersTeamFiltered;
        var allPlayersTotals;
        var leagueTotals = new Map();
        var teamTotals = new Map();
        var factor;
        var VOP;
        var DRBP;
        
        
        // retrieving data

        $scope.getPlayerData = function(season, seasonType) {
            nbaService.getPlayerList(season, seasonType, "PerGame").then(function(playerList) {
                allPlayers = playerList.leagueDashPlayerStats;
                $scope.setTeam();
                $scope.playerList = $filter('orderBy')($scope.playerList, "pts", true);
                if ($route.current.loadedTemplateUrl == "advanced.html") {
                    $scope.calculateAdvanced();
                }
                $scope.pagination.totalItems = $scope.playerList.length;
                $("#spinner").hide();
                console.log($scope.playerList);
                //console.log(playerList);
            });
        };
        
        $scope.getPlayerData("2016-17", "Regular Season");
        
        // TODO filter players with less than x games (primarily for fg%, also add 3p and ft %s)
        $scope.getTop5 = function() {
            $scope.top5Pts = $filter('orderBy')($scope.playerList, "pts", true).slice(0,5);
            $scope.top5Reb = $filter('orderBy')($scope.playerList, "reb", true).slice(0,5);
            $scope.top5Ast = $filter('orderBy')($scope.playerList, "ast", true).slice(0,5);
            $scope.top5Stl = $filter('orderBy')($scope.playerList, "stl", true).slice(0,5);
            $scope.top5Blk = $filter('orderBy')($scope.playerList, "blk", true).slice(0,5);
            $scope.top5fgPct = $filter('orderBy')($scope.playerList, "fgPct", true).slice(0,5);
        };
        
        $scope.allPlayers = function() {
            //$scope.teams.singleSelect = "ALL TEAMS";
            $scope.playerList = $filter('orderBy')(playersTeamFiltered, "pts", true);
            $scope.pagination.totalItems = $scope.playerList.length;
        };
        
        
        // search and filters
        
        $scope.setAllTeams = function() {
            $scope.teams.singleSelect = "ALL TEAMS";
            $scope.setTeam();
        };
        
        $scope.setPage = function(pageNo) {
            $scope.pagination.currentPage = pageNo;
        };
                
        $scope.changeSeason = function() {
            $("#spinner").show();
            $scope.getPlayerData($scope.season.singleSelect, $scope.seasonType.singleSelect);
        };
        
        $scope.setTeam = function() {
            if ($scope.teams.singleSelect == "ALL TEAMS") {
                $scope.playerList = allPlayers;
                playersTeamFiltered = allPlayers;
            }
            else {
                $scope.playerList = $filter('filter')(allPlayers, {teamAbbreviation: $scope.teams.singleSelect});
                playersTeamFiltered = $scope.playerList;
            }
            $scope.playerList = $filter('orderBy')($scope.playerList, "pts", true)
            $scope.pagination.totalItems = $scope.playerList.length;
            $scope.getTop5();
        };
        
        /*$scope.search = function(num) {
            var compare;
            if (num == 0) {compare = $scope.searchText.text;}
            if (num == 1) {compare = $scope.compare1.text;}
            if (num == 2) {compare = $scope.compare2.text;}
            $scope.searchResult = [];
            for (let p in allPlayers) {
                if (allPlayers[p].playerName.toUpperCase().includes(compare.toUpperCase())) {
                    $scope.searchResult.push(allPlayers[p]);
                }
            }
            $scope.playerList = $scope.searchResult;
            $scope.searchText.text = "";
            return $scope.playerList;
        };*/
        
        $scope.search = function(num) {
            var compare;
            if (num == 0) {compare = $scope.searchText.text;}
            if (num == 1) {compare = $scope.compare1.text;}
            if (num == 2) {compare = $scope.compare2.text;}
            $scope.playerList = $filter('filter')(playersTeamFiltered, {playerName: compare});
            $scope.pagination.totalItems = $scope.playerList.length;
            $scope.searchText.text = "";
            return $scope.playerList;
        }
        

        /*$scope.sort = function(stat) {
            $scope.playerList = allPlayers;
            $scope.playerList.sort(sortBy(stat));
        };*/
        
        function sortBy(stat) {
            return function(x, y) {
                return y[stat] - x[stat];
            }
        };
        
        $scope.sort = function(stat) {
            $scope.playerList = $filter('orderBy')($scope.playerList, stat, true);
        }
        
        // advanced calulations
        
        // finds out league and team averages for use in caluclating PER
        function calculateTotals() {
            leagueTotals.set("lgPTS", 0);
            leagueTotals.set("lgAST", 0);            
            leagueTotals.set("lgORB", 0);
            leagueTotals.set("lgTRB", 0);
            leagueTotals.set("lgTO", 0);
            leagueTotals.set("lgFGA", 0);
            leagueTotals.set("lgFG", 0);
            leagueTotals.set("lgFTA", 0);
            leagueTotals.set("lgFT", 0);
            leagueTotals.set("lg3PA", 0);
            leagueTotals.set("lgPF", 0);
            leagueTotals.set("lgMP", 0);
            leagueTotals.set("lgPOSS", 0);
            
            for (i=1;i<=30;i++) {
                teamTotals.set($scope.teams.options[i].team, 
                                 {tmPTS: 0, tmAST: 0, tmFG: 0, tmFGA: 0, tmFT: 0, tmFTA: 0, tm3PM: 0, tmORB: 0, tmDRB: 0, tmTOV: 0, tmMP: 0});
            }
            
            var teamInfo;
            for (i=0; i<allPlayers.length; i++) {
                leagueTotals.set("lgPTS", leagueTotals.get("lgPTS")+allPlayers[i].pts);
                leagueTotals.set("lgAST", leagueTotals.get("lgAST")+allPlayers[i].ast);
                leagueTotals.set("lgORB", leagueTotals.get("lgORB")+allPlayers[i].oreb);
                leagueTotals.set("lgTRB", leagueTotals.get("lgTRB")+allPlayers[i].reb);
                leagueTotals.set("lgTO", leagueTotals.get("lgTO")+allPlayers[i].tov);
                leagueTotals.set("lgFGA", leagueTotals.get("lgFGA")+allPlayers[i].fga);
                leagueTotals.set("lgFG", leagueTotals.get("lgFG")+allPlayers[i].fgm);
                leagueTotals.set("lgFTA", leagueTotals.get("lgFTA")+allPlayers[i].fta);
                leagueTotals.set("lgFT", leagueTotals.get("lgFT")+allPlayers[i].ftm);
                leagueTotals.set("lg3PA", leagueTotals.get("lg3PA")+allPlayers[i].fG3A);
                leagueTotals.set("lgPF", leagueTotals.get("lgPF")+allPlayers[i].pf);
                leagueTotals.set("lgMP", leagueTotals.get("lgMP")+allPlayers[i].min);
                leagueTotals.set("lgPOSS", leagueTotals.get("lgPOSS")+(0.96 * (allPlayers[i].fga + allPlayers[i].tov + 0.44 * allPlayers[i].fta - allPlayers[i].oreb)));
                
                teamInfo = teamTotals.get(allPlayers[i].teamAbbreviation);
                if (teamInfo == undefined) {
                    teamTotals.set(allPlayers[i].teamAbbreviation, {tmPTS: 0, tmAST: 0, tmFG: 0, tmFGA: 0, tmFT: 0, tmFTA: 0, tm3PM: 0, tmORB: 0, tmDRB: 0, tmTOV: 0, tmMP: 0});
                    teamInfo = teamTotals.get(allPlayers[i].teamAbbreviation)
                }
                teamInfo.tmPTS += allPlayers[i].pts;
                teamInfo.tmAST += allPlayers[i].ast;
                teamInfo.tmFG += allPlayers[i].fgm;
                teamInfo.tmFGA += allPlayers[i].fga;
                teamInfo.tmFT += allPlayers[i].ftm;
                teamInfo.tmFTA += allPlayers[i].fta;
                teamInfo.tm3PM += allPlayers[i].fG3M;
                teamInfo.tmORB += allPlayers[i].oreb;
                teamInfo.tmDRB += allPlayers[i].dreb;
                teamInfo.tmTOV += allPlayers[i].tov;
                teamInfo.tmMP += allPlayers[i].min;
            }
            
            factor = 2/3 - ((0.5 * leagueTotals.get("lgAST")/leagueTotals.get("lgFG")) / (2 * leagueTotals.get("lgFG")/leagueTotals.get("lgFT")));
            
            VOP = leagueTotals.get("lgPTS")/((leagueTotals.get("lgFGA") - leagueTotals.get("lgORB") + leagueTotals.get("lgTO") + 0.44 * leagueTotals.get("lgFTA")));
            
            DRBP = (leagueTotals.get("lgTRB") - leagueTotals.get("lgORB")) / leagueTotals.get("lgTRB");
            
            var tmPOSS;
            for (var key of teamTotals.keys()) {
                teamInfo = teamTotals.get(key);
                //tmPOSS = teamInfo.tmFGA + 0.4 * teamInfo.tmFTA - 1.07 * (teamInfo.tmFGA - teamInfo.tmFG) + teamInfo.tmTOV;
                tmPOSS = 0.96 * (teamInfo.tmFGA + teamInfo.tmTOV + 0.44 * teamInfo.tmFTA - teamInfo.tmORB);
                teamInfo.tmPace = 48 * (tmPOSS/ (teamInfo.tmMP / 5));
                //teamInfo.tmPace = (240/(teamInfo.tmMP))*tmPOSS
            }
            
            //var lgPOSS = leagueTotals.get("lgFGA") + 0.4 * leagueTotals.get("lgFTA") - 1.07 * (leagueTotals.get("lgFGA") - leagueTotals.get("lgFG")) + leagueTotals.get("lgTO");
            var lgPOSS = 0.96 * (leagueTotals.get("lgFGA") + leagueTotals.get("lgTO") + 0.44 * leagueTotals.get("lgFTA") - leagueTotals.get("lgORB"))
            leagueTotals.set("lgPace", 48 * (lgPOSS / (leagueTotals.get("lgMP") / 5)));
            
        };
        
        $scope.calculateAdvanced = function() {
            $scope.advanced = true;
            calculateTotals();
            var player;
            var uPER;
            var lgFT = leagueTotals.get("lgFT");
            var lgPF = leagueTotals.get("lgPF");
            var lgFTA = leagueTotals.get("lgFTA");
            for (i=0; i<allPlayers.length; i++) {
                player = allPlayers[i];
                team = teamTotals.get(player.teamAbbreviation);
                uPER = (1/player.min) * (player.fG3M + ((2/3) * player.ast) + ((2 - factor * (team.tmAST/team.tmFG)) * player.fgm) + (0.5 * player.ftm * (1 + (1 - (team.tmAST/team.tmFG)) + (2/3) * (team.tmAST/team.tmFG))) - (VOP * player.tov) - (VOP * DRBP * (player.fga - player.fgm)) - (VOP * 0.44 * (0.44 + (0.56 * DRBP)) * (player.fta - player.ftm)) + (VOP * (1 - DRBP) * (player.reb - player.oreb)) + (VOP * DRBP * player.oreb) + (VOP * player.stl) + (VOP * DRBP * player.blk) - (player.pf * ((lgFT/lgPF) - 0.44 * (lgFTA/lgPF) * VOP)));
                    
                player.PER = (uPER * (leagueTotals.get("lgPace")/team.tmPace)) * (15/0.3);
                allPlayers[i].PER = Math.round(player.PER * 10)/10;
                    
                effectiveFieldGoal(player);
                trueShooting(player);
                assistPercentage(player, team);
                reboundPercentage(player, team);
                blockPercentage(player, team);
                stealPercentage(player, team);
                usagePercentage(player, team);
            }
            $scope.playerList = $filter('orderBy')(allPlayers, "pts", true);
            $scope.pagination.totalItems = $scope.playerList.length;
        }
        
        // totals more accurate (currently using per game)
        
        function assistPercentage(player, team) {
            var astPct = 100 * player.ast / (((player.min / (team.tmMP / 5)) * team.tmFG) - player.fgm);
            player.astPct = Math.round(astPct * 10)/10;
        }
        
        function reboundPercentage(player, team) {
            var rebPct = 100 * (player.reb * (team.tmMP / 5)) / (player.min * ((team.tmORB + team.tmDRB)+leagueTotals.get("lgTRB")/30));
            player.rebPct = Math.round(rebPct * 10)/10;
        }
        
        function blockPercentage(player, team) {
            var blkPct = 100 * (player.blk * (team.tmMP / 5)) / (player.min * (leagueTotals.get("lgFGA")/30 - leagueTotals.get("lg3PA")/30));
            player.blkPct = Math.round(blkPct * 10)/10;
        }
        
        function stealPercentage(player, team) {
            var stlPct = 100 * (player.stl * (team.tmMP / 5)) / (player.min * leagueTotals.get("lgPOSS")/30);
            player.stlPct = Math.round(stlPct * 10)/10;
        }
        
        function usagePercentage(player, team) {
            var usgPct = 100 * ((player.fga + 0.44 * player.fta + player.tov) * (team.tmMP/5)) / (player.min * (team.tmFGA + 0.44 * team.tmFTA + team.tmTOV));
            player.usgPct = Math.round(usgPct * 10)/10;
        }
        
        function effectiveFieldGoal(player) {
            var efg = (player.fgm + (0.5 * player.fG3M)) / player.fga;
            player.efg = Math.round(efg * 100) / 100;
        }
        
        function trueShooting(player) {
            var tsa = player.fga + 0.44 * player.fta;
            var ts = player.pts / (2 * tsa);
            player.ts = Math.round(ts * 1000) / 1000;
        }
        
        $scope.winShares = function(player) {
            var team = teamTotals.get(player.teamAbbreviation);
            var offPoss = 0.96 * (player.fga + player.tov + 0.44 * player.fta - player.oreb);
            var qAst = ((player.min / (team.tmMP / 5)) * (1.14 * ((team.tmAST - player.ast) / player.fgm))) + ((((team.tmAST / team.tmMP) * player.min * 5 - player.ast) / ((team.tmFG / team.tmMP) * player.min * 5 - player.fgm)) * (1 - (player.min / (team.tmMP / 5))));
            var teamScoringPoss = team.tmFG + (1 - Math.pow((1 - (team.tmFT / team.tmFTA)), 2)) * team.tmFTA * 0.4;       
            var teamPlayPct = teamScoringPoss / (team.tmFGA + team.tmFTA * 0.4 + team.tmTOV);
            var teamORBPct = team.tmORB / (team.tmORB + team.tmDRB);
            var teamORBWeight = ((1 - teamORBPct) * teamPlayPct) / ((1 - teamORBPct) * teamPlayPct + teamORBPct * (1 - teamPlayPct));
            
            var ptsProducedFG = 2 * (player.fgm + 0.5 * player.fG3M) * (1 - 0.5 * ((player.pts - player.ftm) / (2 * player.fga)) * qAst);
            var ptsProducedAST = 2 * ((team.tmFG - player.fgm + 0.5 * (team.tm3PM - player.fG3M)) / (team.tmFG - player.fgm)) * 0.5 * (((team.tmPTS - team.tmFT) - (player.pts - player.ftm)) / (2 * (team.tmFGA - player.fga))) * player.ast;
            var ptsProducedORB = player.oreb * teamORBWeight * teamPlayPct * (team.tmPTS / (team.tmFG + (1 - Math.pow((1 - (team.tmFT / team.tmFTA)), 2)) * 0.4 * team.tmFTA));
            
            var ptsProd = (ptsProducedFG + ptsProducedAST + player.ftm) * (1 - (team.tmORB / teamScoringPoss) * teamORBWeight * teamPlayPct) + ptsProducedORB;
            console.log(ptsProducedFG + " | " + ptsProducedAST + " | " + ptsProducedORB + " | " + teamPlayPct);
            console.log(ptsProd * player.gp);
                                                                           
            var marginalOff = (ptsProd * player.gp) - 0.92 * (leagueTotals.get("lgPTS")/leagueTotals.get("lgPOSS")) * (offPoss * player.gp);
            var marginalPtsPerWin = 0.32 * 100 * (teamTotals.get(player.teamAbbreviation).tmPace / leagueTotals.get("lgPace"));
            var oWinShares = marginalOff / marginalPtsPerWin;
            console.log(marginalOff + " | " + marginalPtsPerWin + " | " + oWinShares);
        }
        
        
        // player comparisons
        
        // selectedPlayer not updating in cntl so pass player from view instead
        $scope.updateData = function(player, num) {
            if (player != undefined) {
                $scope.data[num] = [player.pts, player.reb, player.ast, player.stl, player.blk, player.tov];
                $scope.data2[num] = [player.fgPct, player.fg3Pct, player.ftPct];
            }
            else {
                $scope.data[num] = [0, 0, 0, 0, 0, 0];
                $scope.data2[num] = [0, 0, 0];
            }
        }
        
        $scope.colors = [{backgroundColor:'rgba(255, 99, 132, 0.3)'},
                         {backgroundColor:'rgba(54, 162, 235, 0.3)'}];
        
        $scope.labels = ["Points", "Rebounds", "Assists", "Steals", "Blocks", "Turnovers"];
        $scope.labels2 = ["Field Goal", "3 Point", "Free Throw"];
        $scope.data = [
                [0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0]       
                ];
        $scope.data2 = [
                [0, 0, 0],
                [0, 0, 0]       
                ];
        
        $scope.options = {
            animation: {
              //onProgress: drawBarValues,
              onComplete: drawBarValues
            },
            hover: { animationDuration: 0 },
            tooltips: {
                enabled: false
            },
            scales: {
                xAxes: [{
                    gridLines: {drawOnChartArea: false},
                    ticks: {beginAtZero: true}
                }],
                yAxes: [{
                    gridLines: {drawOnChartArea: false},
                    ticks: {beginAtZero: true}
                }]
            }
        };
        
        function drawBarValues() {
          // render the value of the chart beside the bar
          var ctx = this.chart.ctx;
          ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, 'normal', Chart.defaults.global.defaultFontFamily);
          ctx.fillStyle = this.chart.config.options.defaultFontColor;
          ctx.textAlign = 'bottom';
          ctx.textBaseline = 'center';
          this.data.datasets.forEach(function (dataset) {
            for (var i = 0; i < dataset.data.length; i++) {
              if(dataset.hidden === true && dataset._meta[Object.keys(dataset._meta)[0]].hidden !== false){ continue; }
              var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model;
              if(dataset.data[i] !== null){
                ctx.fillText(dataset.data[i], model.x + 5, model.y + 3);
              }
            }
          });
        }
  
  
    });
    // end of controller
    
    
    module.filter('startFrom', function() {
        return function(input, start) {
            start = +start; //parse to int
            return input.slice(start);
        }
    });
    
        /*
        nba.stats.playerStats().then(function(data) {
            console.log(data.leagueDashPlayerStats);
            $scope.playerList = data.leagueDashPlayerStats;
            //data.leagueDashPlayerStats;
            alert($scope.playerList);
            //alert(JSON.stringify(data.leagueDashPlayerStats));
        });//playerInfo("203112");*/
    
    
        // service to retrieve player stats
    
        module.factory('nbaService', function($q) {
           var nba = require('nba');
           var getPlayerList = function(season, seasonType, perMode, callbackFn) {
               var defer = $q.defer();
               nba.stats.playerStats({Season: season, SeasonType: seasonType, PerMode: perMode}).then(function(data) {
               //nba.stats.homepageV2().then(function(data) {
                   defer.resolve(data);
               });
               return defer.promise;
           };
            
            /*var getPlayerList = function(season, seasonType, perMode, callbackFn) {
               var defer = $q.defer();
               nba.stats.teamInfoCommon({TeamID:1610612739}).then(function(data) {
               //nba.stats.homepageV2().then(function(data) {
                   defer.resolve(data);
               });
               return defer.promise;
           };*/
            
            return {
                getPlayerList : getPlayerList
            }
        });
    
})