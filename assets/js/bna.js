var alarmMinutesBefore = 3; //default, should come from cookie
var isAlarmOn = false; //off, on, ??
var alarmType = 1; //0=none, 1=alarm, 2=vibrate, 3=both
var stationDepartAbbr = "";
var stationArriveAbbr = "";
var tripTime;//in seconds
var departTime;//Date of when train leaves the Start
var arriveTime;//Date of when train arrives at End
var dayNames = new Array("SUN","MON","TUE","WED","THU","FRI","SAT");
//var currentdayOfWeek = dayNames[new Date().getDay()];
var url = "";
var bartApiResult;
var BART_API_KEY = "&key=UBHV-T2TG-U2UQ-2VA5";
var arrayStopTimes = [];
var arrayTripsPast = [];  //a trip is an array of 0-start time, 1-end time
var arrayTripsFuture = [];
var arrayStations  = [];
var timeout;//holds setTimeout
var alarmFileURL = "assets/audio/alarmBig.mp3";
var alarmAudio;//for audio instance
//
var isDebug = false;  /// can also use the script at the bottom of index.html to send console to build.phonegap.com
var debugLevel = 1;//0-detailed, 1-less detailed, 2-summary level
var stopTimesFilenameURL = "gtfs/stop_times.txt";
var stationsURL = "gtfs/stops.txt";
//var stopTimesFilenameURL = "gtfs/stop_times_test.txt";
//

function initialize() {
    loadStations();
    loadStopTimes();
    $("#select-depart option:selected").val("");
    $("#select-arrive option:selected").val("");
    $("#buttonStartTime").hide();
    alarmOff();
    loadPreferences();
    if (isDebug)
        $('#buttonDebug').show();
    else
        $('#buttonDebug').hide();
    log("Initialized.  Debug is " + isDebug + "  with level of " + debugLevel, 2 );
}

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {

}

function newTrip() {
    alarmOff();
    stationDepartAbbr = $("#select-depart option:selected").val();
    stationArriveAbbr = $("#select-arrive option:selected").val();
    $("#departTime").html("");
    $("#buttonStartTime").hide();
    $('.arriveTime').hide();
    if (stationDepartAbbr.length > 0 && stationArriveAbbr.length > 0) {
        $("#buttonStartTime").show();
        $('#departTime').html("Searching...");
        log("new date is " + new Date());
        tripTime = getTripTime(stationDepartAbbr, stationArriveAbbr, new Date());
        loadTripTimes();
        log("Stations changed in newTrip() from: " + stationDepartAbbr + " leaving: " + formatDateToTime(departTime) + " to: " + stationArriveAbbr + " arriving: " + formatDateToTime(arriveTime) + ") Time=" + tripTime/60 + " minutes",1);
        $('#departTime').html("?");
        if (tripTime != null) {
            $('#departTime').html(formatDateToTime(departTime)).show();
            $('.arriveTime').html(formatDateToTime(arriveTime)).show();
        } else {
            $('#departTime').html("Error");
        }
        persistPreferences();
    }
}

function loadTripTimes() {
    var str;
    var trip;//array of depart, arrive
    var i,j;
    $("#radioTrips").append("<br/>Past -<br/>");
    for (i=0; i < arrayTripsPast.length; i++) {
        trip = arrayTripsPast[i];
        str = "<input type='radio' name='radio-startTime' onchange='$.mobile.changePage( \"index.html\")' id='radio-startTime-" + i + "' value='" + i + "' />";// + " checked='checked' />"
        str += "<label for='radio-startTime-" + i + "'> " + formatDateToTime(trip[0]) + "</label>";
        $("#radioTrips").append(str);
    }
    $("#radioTrips").append("<br/>Future -<br/>");
    var cnt = arrayTripsPast.length;
    for (j=0; j < arrayTripsFuture.length; j++) {
        trip = arrayTripsFuture[j];
        str = "<input type='radio' name='radio-startTime' onchange='$.mobile.changePage( \"index.html\")' id='radio-startTime-" + (j+cnt) + "' value='" + (j+cnt) + "' />";// + " checked='checked' />"
        str += "<label for='radio-startTime-" + (j+cnt) + "'> " + formatDateToTime(trip[0]) + "</label>";
        $("#radioTrips").append(str);
    }
    cnt=arrayTripsPast.length + arrayTripsFuture.length;
    log("Loaded " + cnt + "trips in train selector screen.",1);
    return cnt;
}

//**************** utilities **************************************************


function log(msg, level) {
    if (level == null || level == undefined)
        level = 1;
    if (isDebug) {
        if (level >= debugLevel) {
            //if ($('#log').is(':visible') )
                $('#log').append("<br/>" + getCurrentTime() + " - " + msg);
            //else
                if( (window['console'] !== undefined) )
                    console.log(getCurrentTime() + " - " + msg);
        }
    }
}

function clearLog(msg) {
    $('#log').html("Cleared.");
}



function getCurrentTime() {
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    var seconds = currentTime.getSeconds();
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var time="";
    if(hours > 11){
        time = (hours - 12) + ":" + minutes + ":" + seconds + " ";
        time +=" PM";
    } else {
        time = hours + ":" + minutes + ":" + seconds + " ";
        time += " AM";
    }
    return time;
}

function getCurrentTimeHHMMSS() {
    log("getCurrentTimeHHMMSS...")
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    var seconds = currentTime.getSeconds();
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    time = hours + ":" + minutes + ":" + seconds + " ";
    log("getCurrentTimeHHMMSS returning " + time);
    return time;
}

//times are assumed in hh:mm:ss format
//returns in seconds
function timeDiff(time1, time2) {
    var time1ss = HMStoSec1(time1);
    var time2ss = HMStoSec1(time2);
    var diffss = (time2ss - time1ss);
    var diffmm =  diffss / 60;
    log("Time diff = " + diffmm + " minutes",0);
    return diffss;
}

//takes in hh:mm:ss and returns seconds
function HMStoSec1(T) { // h:m:s
    var A = T.split(/\D+/) ;
    return (A[0]*60 + +A[1])*60 + +A[2];
}

//adds specified number of seconds to the time hh:mm:ss
function addToTime(time, addSeconds) {

}


//****** START - ALARM STUFF *******************
//check if ok to turn alarm on
function alarmable() {
    if (stationDepartAbbr == "") {
        alert("You need an Departing Station");
        alarmOff();
        return false;
    }
    if (stationArriveAbbr == "") {
        alert("You need an Arriving Station");
        alarmOff();
        return false;
    }

    return true;
}

function alarmOn() {
    if (alarmable()) {
        log("alarm ON",1);
        $('#alarmStatus').show();
        log("  departTime = " + formatDateToTime(departTime) + "  arrive:" + formatDateToTime(arriveTime),1);
        timeout=setTimeout(function(){updateAlarmDisplay()},1000);
    }
}

//called via setTimout every second
function updateAlarmDisplay() {
    //log("updateAlarmDisplay()")
    $('.arriveTime').html(formatDateToTime(arriveTime));
    var diff = (arriveTime.getTime() - new Date().getTime()) ;

    $('#timeRemaining').html(formatMilliseconds(diff));
    $('#imagePulse').fadeIn('slow', function() {
        $('#imagePulse').fadeOut('slow');
    });
    if (diff < alarmMinutesBefore * 1000 * 60) {
        //if (diff < 0)
        //    $('#timeRemaining').html("ARRIVED");
        //else
//        $("#timeRemaining").effect( "pulsate",{times:5}, 3000 );
        log(" time remaining less than " + alarmMinutesBefore,1);
        alarm();
    } else {
        timeout=setTimeout(function(){updateAlarmDisplay()},5000);
    }
}

//alert
function alarm() {
    log("ALARM, type: " + alarmType,1);
    //noinspection JSUnresolvedVariable
    navigator.notification.alert("Wakey, wakey, you are approaching your station.",
        alarmCallback(), "Wakey", "Okie Dokie");
    if (alarmType == 1 || alarmType == 3) {
        //navigator.notification.beep(5);
        playStream(alarmFileURL);
    }
    if (alarmType == 2 || alarmType == 3) {
        //noinspection JSUnresolvedVariable
        navigator.notification.vibrate(5000);
    }
}

function alarmCallback() {
    //cancel alarm?
    //alarmAudio.pause();
    alarmOff();
}

function alarmOff() {
    log("alarmOff() start",1);
    clearTimeout(timeout);
    $('#alarmStatus').hide();
    $('#radio-alarm-on').removeAttr('checked').checkboxradio("refresh");
    $('#radio-alarm-off').attr('checked',true).checkboxradio("refresh");
    log("alarmOff() complete.",1);
    if (alarmAudio != null)
        alarmAudio.pause();
}

//formats a date into hh:mm:ss
function formatDateToTime(date) {
    var ampm;
    if (date == null)
        return date;
    var h=date.getHours();
    if (h > 11) {
        ampm = "PM";
        if (h > 12)
            h = h - 12;
    } else
        ampm = "AM";
    var m=date.getMinutes();
    var s=date.getSeconds();
    // add a zero in front of numbers<10
    m=padTime(m);
    s=padTime(s);
    return h + ":" + m + " " + ampm;
}

function formatMilliseconds(ms) {
    var x = ms / 1000;
    var seconds = x % 60;
    x /= 60;
    minutes = x % 60;
    minutes = Math.floor(minutes);
    x /= 60;
    hours = x % 24;
    hours = Math.floor(hours);
    x /= 2;
    var result = "";
    if (hours > 0)
        result = hours + " hrs ";
    result += minutes + " min ";
    return result;
}

function padTime(i) {
    if (i<10)
        i="0" + i;
    return i;
}

//****** END - ALARM STUFF *******************

//****** START - Audio
function playStream(url) {
    log("playStream of:" + url,1);
    try {
        alarmAudio = new Audio(url);
        alarmAudio.id = 'alarmAudio';
        alarmAudio.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        }, false);
        alarmAudio.play();
    } catch (e) {
        alert('no audio support!');
    }
    log("playStream complete.",1);
}

//******** END - audio

//**** BEGIN Cookie stuff ******
function persistPreferences() {
    log("Saving preferences to cookie..." + stationDepartAbbr + " and " + stationArriveAbbr + ", type:" + alarmType + "  min:" + alarmMinutesBefore,1);
    $.cookie('bna_cookie_depart', stationDepartAbbr);
    $.cookie('bna_cookie_arrive', stationArriveAbbr);
    $.cookie('bna_cookie_alarmType', alarmType);
    $.cookie('bna_cookie_alarmMinutesBefore', alarmMinutesBefore);
    log("   preferences saved.",1);
}

function loadPreferences() {
    log("Loading preferences...",1)
    //load data from cookies
    stationDepartAbbr = $.cookie('bna_cookie_depart');
    stationArriveAbbr = $.cookie('bna_cookie_arrive');
    alarmType = $.cookie('bna_cookie_alarmType');
    if (alarmType == null)
        alarmType = 1;
    alarmMinutesBefore = $.cookie('bna_cookie_alarmMinutesBefore');
    if (alarmMinutesBefore == null)
        alarmMinutesBefore = 3;

    if (stationDepartAbbr != null && stationDepartAbbr != "")
        $("#select-depart").val(stationDepartAbbr).selectmenu("refresh", true);
    if (stationArriveAbbr != null && stationArriveAbbr != "")
        $("#select-arrive").val(stationArriveAbbr).selectmenu("refresh", true);

    log("stationDepartAbbr preference loaded: " + stationDepartAbbr,1);
    log("stationArriveAbbr preference loaded: " + stationArriveAbbr,1);
    log("alarmMinutesBefore preference loaded: " + alarmMinutesBefore,1);
    log("alarmType preference loaded: " + alarmType,1);

    log("  Preferences loaded, calling newTrip.",1);
    newTrip();
}


function saveSettings() {
    log("saving Settings... ",1);

    if ( $('#radio-alarmtype-noise').attr("checked")=="checked")
        alarmType = 1;
    else if ( $('#radio-alarmtype-vibrate').attr("checked")=="checked")
        alarmType = 2;
    else
        alarmType = 3;
    log("Alarm type:" + alarmType,1);

    alarmMinutesBefore = $("#sliderAlarmMintesBefore").val();
    log("Alarm minutes before:" + alarmMinutesBefore,1);

    persistPreferences();
    log("Settings saved.",1);
}

function loadSettings() {
    log("Loading settings...",1);

    if (alarmType == 1)
        $('#radio-alarmtype-noise').prop("checked",true).checkboxradio("refresh");
    else if (alarmType == 2)
        $('#radio-alarmtype-vibrate').prop("checked",true).checkboxradio("refresh");
    else
        $('#radio-alarmtype-both').prop("checked",true).checkboxradio("refresh");


    $("#sliderAlarmMintesBefore").val(alarmMinutesBefore);
    log("Settings loaded.",1);
}

//**** END Cookie stuff ******


//*********** CSV - GTFS ***************************************************************
//currently data is located local in /gtfs
//
//loads a massive file of times by sched, origin, dest
function loadStopTimes() {
    //trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type
    //    var csvfile = "gtfs/stop_times_test.txt";
    log("loading gtfs stoptimes from " + stopTimesFilenameURL,2);
    $.ajax({
        url : stopTimesFilenameURL,
        dataType : "text",
        async : false,
        success : function (data) {
            arrayStopTimes = jQuery.csv()(data);
        },
        error : function (jqXHR, textStatus, errorThrown) {
            alert("loadStoptimes() error: " + textStatus +   ", " + errorThrown)
        }
    });
    log("   gtfs stoptimes loaded:" + arrayStopTimes.length,2);
    return arrayStopTimes.length;
}

function loadStations() {
    var abbr = "?";
    var name = "?";
    var options = "";
    log("loading gtfs stations from " + stationsURL + "...",2);
    $.ajax({
        url : stationsURL,
        dataType : "text",
        async : false,
        success : function (data) {
            arrayStations = jQuery.csv()(data);
        },
        error : function (e) {
            alert("loadStations() error: " + e)
        }
    });

    //load the <select> for origin and destination
    options += '<option selected="selected" value="' + "" + '">' + "   " + '</option>';
    for (i=1; i < arrayStations.length; i++) {
        station = arrayStations[i];
        abbr = station[0];
        name = station[1];
        options += '<option value="' + abbr + '">' + name + '</option>';
    }
    log("   gtfs stations loaded: " + arrayStations.length,2);
    $('#select-depart').html(options);
    $('#select-arrive').html(options);
    return arrayStations.length;
}



//looks in arrayStopTimes to find orig and dest and returns time
function getTripTime(orig, dest, targetDateTime ) {
    log("getTripTime() for " + orig + " to " + dest + " at " + targetDateTime,2);
    if (orig == null || dest == null || orig == "" || dest == "" || dest == orig) {
        alert('ERROR - ORIG and/or DEST is null!');
        return;
    }
    if (targetDateTime == null || targetDateTime == undefined) {
        alert('ERROR - Taget Time is null!');
        return;
    }
    departTime = null;
    arriveTime = null;
    //var now = new Date();
    var trip;//array for trips to save, 0 is depart date object, 1 is arrive date object
    var stopTimeTripId;
    var inRouteTripId;
    var inRouteDepartSequence=0;
    var stopTimeSequence;
    var stopTimeStopId;
    var inRoute = false;
    var inRouteDepartTime =  null;
    var stopTime = [];
    var stopTimeDepartTime = "";
    var stopTimeDepartDateTime = new Date();
    //get target day of week
    var targetDayOfWeek = dayNames[targetDateTime.getDay()]
    var MM = $.trim(targetDateTime.getMonth() + 1);//zero based for some bizarre reason
    if (MM.length == 1)
        MM = "0" + MM;
    var dd = $.trim(targetDateTime.getDate());
    if (dd.length == 1)
        dd = "0" + dd;
    //trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type
    //Look in stop times for a match to orig, then find dest where it is in same trip and
    //sequence is higher and departure time is closest prior to current time
    var timeString = "";
    for (i=0; i < arrayStopTimes.length; i++) {
        stopTime = arrayStopTimes[i];
        stopTimeTripId = stopTime[0];
        stopTimeDepartTime = stopTime[1];//arrival_time, when they are at station
        if (stopTimeDepartTime.length == 7)
            stopTimeDepartTime = "0" + stopTimeDepartTime;//javascript requires hh format or craps out

        //timeString = targetDateTime.getFullYear() + "-" +var hh = stopTimeDepartTime[0] + stopTimeDepartTime[1];
        //stopTimeDepartDateTime = new Date(mm + "-" + dd + " " + stopTimeDepartTime);
        var hh = stopTimeDepartTime[0] + stopTimeDepartTime[1];
        var mm = stopTimeDepartTime[3] + stopTimeDepartTime[4];
        stopTimeDepartDateTime = new Date(targetDateTime.getFullYear(), targetDateTime.getMonth(),
            targetDateTime.getDate(), hh, mm);
        stopTimeStopId = stopTime[3];
        stopTimeSequence = stopTime[4];
        if (i < 100)
            log("StopTimes record " + i + " - " + "   trip_id: " + stopTimeTripId + "  station: " + stopTimeStopId + "  time:" + stopTime[1] + "  sequence: " + stopTimeSequence,1);
        else
            log("StopTimes record " + i + " - " + "   trip_id: " + stopTimeTripId + "  station: " + stopTimeStopId + "  time:" + stopTime[1] + "  sequence: " + stopTimeSequence,0);

        if (inRoute) {  //we matched departing station already so now looking for dest in current trip
            if (stopTimeTripId == inRouteTripId) { //still the same trip
                if (parseInt(stopTimeSequence) > parseInt(inRouteDepartSequence)) {  //sequence is higher
                    if (stopTimeStopId == dest) {  //found dest, we have a potential trip
                        log("     trip found id:" + inRouteTripId + "  " + inRouteDepartTime,1);
                        //    + " - " +  formatDateToTime(stopTimeDepartDateTime),1);
                        if (inRouteDepartTime == null || inRouteDepartTime == undefined || typeof inRouteDepartTime != 'object') {
                            log("    found dest but inRouteDepartTime is bad: " + inRouteDepartTime + "  id:" + stopTimeTripId,1);
                            inRoute = false;//keep looking for better times
                        } else {
                            if (inRouteDepartTime > targetDateTime) {//leaving AFTER target time
                                if ((inRouteDepartTime - targetDateTime)/1000/60 < 60) { //leaving within 60 minutes
                                    trip = [inRouteDepartTime, stopTimeDepartDateTime];
                                    arrayTripsFuture.push(trip);
                                    log("     Future trip found id:" + inRouteTripId + "  " + formatDateToTime(inRouteDepartTime)
                                        + " - " + formatDateToTime(stopTimeDepartDateTime),1);
                                }
                            } else {  //trip departs BEFORE target time
                                if ((targetDateTime - inRouteDepartTime)/1000/60 < 60) {
                                    trip = [inRouteDepartTime, stopTimeDepartDateTime];
                                    arrayTripsPast.push(trip);
                                    log("     Past trip found.",1);
                                    if (inRouteDepartTime > departTime) {
                                        arriveTime = stopTimeDepartDateTime;//remember the Date
                                        departTime = inRouteDepartTime;
                                        log("     Past trip found: " + formatDateToTime(departTime) + " - "
                                            + formatDateToTime(arriveTime) + "   id: " + stopTimeTripId,1);
                                    }
                                }
                            }
                            inRoute = false;//reset, look for next trip
                        }
                    }
                } else {
                    log("   same trip id but lower sequence?  rejecting and starting over ",1);
                    inRoute = false;
                }
            } else { //new trip
                //log("dest rejected because of new trip id  " + stopTimeTripId + "  " + currentTripId + "  curr seq=" + stopTimeSequence + "  orig seq=" + origSequence)
                inRouteTripId = stopTimeTripId;
                inRoute = false;
            }
        } else {  //looking for departing station
            if ((stopTimeTripId.indexOf("SUN") >= 0 && targetDayOfWeek == "SUN")  //its sunday
                || (stopTimeTripId.indexOf("SAT") >= 0 && targetDayOfWeek == "SAT") //its saturday
                || (targetDayOfWeek != "SAT" && targetDayOfWeek != "SUN" && stopTimeTripId.indexOf("SAT") < 0 && stopTimeTripId.indexOf("SUN") < 0)) {//weekday
                if (stopTimeStopId == orig) { //matching origin
                    inRoute = true;
                    inRouteDepartSequence = stopTimeSequence;
                    inRouteTripId = stopTimeTripId;
                    inRouteDepartTime = stopTimeDepartDateTime;
                    log("Origin found, id: " + inRouteTripId + "  time: " + inRouteDepartTime);
                    //Add this to list of future potential trips
                } else {
                    log("  stop does not match origin ",0);
                    inRouteTripId = stopTimeTripId;
                    inRouteDepartTime = null;
                }
            } else {//else, days don't match
                log("  stop does not have correct day ",0);
            }
        }
    }
    //finished searching through all the trips (stop_times)
    if (arriveTime != null && departTime != null) {
        var tripTime = (arriveTime - departTime)/1000;
        log("  BEST trip found: " + tripTime + "sec (" + tripTime/60 + "min) " + formatDateToTime(departTime) + " - " + formatDateToTime(arriveTime),2);
        log("getTripTime normal done.",1);
        return tripTime;//in seconds
        //                    return (timeDiff(origTime, destTime))
    } else {
        log("ERROR - No trip found.",2);
        log("getTripTime done.",1);
        //alert("ERROR - Could not find a trip in the BART schedule.");
        return null;
    }
}

