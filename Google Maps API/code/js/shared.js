'use strict';
// Shared code needed by all pages of the app.

// Prefix to use for Local Storage.  You may change this.
var APP_PREFIX = "monash.eng1003.navigationApp";
var availablePaths = [];
var apiKey = "AIzaSyCd4xtuUwuwfAvtkxsMnSq6MbWDI1UrbrM";

// googleLatLng(literal)
//     Converts a LatLng literal to google.maps.LatLng class instance
//     Parameter:
//         literal: latLng literal
//     Return value:
//         Corresponding google.maps.LatLng class instance
function googleLatLng(literal){
    return new google.maps.LatLng(literal.lat, literal.lng);
}

// Path(initialTitle, initialLocations, initialPreRecordedIndex)
//     Constructor for Path class
//     Parameter:
//         initialTitle: Path title
//         initialLocations: Path set of locations (LatLng literal)
//         initialPreRecordedIndex: pre-recorded index
//     Return value:
//         Corresponding google.maps.LatLng class instance
function Path(initialTitle, initialLocations, initialPreRecordedIndex){        

    var _title = initialTitle; 
    var _locations = [];
    var _preRecordedIndex = initialPreRecordedIndex;

    // convert LatLng literal to google.maps.LatLng and store
    for (var i in initialLocations){
        _locations.push(googleLatLng(initialLocations[i]));
    }        

    // title getter
    this.title = function(){
        return _title;
    };
    
    // total length of the path (in meters)
    this.pathLength = function(){
        return google.maps.geometry.spherical.computeLength(_locations);
    };

    // number of waypoints in the path
    this.numLocations = function(){
        return _locations.length;
    }

    // location getter
    this.location = function(index){
        return _locations[index];
    };

    // locations array getter
    this.locations = function(){
        return _locations;
    };
    
    // pre-recorded index getter
    this.preRecordedIndex = function(){
        return _preRecordedIndex;
    };
}

// loadPaths()
//     Load paths details from localStorage, display an error if localStorage is not available
function loadPaths(){
    availablePaths = [];

    if (typeof(Storage) !== "undefined"){
        var i = 0;
        while(1){       // keep loading paths until there is no path left
            if (localStorage.getItem('campus' + i) == null) break;
            var campus = JSON.parse(localStorage.getItem('campus' + i));
            for(var path in campus)
                // construct Path class instance
                availablePaths.push(new Path(campus[path].title, campus[path].locations, campus[path].prerecordedRoutesIndex));
            i++;
        }

        // sort the paths by pre-recorded value
        availablePaths.sort(function(a, b){
            return a.preRecordedIndex() - b.preRecordedIndex();
        });
    }
    else {
        console.log("localStorage is not supported by current browser.");
        displayMessage("localStorage is not supported by current browser.");
    }
}
