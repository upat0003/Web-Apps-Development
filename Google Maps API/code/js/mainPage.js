'use strict';
// Code for the Main page of the app.

var campusList = ["clayton", "sunway"];
var campusCount = 0;

// jsonpRequest(url, data)
//     Send a JSONP request to url with query string from data
//     Parameter:
//         url: URL to the target
//         data: contain query data
function jsonpRequest(url, data){
    var params = "";
    for (var key in data){
        if (data.hasOwnProperty(key)){
            if (params.length == 0){
                // First parameter starts with '?'
                params += "?";
            }
            else{
                // Subsequent parameter separated by '&'
                params += "&";
            }
            var encodedKey = encodeURIComponent(key);
            var encodedValue = encodeURIComponent(data[key]);
            params += encodedKey + "=" + encodedValue;
         }
    }
    var script = document.createElement('script');
    script.src = url + params;
    document.body.appendChild(script);
}

function pathsResponse(paths){

    if (typeof(Storage) !== "undefined"){
        // Stringify the paths
        var pathsJSON = JSON.stringify(paths);
        // Saving the stringified data in the local storage, key in form campusX where X = 0, 1, ...
        localStorage.setItem('campus' + campusCount, pathsJSON);
        campusCount++;
    }
    else {
        // show toast message
        displayMessage("localStorage is not supported by current browser.");
    }
}

// loadFromWeb()
//     Send JSONP requests to every campus in campusList[]
function loadFromWeb(){

    var url = "https://eng1003.monash/api/campusnav/";
    var data = {
        campus: "",
        callback: "pathsResponse"
    };

    for (var i in campusList){
        data.campus = campusList[i];
        jsonpRequest(url, data);
    }
}

// showPaths()
//     Display paths list in the main page
function showPaths(){
    var pathsListRef = document.getElementById("pathsList");
    while (pathsListRef.firstChild) {       // remove all the paths in the current list
        pathsListRef.removeChild(pathsListRef.firstChild);
    }

    for (var i in availablePaths){

        var item = document.createElement("li");                // create <li>
        var content = document.createElement("span");           // create <span>
        var title = document.createElement("span");             // create child <span>
        var extraInfo = document.createElement("span");         // create child <span>

        item.setAttribute("class", "mdl-list__item mdl-list__item--two-line");  // set to MDL list class
        item.setAttribute("onclick", "viewPath(" + i + ')');                    // jump to navigation view
        content.setAttribute("class", "mdl-list__item-primary-content");        // set to MDL list item class
        extraInfo.setAttribute("class", "mdl-list__item-sub-title");            // set to MDL item sub title class
        title.innerHTML = availablePaths[i].title();                            // set Path title
        // display length and number of turns
        extraInfo.innerHTML = availablePaths[i].pathLength().toFixed(1) + " metres | " + availablePaths[i].numLocations() + " turns";

        content.appendChild(title);         // add title
        content.appendChild(extraInfo);     // add extra info
        item.appendChild(content);          // add to MDL item

        pathsListRef.appendChild(item);     // add to DOM
    }
}

function viewPath(pathIndex)
{
    // Save the selected path index to local storage so it can be accessed
    // from the Navigate page.
    localStorage.setItem(APP_PREFIX + "-selectedPath", pathIndex);
    // ... and then load the Navigate page.
    location.href = 'navigate.html';
}

loadFromWeb();
loadPaths();
showPaths();