$(document).ready(function() {
    
    /*
    
    $.ajax({
  type:'GET',
  url: "http://stats.nba.com/stats/commonallplayers/?LeagueID=00&Season=2012-13&IsOnlyCurrentSeason=0&callback=playerinfocallback",
  data: {},
  success: function(data) {
   console.log(data); 
  }, error: function(jqXHR, textStatus, errorThrown) {
   console.log(errorThrown); 
  }
});



    $.get(
        "http://stats.nba.com/stats/commonallplayers/?LeagueID=00&Season=2012-13&IsOnlyCurrentSeason=0&callback=playerinfocallback",
        function(data) {
        alert('test');
            console.log(data);
        }
    );
    
    */
    

    function getData(url, callback) {
        var http = new XMLHttpRequest();
        http.onreadystatechange = function() {
            if (http.readyState == 4 && http.status == 200) {
                process(http.responseText);
            }
        }
        http.open("GET", "http://stats.nba.com/stats/commonallplayers/?LeagueID=00&Season=2012-13&IsOnlyCurrentSeason=0&callback=playerinfocallback", true);
        http.send(null);
    };
    
    function process(data) {
        //console.log(data);
    };
    
    //getData();
    
    
   var nba = require('nba');
    
    console.log(nba.stats.commonTeamRoster("00", "2015-16", "0"));
    
    
})