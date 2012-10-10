
//********** GPS STUFF *****************************************************************
// onSuccess Geolocation
//
function getGeo() {
    //log("calling geolocation.getCurrentPosition...");
    //navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
    //log("geolocation.getCurrentPosition complete.");
    //
    // Options: throw an error if no update is received every 30 seconds.
    //
    //var watchID = navigator.geolocation.watchPosition(onWatchSuccess, onWatchError, { timeout: 30000 });
}


//function onGeoSuccess(position) {
//    var element = document.getElementById('geolocation');
//    element.innerHTML = 'Latitude: ' + position.coords.latitude            + '<br />' +
//            'Longitude: '          + position.coords.longitude             + '<br />' +
//            'Altitude: '           + position.coords.altitude              + '<br />' +
//            'Accuracy: '           + position.coords.accuracy              + '<br />' +
//            'Altitude Accuracy: '  + position.coords.altitudeAccuracy      + '<br />' +
//            'Heading: '            + position.coords.heading               + '<br />' +
//            'Speed: '              + position.coords.speed                 + '<br />' +
//            'Timestamp: '          + position.timestamp                    + '<br />';
//}
//
//// onError Callback receives a PositionError object
////
//function onGeoError(error) {
//    alert('code: '    + error.code    + '\n' +
//            'message: ' + error.message + '\n');
//}


// onSuccess Callback
//   This method accepts a `Position` object, which contains
//   the current GPS coordinates
//
//    function onWatchSuccess(position) {
//        var element = document.getElementById('geolocation');
//        element.innerHTML = 'Latitude: '  + position.coords.latitude      + '<br />' +
//                'Longitude: ' + position.coords.longitude     + '<br />' +
//                '<hr />'      + element.innerHTML;
//    }
//
//    // onError Callback receives a PositionError object
//    //
//    function onWatchError(error) {
//        alert('code: '    + error.code    + '\n' +
//                'message: ' + error.message + '\n');
//    }
//********** END - GPS STUFF *****************************************************************

