//*********** BART API ***************************************************************
/*
 function callBartApi(url) {
 log("callBartApi starting... " + url)
 var result = null;
 $.ajax({
 url: url,
 type: 'get',
 dataType: 'xml',
 async: false,
 success: function(data) {
 log("callBartApi success!");
 bartApiResult = data;
 },
 error: function(jqXHR, textStatus, errorThrown) {
 log("callBartApi error:" + textStatus + "  " + jqXHR + " " + errorThrown);
 }
 });
 };

 //    <name>12th St. Oakland City Center</name><abbr>12TH</abbr><gtfs_latitude>37.803664</gtfs_latitude><gtfs_longitude>-122.271604</gtfs_longitude><address>1245 Broadway</address><city>Oakland</city><county>alameda</county><state>CA</state><zipcode>94612</zipcode>
 function getBartStationsApi() {
 //http://api.bart.gov/docs/overview/index.aspx
 //http://www.bart.gov/schedules/developers/index.aspx
 //key UBHV-T2TG-U2UQ-2VA5
 // arrivals http://www.bart.gov/dev/eta/bart_eta.xml //
 var abbr = "?";
 var name = "?";
 var options = "";
 callBartApi("http://api.bart.gov/api/stn.aspx?cmd=stns" + BART_API_KEY );
 $(bartApiResult).find('station').each(function(){
 abbr = "?";
 name = "?";
 $(this).find('name').each(function(){
 name = $(this).text();
 });
 $(this).find('abbr').each(function(){
 abbr = $(this).text();
 });
 //save to cache??????
 options += '<option value="' + abbr + '">' + name + '</option>';
 });
 $('#select-depart').html(options);
 $('#select-arrive').html(options);
 }
 //
 function getStationSchedule(origStation) {
 var abbr = "?";
 var name = "?";
 var options = "";
 callBartApi("http://api.bart.gov/api/sched.aspx?cmd=stnsched&orig=" + origStation + BART_API_KEY );
 $(bartApiResult).find('item').each(function(){
 //line, trainHeadStation, origTime, destTime, trainIdx

 $(this).find('trainHeadStation').each(function(){
 trainHeadStation = $(this).text();
 });
 $(this).find('origTime').each(function(){
 origTime = $(this).text();
 });
 $(this).find('origTime').each(function(){
 destTime = $(this).text();
 });
 //save to cache??????
 options += '<option value="' + abbr + '">' + name + '</option>';
 });
 $('#select-depart').html(options);
 $('#select-arrive').html(options);
 }

 //
 function getBartRoutes() {
 var scheduleNumber = "?";
 var name = "?";
 var options = "";
 callBartApi("http://api.bart.gov/api/route.aspx?cmd=routes&date=now" + BART_API_KEY );
 //route -
 $(bartApiResult).find('sched_num').each(function(){
 scheduleNumber = $(this).text();
 });



 }

 // gets a list of routes for a station
 function getBartStationDetail(station) {
 var routes = new Array();
 callBartApi("http://api.bart.gov/api/stn.aspx?cmd=stninfo&orig=" + station + BART_API_KEY );
 $(bartApiResult).find('station').each(function(){
 //each station has multiple routes - name, abbr, routeID, number, color
 $(bartApiResult).find('route').each(function(){
 routes.push($(this).text());
 });
 });
 }

 // get route info - name, abbr, routID, number, origin, destination, direction, color, holidays, num_stns, config (list of stations)
 function getBartRoute(routeNum) {
 //var routes = new Array();
 callBartApi("http://api.bart.gov/api/route.aspx?cmd=routeinfo&route=" + routeNum + BART_API_KEY );
 $(bartApiResult).find('station').each(function(){
 //each station has multiple routes - name, abbr, routeID, number, color
 $(bartApiResult).find('route').each(function(){
 routes.push($(this).text());
 });
 });
 }
 */
