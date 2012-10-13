var MINUTES_BEFORE_ARRIVAL = 5;
var isAlarmOn = false; //off, on, ??
var alarmType = 1; //0=none, 1=alarm, 2=vibrate, 3=both
var stationDepartAbbr = "";
var stationArriveAbbr = "";
var tripTime;//in seconds
var departTime;//Date of when train leaves the Start
var arriveTime;//Date of when train arrives at End
var dayNames = new Array("SUN","MON","TUE","WED","THU","FRI","SAT");
var currentdayOfWeek = dayNames[new Date().getDay()];
var url = "";
var bartApiResult;
var BART_API_KEY = "&key=UBHV-T2TG-U2UQ-2VA5";
var arrayStopTimes = [];
var arrayStations  = [];
var timeout;//holds setTimeout
var alarmFileURL = "assets/audio/alarmBig.mp3";
var alarmAudio;//for audio instance
//
var isDebug = true;
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
    savePreferences();
    $("#departTime").html("");
    $("#buttonStartTime").hide();
    $('.arriveTime').hide();
    if (stationDepartAbbr.length > 0 && stationArriveAbbr.length > 0) {
        $("#buttonStartTime").show();
        $('#departTime').html("Searching...");
        tripTime = getTripTime(stationDepartAbbr, stationArriveAbbr, currentdayOfWeek, getCurrentTimeHHMMSS());
        log("Stations changed in newTrip() from: " + stationDepartAbbr + " leaving: " + formatDateToTime(departTime) + " to: " + stationArriveAbbr + " arriving: " + formatDateToTime(arriveTime) + ") Time=" + tripTime/60 + " minutes",1);
        $('#departTime').html("?");
        if (tripTime != null) {
            $('#departTime').html(formatDateToTime(departTime)).show();
            $('.arriveTime').html(formatDateToTime(arriveTime)).show();
        } else {
            $('#departTime').html("Error");
        }
    }
}

//**************** utilities **************************************************


function log(msg, level) {
    if (isDebug) {
        if (level >= debugLevel) {
            if ($('#log').is(':visible') )
                $('#log').append("<br/>" + getCurrentTime() + " - " + msg);
            else
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
    if (diff < MINUTES_BEFORE_ARRIVAL * 1000 * 60) {
        //if (diff < 0)
        //    $('#timeRemaining').html("ARRIVED");
        //else
//        $("#timeRemaining").effect( "pulsate",{times:5}, 3000 );
        log(" time remaining less than " + MINUTES_BEFORE_ARRIVAL,1);
        alarm();
    } else {
        timeout=setTimeout(function(){updateAlarmDisplay()},5000);
    }
}

//alert
function alarm() {
    log("ALARM, type: " + alarmType,1);
    navigator.notification.alert("Wakey, wakey, you are approaching your station.",
        alarmCallback(), "Wakey", "Okie Dokie");
    if (alarmType == 1 || alarmType == 3) {
        //navigator.notification.beep(5);
        playStream(alarmFileURL);
    }
    if (alarmType == 2 || alarmType == 3) {
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
function savePreferences() {
    log("Saving preferences " + stationDepartAbbr + " and " + stationArriveAbbr,1);
    $.cookie('bna_cookie_depart', stationDepartAbbr);
    $.cookie('bna_cookie_arrive', stationArriveAbbr);
    log("   preferences saved.",1)
}

function loadPreferences() {
    log("Loading preferences...",1)
    stationDepartAbbr = $.cookie('bna_cookie_depart');
    stationArriveAbbr = $.cookie('bna_cookie_arrive');
    if (stationDepartAbbr != null && stationDepartAbbr != "")
        $("#select-depart").val(stationDepartAbbr).selectmenu("refresh", true);
    if (stationArriveAbbr != null && stationArriveAbbr != "")
        $("#select-arrive").val(stationArriveAbbr).selectmenu("refresh", true);

    log("stationDepartAbbr preference loaded: " + stationDepartAbbr,1);
    log("stationArriveAbbr preference loaded: " + stationArriveAbbr,1);
    log("  Preferences loaded, calling newTrip.",1);
    newTrip();
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
function getTripTime(orig, dest, dayOfWeek, time ) {
    log("finding trip time for orig: " + orig + "   dest: " + dest + " day: "
        + dayOfWeek + "  time: " + time,2);
    if (orig == null || dest == null || orig == "" || dest == "" || dest == orig)
        return;
    departTime = null;
    arriveTime = null;
    var now = new Date();
    var stopTimeTripId;
    var currentTripId;
    var origSequence=0;
    var stopTimeSequence;
    var stopTimeStopId;
    var inRoute = false;
    var inRouteDepartTime;
    var stopTime = [];
    var stopTimeDepartTime = "";
    var stopTimeDepartTimeAsDate = new Date();
    var mm = $.trim(now.getMonth() + 1);//zero based for some bizarre reason
    if (mm.length == 1)
        mm = "0" + mm;
    var dd = $.trim(now.getDate());
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
        timeString = now.getFullYear() + "-" + mm + "-" + dd + "T" + stopTimeDepartTime;
        stopTimeDepartTimeAsDate = new Date(Date.parse(timeString)); //wrong date but not important, only need time
        stopTimeStopId = stopTime[3];
        stopTimeSequence = stopTime[4];
        log("StopTimes record " + i + " - " + "   trip_id: " + stopTimeTripId + "  station: " + stopTimeStopId + "  time:" + stopTime[1] + "  sequence: " + stopTimeSequence,0);
        if ((stopTimeTripId.indexOf("SUN") >= 0 && dayOfWeek == "SUN")  //its sunday
            || (stopTimeTripId.indexOf("SAT") >= 0 && dayOfWeek == "SAT") //its saturday
            || (dayOfWeek != "SAT" && dayOfWeek != "SUN" && stopTimeTripId.indexOf("SAT") < 0 && stopTimeTripId.indexOf("SUN") < 0)) {//weekday
            if (stopTimeStopId == orig) { //matching origin
                if (stopTimeDepartTimeAsDate < now  //previous to current time
                    && stopTimeDepartTimeAsDate > departTime) {//more recent the current match
                    inRoute = true;
                    origSequence = stopTimeSequence;
                    currentTripId = stopTimeTripId;
                    inRouteDepartTime = stopTimeDepartTimeAsDate;
                    log("   Orig found, sequence is " + origSequence + " trip id " + currentTripId + "  time " + departTime,0);
                }
            } else {
                if (stopTimeTripId != currentTripId || parseInt(stopTimeSequence) < parseInt(origSequence)) {
                    log("   station rejected",0);
                    //if (stopTimeSequence < origSequence)
                    //log("dest rejected because of sequence  " + stopTimeTripId + "  " + currentTripId + "  curr seq=" + stopTimeSequence + "  orig seq=" + origSequence)
                    currentTripId = stopTimeTripId;
                    inRoute = false;
                } else {
                    log("station not rejected",0);
                    if (inRoute) {
                        log("in route",0);
                        if (stopTimeStopId == dest) {
                            arriveTime = stopTimeDepartTimeAsDate;//remember the Date
                            departTime = inRouteDepartTime;
                            log("     Potential trip found: " + formatDateToTime(departTime) + " - "
                                + formatDateToTime(arriveTime) + "   id: " + stopTimeTripId,1);
                            inRoute = false;//keep looking for better times
                            //break;
                        }
                    }
                }
            }
        } //else
    }
    if (arriveTime != null && departTime != null) {
        var tripTime = (arriveTime - departTime)/1000;
        log("  Returning trip found: " + tripTime + "sec (" + tripTime/60 + "min) " + formatDateToTime(departTime) + " - " + formatDateToTime(arriveTime),2);
        log("getTripTime done.",1);
        return tripTime;//in seconds
        //                    return (timeDiff(origTime, destTime))
    } else {
        log("ERROR - No trip found.",2);
        log("getTripTime done.",1);
        alert("ERROR - Could not find a trip in the BART schedule.");
        return null;
    }
}

