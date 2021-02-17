'use strict';
// Code for the Navigate page.

var pathIndex = localStorage.getItem(APP_PREFIX + "-selectedPath");
var map = null;
var currentPath;                    // current path in this navigation view
var elementsHandler;                // handler to elements class
var accuracyThreshold = 20;         // accuracy level that is consider acceptable
var img;                            // handler of next action arrow
var locationsHistory = [];          // as its name, contain LatLng, accuracy and timestamp
var newPos = null;                  // new position from watchPosition

if (pathIndex !== null){
    loadPaths();
    document.getElementById("headerBarTitle").textContent = availablePaths[pathIndex].title();
}

// initMap()
//     Initialize the map center at (0, 0), zoom level 17
function initMap(){
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 0, lng: 0},
        zoom: 17
    });
}

// initialize()
//     initialize the map and related elements
function initialize(){

    // create <div> map and append it to <main>
    var mapArea = document.createElement("div");
    mapArea.setAttribute("id", "map");
    var main = document.getElementsByTagName("main")[0];
    main.insertBefore(mapArea, main.firstChild);
    
    // display the map
    initMap();

    // initialize the handler
    elementsHandler = new elements();

    // current path in this navigation view
    currentPath = availablePaths[pathIndex];

    // create <div> arrowArea and append it to mapArea
    var arrowArea = document.createElement("div");
    arrowArea.setAttribute("id", "arrowArea");
    mapArea.appendChild(arrowArea);

    // create <img> and append it to arrowArea
    // icon to be displayed in the next turn
    img = document.createElement("img");
    img.setAttribute("class", "arrow");
    arrowArea.appendChild(img);
}

// elements()
//     a class used to handle changes to element, including:
//       . current location marker
//       . accuracy circle
//       . user heading arrow
//       . line to next waypoint
//       . location history polyline
//       . next turn icon
function elements(){
    var blueCircle = null;          // current location marker
    var accuracyCircle = null;      // accuracy circle
    var arrow = null;               // user heading arrow 
    var upcomingLine = null;        // line to next waypoint
    var historyPolyline = null;     // location history polyline
    var targetIndex = 0;            // current target waypoint index
    var totalDistance = null;       // total distance to destination, from the beginning
    var historyPos = [];            // location history, only contain google.maps.LatLng class instance
    var minOpacity = 0.6;           // minimum opacity of upcomingLine
    var bufferSize = 5;             // buffer size used to calculate speed

    // defined array to identify next action
    var leftAction = ["Head Straight", "Slight Left", "Turn Left", "U Turn"];
    var rightAction = ["Head Straight", "Slight Right", "Turn Right", "U Turn"];
    var leftArrow = ["straight.svg", "slight_left.svg", "left.svg", "uturn.svg"];
    var rightArrow = ["straight.svg", "slight_right.svg", "right.svg", "uturn.svg"];

    // relativeAngle(current, heading)
    //     Calculate the relative angle between user heading and next direction
    //     Parameter:
    //         current: user heading
    //         heading: direction to next waypoint
    //     Return value:
    //         The angle in degree (-180 to 180)
    //         angle < 0 means turning left
    //         angle > 0 means turning right
    function relativeAngle(current, heading){
        current += 180;
        heading += 180;
        var sign = heading > current ? 1 : -1;
        var angle = Math.abs(heading - current);
        if (angle > 180)
            return sign * (angle - 360);
        else
            return sign * angle;
    }

    // updateArrow(current, heading)
    //     Update "Next action" and the arrow icon
    function updateArrow(current, heading){
        var angle = relativeAngle(current, heading);
        var flag = 0;

        if (Math.abs(angle) < 15)           // head straight
            flag = 0;
        else if (Math.abs(angle) < 45)      // slight left/right
            flag = 1;
        else if (Math.abs(angle) < 160)     // left/right
            flag = 2;
        else
            flag = 3;                       // U turn

        if (angle < 0){                     // turn left
            document.getElementById("nextAction").innerHTML = leftAction[flag];
            img.setAttribute("src", "images/" + leftArrow[flag]);
        }
        else {                              // turn right
            document.getElementById("nextAction").innerHTML = rightAction[flag];
            img.setAttribute("src", "images/" + rightArrow[flag]);
        }
    }

    // update()
    //     function to handle elements changes
    //     be called on position change (watchPosition)
    this.update = function(){

        // set map center to new position
        map.setCenter(newPos.LatLng);

        if (blueCircle != null){                            // if blueCircle already exist
            blueCircle.setPosition(newPos.LatLng);
        }
        else {
                blueCircle = new google.maps.Marker({       // create google.maps.Marker
                position: newPos.LatLng,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,    // make that look like
                    fillOpacity: 1.0,                       // Google maps circle
                    fillColor: "#4285F4",
                    strokeColor: "white",
                    strokeWeight: 2.0,
                    scale: 7
                },
            });
        }
        if (accuracyCircle != null){                        // if accuracyCircle already exist
            accuracyCircle.setCenter(newPos.LatLng);
            accuracyCircle.setRadius(newPos.accuracy);
        }
        else {
            accuracyCircle = new google.maps.Circle({       // create google.maps.Circle
                strokeWeight: 0,                            // this circle is not so smooth
                fillColor: "#4285F4",
                fillOpacity: 0.2,
                map: map,
                center: newPos.LatLng,
                radius: newPos.accuracy
            });
        }

        if (newPos.accuracy > accuracyThreshold){           // if the accuracy is not enough
            displayMessage("Location data is not accurate enough!");
            if (arrow != null){                             // remove user heading
                arrow.setMap(null);
                arrow = null;
            }
            accuracyCircle.setOptions({fillColor: "#FF0000"});  // set color red
            return;
        }
        else{
            accuracyCircle.setOptions({fillColor: "#4285F4"});
        }

        locationsHistory.push(newPos);      // this one contain LatLng, accuracy and timestamp
        historyPos.push(newPos.LatLng);     // this one only contain LatLng, used for drawing and computing

        var velocity = 0;                   // user speed (m/s)
        if (locationsHistory.length >= bufferSize){     // if there is enough info to calculate speed
            var bufferPos = [];
            var bufferTime = [];
            for (var i = bufferSize; i >= 1; i--){
                bufferPos.push(locationsHistory[locationsHistory.length - i].LatLng);
                bufferTime.push(locationsHistory[locationsHistory.length - i].timestamp);
            }
            // speed = length/time
            velocity = google.maps.geometry.spherical.computeLength(bufferPos);
            velocity = velocity * 1000 / (bufferTime[bufferTime.length-1] - bufferTime[0]);
        }
        document.getElementById("speed").innerHTML = velocity.toFixed(2) + " m/s";

        // display the history polyline
        if (historyPolyline != null){
            historyPolyline.setPath(historyPos);
        }
        else {
            historyPolyline = new google.maps.Polyline({
                path: historyPos,
                map: map,
                geodesic: true,
                strokeColor: '#4285F4',
                strokeOpacity: 0.5,
                strokeWeight: 1
            });
        }

        // if we have not reached the destination
        if (targetIndex < currentPath.locations().length){

            // distance to the next waypoint
            var distance = google.maps.geometry.spherical.computeDistanceBetween(newPos.LatLng, currentPath.location(targetIndex));

            // get unvisited locations, then add current position to compute
            var remainingPath = currentPath.locations().slice(targetIndex, currentPath.locations().length);
            remainingPath.unshift(newPos.LatLng);

            // remaining distance to the destination
            var toDestination = google.maps.geometry.spherical.computeLength(remainingPath);

            // set the total distance for the first time
            if (totalDistance == null)
                totalDistance = toDestination;

            // display distance at the bottom of the nav view
            document.getElementById("toDestination").innerHTML = toDestination.toFixed(1) + " m";
            document.getElementById("toNextWayPoint").innerHTML = distance.toFixed(1) + " m";

            // display estimated time of arrival
            if (velocity == 0){
                document.getElementById("estTime").innerHTML = "infinity!";
            }
            else {
                document.getElementById("estTime").innerHTML = Math.round(toDestination/velocity/60) + " m";
            }

            // compute direction to the next waypoint
            var nextHeading = google.maps.geometry.spherical.computeHeading(newPos.LatLng, currentPath.location(targetIndex));
            // compute user heading
            var currentHeading = null;
            if (historyPos.length >= 2)
                currentHeading = google.maps.geometry.spherical.computeHeading(historyPos[historyPos.length-2], historyPos[historyPos.length-1]);

            if (currentHeading != null)
                updateArrow(currentHeading, nextHeading);

            // update line to the next waypoint
            if (upcomingLine != null){
                upcomingLine.setPath([newPos.LatLng, currentPath.location(targetIndex)]);
                upcomingLine.setOptions({                    
                    icons: [{
                        icon: {
                            path: 'M 0,-1 0,1',
                            strokeOpacity: minOpacity + (1-minOpacity) * (toDestination/totalDistance),
                            strokeWeight: 2,
                            scale: 4
                        },
                        repeat: '20px'
                    }],
                });
            }
            else {
                upcomingLine = new google.maps.Polyline({
                    path: [newPos.LatLng, currentPath.location(targetIndex)],
                    map: map,
                    geodesic: true,
                    strokeColor: '#4285F4',
                    strokeWeight: 0,
                    icons: [{
                        icon: {
                            path: 'M 0,-1 0,1',
                            strokeOpacity: 1,
                            strokeWeight: 2,
                            scale: 4
                        },
                        repeat: '20px'
                    }],
                });
            }

            // update user heading
            if (arrow != null){
                arrow.setMap(map);
                arrow.setPosition(newPos.LatLng);
                arrow.setIcon({
                    path: "M0 12 Q 6 7 12 12 L6 0",
                    rotation: currentHeading,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    anchor: new google.maps.Point(6,20),
                    strokeWeight: 0,
                    scale: 1
                });
            }
            else {
                arrow = new google.maps.Marker({
                    position: newPos.LatLng,
                    map: map,
                    icon: {
                        path: "M0 12 Q 6 7 12 12 L6 0",
                        rotation: 0,
                        fillColor: '#4285F4',
                        fillOpacity: 0,
                        anchor: new google.maps.Point(6,20),
                        strokeWeight: 0,
                        scale: 1
                    },
                });                
            }

            // if the user have reached the waypoint, turn to next waypoint
            if (distance < newPos.accuracy){
                targetIndex++;
            }

            // if the user have reached the destination, inform user once
            if (targetIndex >= currentPath.locations().length){
                // remove line to the next waypoint
                if (upcomingLine != null){
                    upcomingLine.setMap(null);
                }
                // remove user heading
                if (arrow != null){
                    arrow.setMap(null);
                }
                // remove next action arrow
                img.style.visibility = "hidden";

                // inform user
                document.getElementById("nextAction").innerHTML = "Arrived";
                displayMessage("Arrived!");
            }
        }
    }
}

// updatePosition(pos)
//     Callback function to handle position change
//     Parameter:
//         pos: Position class returned by API
function updatePosition(pos){
    
    var LatLng = {lat: pos.coords.latitude, lng: pos.coords.longitude};
    newPos = {
        LatLng: googleLatLng(LatLng), 
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp
    };

    // update elements
    elementsHandler.update();
}

// watchPosition options
var options = {
    enableHighAccuracy: true, 
    timeout: 5000,
    maximumAge: 0
};

initialize();
var watchPositionHandler = navigator.geolocation.watchPosition(updatePosition, function(){
    displayMessage("Location service is not available!");
}, options);