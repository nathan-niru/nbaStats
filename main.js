$(document).ready(function() {
    
    
    var module = angular.module('nbaStats', ["ngRoute", "chart.js", 'ngAnimate', 'ngSanitize', "ui.bootstrap", "ngMaterial"]);
    
    
    // header for tabs and filters
    module.directive('header', function () {
        return {
            restrict: 'A',
            replace: true,
            scope: false,
            templateUrl: 'templates/header.html',
            controller: 'headerController'
        }
    });
    
    module.controller('headerController', function headerController($scope, nbaService, $filter) {
        $scope.season = {
            singleSelect: nbaService.season,
            options: [
                {year: "2016-17"}, {year: "2015-16"}, {year: "2014-15"}, {year: "2013-14"},
                {year: "2012-13"}, {year: "2011-12"}, {year: "2010-11"}, {year: "2009-10"},
                {year: "2008-09"}, {year: "2007-08"}, {year: "2006-07"}, {year: "2005-06"},
                {year: "2004-05"}, {year: "2003-04"}, {year: "2002-03"}, {year: "2001-02"},
                {year: "2000-01"}, {year: "1999-00"}
            ]
        };
        $scope.teams = {
            singleSelect: nbaService.team,
            options: [
                {team: "ALL TEAMS"},
                {team: "ATL"}, {team: "BKN"}, {team: "BOS"}, {team: "CHA"}, {team: "CHI"}, {team: "CLE"}, 
                {team: "DAL"}, {team: "DEN"}, {team: "DET"}, {team: "GSW"}, {team: "HOU"}, {team: "IND"},
                {team: "LAC"}, {team: "LAL"}, {team: "MEM"}, {team: "MIA"}, {team: "MIL"}, {team: "MIN"},
                {team: "NOP"}, {team: "NYK"}, {team: "OKC"}, {team: "ORL"}, {team: "PHI"}, {team: "PHX"},
                {team: "POR"}, {team: "SAC"}, {team: "SAS"}, {team: "TOR"}, {team: "UTA"}, {team: "WAS"}
            ]
        };
        $scope.seasonType = {
            singleSelect: nbaService.seasonType,
            options: [
                {type: "Regular Season"}, 
                {type: "Playoffs"}]
        };
        
        $scope.changeSeason = function() {
            $("#spinner").show();
            nbaService.getPlayerList($scope.season.singleSelect, $scope.seasonType.singleSelect, "PerGame").then(function(data) {
                $scope.setTeam();
                $("#spinner").hide();
            });
        };
        
        $scope.setTeam = function() {
            if ($scope.teams.singleSelect == "ALL TEAMS") {
                $scope.$parent.playerList = nbaService.allPlayers;
                nbaService.playersTeamFiltered = nbaService.allPlayers;
            }
            else {
                $scope.$parent.playerList = $filter('filter')(nbaService.allPlayers, {teamAbbreviation: $scope.teams.singleSelect});
                nbaService.playersTeamFiltered = $scope.$parent.playerList;
            }
            nbaService.team = $scope.teams.singleSelect;
            $scope.$parent.playerList = $filter('orderBy')($scope.$parent.playerList, "pts", true)
            $(".statHeader").css("color", "black");
        };
        
        $scope.allPlayers = function() {
            $scope.$parent.playerList = $filter('orderBy')(nbaService.playersTeamFiltered, "pts", true);
            nbaService.sortBy = "";
            $(".statHeader").css("color", "black");
        };
        
    });
    
    
    // routing
    module.config(function($routeProvider) {
        $routeProvider
        .when("/", {
            templateUrl : "templates/stats.html",
        })
        .when("/leaders", {
             templateUrl : "templates/leaders.html"
        })
        .when("/compare", {
             templateUrl : "templates/compare.html"
        })
        .when("/advanced", {
             templateUrl : "templates/advanced.html"
        });
    });
    
    
    module.controller('nbaStatsController', function nbaStatsController($scope, nbaService, $filter, $route) {
            
        $scope.playerList = [];
        $scope.searchText = {};
        $scope.searchResult = [];
        
        $scope.pagination = {
            currentPage: 1,
            itemsPerPage: 25,
            maxSize: 5,
            totalItems: 0
        };
                
        
        // retrieve data
        function getPlayerData(season, seasonType) {
            $("#spinner").show();
            nbaService.getPlayerList(season, seasonType, "PerGame").then(function(playerList) {
                $scope.playerList = $filter('orderBy')(nbaService.allPlayers, nbaService.sortBy, true);
                $("#spinner").hide();
                console.log($scope.playerList);
            });
        };
        
        // get current season players if first time on page, otherwise use previous data
        if (nbaService.playersTeamFiltered.length == 0) {
            getPlayerData(nbaService.season, nbaService.seasonType);
        }
        else if (nbaService.sortBy == "") {
            $scope.playerList = $filter('orderBy')(nbaService.playersTeamFiltered, "pts", true);
        }
        else {
            $scope.playerList = $filter('orderBy')(nbaService.playersTeamFiltered, nbaService.sortBy, true);
            highlightHeader(nbaService.sortBy);
        }
        
        $scope.$watch("playerList", function(newValue, oldValue) {
            $scope.pagination.totalItems = $scope.playerList.length;
        });
        
        $scope.allPlayers = function() {
            $scope.playerList = $filter('orderBy')(nbaService.playersTeamFiltered, "pts", true);
            nbaService.sortBy = "pts";
            $(".statHeader").css("color", "black");
        };
        
                
        $scope.setAllTeams = function() {
            $scope.teams.singleSelect = "ALL TEAMS";
            $scope.setTeam();
        };
        
        $scope.setPage = function(pageNo) {
            $scope.pagination.currentPage = pageNo;
        };
                
        
        $scope.search = function() {
            $scope.playerList = $filter('filter')(nbaService.playersTeamFiltered, {playerName: $scope.searchText.text});
            $scope.pagination.totalItems = $scope.playerList.length;
            $scope.searchText.text = "";
            return $scope.playerList;
        };
        
        $scope.sort = function(stat) {
            $scope.playerList = $filter('orderBy')($scope.playerList, stat, true);
            nbaService.sortBy = stat;
            highlightHeader(stat);
        };
        
        function highlightHeader(stat) {
            $(".statHeader").css("color", "black");
            $("#"+stat).css("color", "red");
        }
  
  
    });
    // end of stats controller
    
    
    module.controller('leadersController', function leadersController($scope, nbaService, $filter, $route) {
        
        // TODO filter players with less than x games (primarily for fg%, also add 3p and ft %s)
        function updateLeaders() {
            nbaService.setLeaders();
            $scope.top5Pts = nbaService.leaders.pts;
            $scope.top5Reb = nbaService.leaders.reb;
            $scope.top5Ast = nbaService.leaders.ast;
            $scope.top5Stl = nbaService.leaders.stl;
            $scope.top5Blk = nbaService.leaders.blk;
            $scope.top5fgPct = nbaService.leaders.fgPct;
        }
        
        function getPlayerData() {
            nbaService.getPlayerList(nbaService.season, nbaService.seasonType, "PerGame").then(function(playarList) {
                $scope.playerList = nbaService.allPlayers;
            });
        }
        
        $scope.sort = function(stat) {
            nbaService.sortBy = stat;
        };
        
        // update leaders when filters in header change player list
        $scope.$watch("playerList", function(newValue, oldValue){
            updateLeaders();
        });
        
        if (nbaService.playersTeamFiltered.length == 0) {
            getPlayerData();
        }
        else {
            $scope.playerList = nbaService.playersTeamFiltered;
        }
        
    });
    
    
    module.controller('compareController', function leadersController($scope, nbaService, $filter, $route) {
        
        $scope.playerList = [];
        
        $scope.compare1 = {};
        $scope.compare2 = {};
        
        $scope.selectedPlayer1 = {};
        $scope.selectedPlayer2 = {};
        
        function getPlayerData() {
            nbaService.getPlayerList(nbaService.season, nbaService.seasonType, "PerGame").then(function(playarList) {
                $scope.playerList = nbaService.allPlayers;
            });
        }
        
        $scope.search = function(num) {
            var compare;
            if (num == 1) {compare = $scope.compare1.text;}
            if (num == 2) {compare = $scope.compare2.text;}
            $scope.playerList = $filter('filter')(nbaService.playersTeamFiltered, {playerName: compare});
            return $scope.playerList;
        }
        
        
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
        
        
        if (nbaService.playersTeamFiltered.length == 0) {
            getPlayerData();
        }
        else {
            $scope.playerList = nbaService.playersTeamFiltered;
        }
        
    });
    
    
    module.controller('advancedController', function leadersController($scope, nbaService, $filter, $route) {
        
        // variables
        $scope.playerList = [];
        $scope.searchText = {};
        $scope.searchResult = [];
        
        $scope.pagination = {
            currentPage: 1,
            itemsPerPage: 25,
            maxSize: 5,
            totalItems: 0
        };
        
        $scope.desc = {
            PER : "Sums a players positive accomplishements and subtracts the negative accomplishments, and returns a per minute rating of a player's performance.",
            EFG : "Adjusts Field Goal % for the fact that 3-point field goals are worth one more point that 2-point field goals.",
            TS : "Measures shooting effeciency while taking into account field goals, 3-point field goals and free throws.",
            Ast : "Percentage of teammate field goals a player assisted while he was on the floor.",
            Reb : "Percentage of available rebound a player grabbed while he was on the floor.",
            Stl : "Percentage of opponent possessions that end with a steal by the player while he was on the floor.",
            Blk : "Percentage of opponent two-point field goal attempts blocked by the player while he was on the floor.",
            Usg : "Percentage of team plays used by a player while he was on the floor.",
            BPM : "Estimate of points per 100 possessions that a player contributed above a league-average player, translated to an average team.",
            VORP : "Estimate of the points per 100 team possessions that a player contributed above a replacement level (-2.0) player, translated to an average team over a 82 game season. Multiply be 2.70 to convert to wins over replacement."
        }
        
        
        // retrieve data
        function getPlayerData(season, seasonType) {
            $("#spinner").show();
            nbaService.getPlayerList(season, seasonType, "PerGame").then(function(playerList) {
                $scope.playerList = $filter('orderBy')(nbaService.allPlayers, "pts", true);
                console.log($scope.playerList);
                $("#spinner").hide();
            });
        };
        
        // get current season players if first time on page, otherwise use previous data
        if (nbaService.playersTeamFiltered.length == 0) {
            getPlayerData(nbaService.season, nbaService.seasonType);
        }
        else if (nbaService.sortBy == "") {
            $scope.playerList = $filter('orderBy')(nbaService.playersTeamFiltered, "pts", true);
        }
        else {
            $scope.playerList = $filter('orderBy')(nbaService.playersTeamFiltered, nbaService.sortBy, true);
        }
        
        
        $scope.$watch("playerList", function(newValue, oldValue) {
            $scope.pagination.totalItems = $scope.playerList.length;
            nbaService.calculateAdvanced();
        });
        
        $scope.allPlayers = function() {
            $scope.playerList = $filter('orderBy')(nbaService.playersTeamFiltered, "pts", true);
            //nbaService.sortBy = "pts";
        };
        
        $scope.setPage = function(pageNo) {
            $scope.pagination.currentPage = pageNo;
        };
                
        $scope.search = function() {
            $scope.playerList = $filter('filter')(nbaService.playersTeamFiltered, {playerName: $scope.searchText.text});
            $scope.pagination.totalItems = $scope.playerList.length;
            $scope.searchText.text = "";
            return $scope.playerList;
        };
        
        $scope.sort = function(stat) {
            $scope.playerList = $filter('orderBy')($scope.playerList, stat, true);
            nbaService.sortBy = stat;
            highlightHeader(stat);
        };
        
        function highlightHeader(stat) {
            $(".statHeader").css("color", "black");
            $("#"+stat).css("color", "red");
        }
        
        $scope.toggleDesc = function() {
            $("#advancedDesc").toggle();
        };
        
        $scope.winShares = function(player) {
            nbaService.boxPlusMinus(player);
        };
        
        
    });


    
    
    module.filter('startFrom', function() {
        return function(input, start) {
            start = +start; //parse to int
            return input.slice(start);
        }
    });
    
    
    // service to retrieve player stats
    
    module.factory('nbaService', function($q, $filter) {
        var nba = require('nba');
            
        var nbaService = {
            allPlayers : [],
            playersTeamFiltered : [],
            leaders : {},
            season: "2016-17",
            seasonType: "Regular Season",
            team: "ALL TEAMS",
            sortBy: "pts",
            VOP: undefined,
            factor: undefined,
            DRBP: undefined,
            leagueTotals: undefined,
            teamTotals: undefined,
            teamNames: [{team: "ATL"}, {team: "BKN"}, {team: "BOS"}, {team: "CHA"}, {team: "CHI"}, {team: "CLE"}, 
                {team: "DAL"}, {team: "DEN"}, {team: "DET"}, {team: "GSW"}, {team: "HOU"}, {team: "IND"},
                {team: "LAC"}, {team: "LAL"}, {team: "MEM"}, {team: "MIA"}, {team: "MIL"}, {team: "MIN"},
                {team: "NOP"}, {team: "NYK"}, {team: "OKC"}, {team: "ORL"}, {team: "PHI"}, {team: "PHX"},
                {team: "POR"}, {team: "SAC"}, {team: "SAS"}, {team: "TOR"}, {team: "UTA"}, {team: "WAS"}],

            getPlayerList : function(season, seasonType, perMode, callbackFn) {
                var defer = $q.defer();
                nba.stats.playerStats({Season: season, SeasonType: seasonType, PerMode: perMode}).then(function(data) {
                    defer.resolve(data);
                    nbaService.allPlayers = data.leagueDashPlayerStats;
                    nbaService.allPlayers = $filter('orderBy')(nbaService.allPlayers, "pts", true);
                    nbaService.playersTeamFiltered = nbaService.allPlayers;
                    nbaService.season = season;
                    nbaService.seasonType = seasonType;
                });
                return defer.promise;
            },
                
            setLeaders : function() {
                this.leaders = {
                    pts : $filter('orderBy')(this.playersTeamFiltered, "pts", true).slice(0,5),
                    reb : $filter('orderBy')(this.playersTeamFiltered, "reb", true).slice(0,5),
                    ast : $filter('orderBy')(this.playersTeamFiltered, "ast", true).slice(0,5),
                    stl : $filter('orderBy')(this.playersTeamFiltered, "stl", true).slice(0,5),
                    blk : $filter('orderBy')(this.playersTeamFiltered, "blk", true).slice(0,5),
                    fgPct : $filter('orderBy')(this.playersTeamFiltered, "fgPct", true).slice(0,5)
                };
            },
            
            // finds out league and team averages for use in caluclating advanced stats
            calculateTotals : function() {
                var leagueTotals = new Map();
                var teamTotals = new Map();
                var allPlayers = nbaService.allPlayers;
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

                for (i=0;i<30;i++) {
                    teamTotals.set(this.teamNames[i].team, 
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

                nbaService.factor = 2/3 - ((0.5 * leagueTotals.get("lgAST")/leagueTotals.get("lgFG")) / (2 * leagueTotals.get("lgFG")/leagueTotals.get("lgFT")));

                nbaService.VOP = leagueTotals.get("lgPTS")/((leagueTotals.get("lgFGA") - leagueTotals.get("lgORB") + leagueTotals.get("lgTO") + 0.44 * leagueTotals.get("lgFTA")));

                nbaService.DRBP = (leagueTotals.get("lgTRB") - leagueTotals.get("lgORB")) / leagueTotals.get("lgTRB");

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
                
                this.leagueTotals = leagueTotals;
                this.teamTotals = teamTotals;
            },
            
            assistPercentage : function(player, team) {
                var astPct = 100 * player.ast / (((player.min / (team.tmMP / 5)) * team.tmFG) - player.fgm);
                player.astPct = Math.round(astPct * 10)/10;
            },

            reboundPercentage : function(player, team) {
                var rebPct = 100 * (player.reb * (team.tmMP / 5)) / (player.min * ((team.tmORB + team.tmDRB)+nbaService.leagueTotals.get("lgTRB")/30));
                player.rebPct = Math.round(rebPct * 10)/10;
            },

            blockPercentage : function(player, team) {
                var blkPct = 100 * (player.blk * (team.tmMP / 5)) / (player.min * (nbaService.leagueTotals.get("lgFGA")/30 - nbaService.leagueTotals.get("lg3PA")/30));
                player.blkPct = Math.round(blkPct * 10)/10;
            },

            stealPercentage : function(player, team) {
                var stlPct = 100 * (player.stl * (team.tmMP / 5)) / (player.min * nbaService.leagueTotals.get("lgPOSS")/30);
                player.stlPct = Math.round(stlPct * 10)/10;
            },

            usagePercentage : function(player, team) {
                var usgPct = 100 * ((player.fga + 0.44 * player.fta + player.tov) * (team.tmMP/5)) / (player.min * (team.tmFGA + 0.44 * team.tmFTA + team.tmTOV));
                player.usgPct = Math.round(usgPct * 10)/10;
            },

            effectiveFieldGoal : function(player) {
                var efg = (player.fgm + (0.5 * player.fG3M)) / player.fga;
                player.efg = Math.round(efg * 100) / 100;
            },

            trueShooting : function(player) {
                var tsa = player.fga + 0.44 * player.fta;
                var ts = player.pts / (2 * tsa);
                player.ts = Math.round(ts * 1000) / 1000;
            },
            
            calculateAdvanced : function() {
                nbaService.calculateTotals();
                var player;
                var uPER;
                var lgFT = nbaService.leagueTotals.get("lgFT");
                var lgPF = nbaService.leagueTotals.get("lgPF");
                var lgFTA = nbaService.leagueTotals.get("lgFTA");
                var VOP = nbaService.VOP;
                var DRBP = nbaService.DRBP;
                var factor = nbaService.factor;
                for (i=0; i<nbaService.allPlayers.length; i++) {
                    player = nbaService.allPlayers[i];
                    team = nbaService.teamTotals.get(player.teamAbbreviation);
                    uPER = (1/player.min) * (player.fG3M + ((2/3) * player.ast) + ((2 - factor * (team.tmAST/team.tmFG)) * player.fgm) + (0.5 * player.ftm * (1 + (1 - (team.tmAST/team.tmFG)) + (2/3) * (team.tmAST/team.tmFG))) - (VOP * player.tov) - (VOP * DRBP * (player.fga - player.fgm)) - (VOP * 0.44 * (0.44 + (0.56 * DRBP)) * (player.fta - player.ftm)) + (VOP * (1 - DRBP) * (player.reb - player.oreb)) + (VOP * DRBP * player.oreb) + (VOP * player.stl) + (VOP * DRBP * player.blk) - (player.pf * ((lgFT/lgPF) - 0.44 * (lgFTA/lgPF) * VOP)));

                    player.PER = (uPER * (nbaService.leagueTotals.get("lgPace")/team.tmPace)) * (15/0.3);
                    nbaService.allPlayers[i].PER = Math.round(player.PER * 10)/10;

                    nbaService.effectiveFieldGoal(player);
                    nbaService.trueShooting(player);
                    nbaService.assistPercentage(player, team);
                    nbaService.reboundPercentage(player, team);
                    nbaService.blockPercentage(player, team);
                    nbaService.stealPercentage(player, team);
                    nbaService.usagePercentage(player, team);
                    nbaService.offensiveRating(player, team);
                    nbaService.boxPlusMinus(player, team);
                    
                }
            },
            
            // TODO add team adjustment for bpm and team games for vorp
            boxPlusMinus : function(player, team) {
                var tovPct = 100 * (player.tov * (team.tmMP / 5)) / (player.min * nbaService.leagueTotals.get("lgPOSS")/30);
                var oRebPct = 100 * (player.oreb * (team.tmMP / 5)) / (player.min * (team.tmORB+nbaService.leagueTotals.get("lgORB")/30));
                var dRebPct = 100 * (player.dreb * (team.tmMP / 5)) / (player.min * (team.tmDRB+((nbaService.leagueTotals.get("lgTRB")-nbaService.leagueTotals.get("lgORB"))/30)));
                var teamTsa = team.tmFGA + 0.44 * team.tmFTA;
                var teamTS = team.tmPTS / (2 * teamTsa);
                
                var regMPG = (player.min*player.gp)/(player.gp + 4);
                var rawBPM = (0.123391*regMPG) * (0.119597*oRebPct) + (-0.151287*dRebPct) + (1.255644*player.stlPct) + (0.531838*player.blkPct) + (-0.305868*player.astPct) - (0.921292 * player.usgPct * tovPct/100) + 0.711217 * player.usgPct * (1 - tovPct/100) * (2 * (player.ts - teamTS) + 0.017022*player.astPct + 0.297639*((player.fG3A/player.fga) - (nbaService.leagueTotals.get("lg3PA")/nbaService.leagueTotals.get("lgFGA"))) - 0.213485) + 0.725930*Math.sqrt(player.astPct + player.rebPct);
                
                
                player.bpm = Math.round(rawBPM * 10)/10;
                
                var vorp = (rawBPM - (-2.0)) * (player.min/48) * (player.gp/82);
                player.vorp = Math.round(vorp * 10)/10;
                
                //console.log(rawBPM);
            },
            
            // currently using simplified calculations of pts produced and possessions; need to fix
            offensiveRating : function(player, team) {
                var offPoss = 0.96 * (player.fga + player.tov + 0.44 * player.fta - player.oreb);
                var ptsProdShort = ((1.45 * player.fgm) + (2.2 * player.fG3M) + player.ftm + (0.6 * player.oreb) + (0.6 * player.ast));
                var oRtg = 100 * (ptsProdShort / offPoss);
                player.oRtg = Math.round(oRtg * 10)/10;
                
                var marginalOff = (ptsProdShort * player.gp) - 0.92 * (this.leagueTotals.get("lgPTS")/this.leagueTotals.get("lgPOSS")) * (offPoss * player.gp);
                var marginalPtsPerWin = 0.32 * 100 * (this.teamTotals.get(player.teamAbbreviation).tmPace / this.leagueTotals.get("lgPace"));
                player.oWinShares = marginalOff / marginalPtsPerWin;
            },
            
            winShares : function(player) {
                var team = this.teamTotals.get(player.teamAbbreviation);
                var offPoss = 0.96 * (player.fga + player.tov + 0.44 * player.fta - player.oreb);
                var ptsProdShort = ((1.45 * player.fgm) + (2.2 * player.fG3M) + player.ftm + (0.6 * player.oreb) + (0.6 * player.ast));
                console.log(ptsProdShort + " | " + offPoss + " || " + (100 * (ptsProdShort / offPoss)));
                
                
                var qAst = ((player.min / (team.tmMP / 5)) * (1.14 * ((team.tmAST - player.ast) / player.fgm))) + ((((team.tmAST / team.tmMP) * player.min * 5 - player.ast) / ((team.tmFG / team.tmMP) * player.min * 5 - player.fgm)) * (1 - (player.min / (team.tmMP / 5))));
                var teamScoringPoss = team.tmFG + (1 - Math.pow((1 - (team.tmFT / team.tmFTA)), 2)) * team.tmFTA * 0.4; 
                
                var teamPlayPct = teamScoringPoss / (team.tmFGA + team.tmFTA * 0.4 + team.tmTOV);
                var teamORBPct = team.tmORB / (team.tmORB + ((this.leagueTotals.get("lgTRB") - this.leagueTotals.get("lgORB"))/30));
                var teamORBWeight = ((1 - teamORBPct) * teamPlayPct) / ((1 - teamORBPct) * teamPlayPct + teamORBPct * (1 - teamPlayPct));

                var ptsProducedFG = 2 * (player.fgm + 0.5 * player.fG3M) * (1 - 0.5 * ((player.pts - player.ftm) / (2 * player.fga)) * qAst);
                var ptsProducedAST = 2 * ((team.tmFG - player.fgm + 0.5 * (team.tm3PM - player.fG3M)) / (team.tmFG - player.fgm)) * 0.5 * (((team.tmPTS - team.tmFT) - (player.pts - player.ftm)) / (2 * (team.tmFGA - player.fga))) * player.ast;
                var ptsProducedORB = player.oreb * teamORBWeight * teamPlayPct * (team.tmPTS / (team.tmFG + (1 - Math.pow((1 - (team.tmFT / team.tmFTA)), 2)) * 0.4 * team.tmFTA));

                var ptsProd = (ptsProducedFG + ptsProducedAST + player.ftm) * (1 - (team.tmORB / teamScoringPoss) * teamORBWeight * teamPlayPct) + ptsProducedORB;
                
                var fgPart = player.fgm * (1 - 0.5 * ((player.pts - player.ftm) / (2 * player.fga)) * qAst);
                var astPart = 0.5 * (((team.tmPTS - team.tmFT) - (player.pts - player.ftm)) / (2 * (team.tmFGA - player.fga))) * player.ast;
                var ftPart = (1 - Math.pow((1 - (player.ftm/player.fta)), 2)) * 0.4 * player.fta;
                var orbPart = player.oreb * teamORBWeight * teamPlayPct;
                var scPoss = (fgPart + astPart + ftPart) * (1 - (team.tmORB / teamScoringPoss) * teamORBWeight * teamPlayPct) + orbPart;
                var fgxPoss = (player.fga - player.fgm) * (1 - 1.07 * teamORBPct);
                var ftxPoss = (Math.pow((1 - (player.ftm / player.fta)), 2)) * 0.4 * player.fta;
                var totPoss = scPoss + fgxPoss + ftxPoss + player.tov;
                
                console.log(ptsProducedFG + " | " + ptsProducedAST + " | " + ptsProducedORB + " | " + teamPlayPct);
                console.log(ptsProd + " : " + totPoss + " :: " + 100 * (ptsProd/totPoss));
                

                var marginalOff = (ptsProdShort * player.gp) - 0.92 * (this.leagueTotals.get("lgPTS")/this.leagueTotals.get("lgPOSS")) * (offPoss * player.gp);
                var marginalPtsPerWin = 0.32 * 100 * (this.teamTotals.get(player.teamAbbreviation).tmPace / this.leagueTotals.get("lgPace"));
                var oWinShares = marginalOff / marginalPtsPerWin;
                console.log(marginalOff + " | " + marginalPtsPerWin + " | " + oWinShares);
        }
                
            
        };
        
        return nbaService;
    });
    
})