// MCD4290 Engineering Mobile Apps | T1, 2018      *
// Assignment 1 - Spirit Level App                 *
// File name: spiritLevel.js                       *
// Team053:                                        *
// .Dinh Khai Nguyen                               *
// .Promit Saha                                    *
// .Renakng Huo                                    *
// .Utkarsh Patel                                  *
//**************************************************

var diff = 5;               // Maximum difference between the angle and its desired angle to keep highlighting
var buffer = [];            // the buffer for smoothing motion
var bufferSize = 25;        // defining the size of the buffer. 
                            // The motion becomes smoother as the bufferSize increases. However the updating speed of the bubble decreases.     
                            // After testing several sizes in range [1, 50], 25 turns out to achieve both the speed and the smoothing motion reasonably

// accelerationToAngleH(accel)
//     Calculating the side-to-side angle
//     This formula is retrieved from calculating angle between a vector and a plane without using the fixed gravity 9.8
//     Parameter:
//         accel: An object containing device's normalised acceleration including gravity in x, y, z axis
//     Return value:
//         Return the side-to-side angle in radian
function accelerationToAngleH(accel){
    return radianToDegree(Math.asin(accel.x/Math.sqrt(Math.pow(accel.x, 2) + Math.pow(accel.y, 2) + Math.pow(accel.z, 2))));
}

// accelerationToAngleV(accel)
//     Calculating the front-to-back angle
//     This formula is retrieved from calculating angle between a vector and a plane without using the fixed gravity 9.8
//     Parameter:
//         accel: An object containing device's normalised acceleration including gravity in x, y, z axis
//     Return value:
//         Return the front-to-back angle in radian
function accelerationToAngleV(accel){
    return radianToDegree(Math.asin(accel.y/Math.sqrt(Math.pow(accel.x, 2) + Math.pow(accel.y, 2) + Math.pow(accel.z, 2))));
}

// bubbleLengthH() | bubbleLengthV()
//     Returns the length of the horizontal and vertical bubbles respectively
//     Return value:
//         Length of the bubble in pixel
function bubbleLengthH(){
    return document.getElementById("horizontal-bubble").offsetWidth;
}

function bubbleLengthV(){
    return document.getElementById("vertical-bubble").offsetHeight;
}

// radianToDegree(rad)
//     Converts from radian to degree
//     Parameter:
//         rad: The angle in radian
//     Return value:
//         The angle in degree (from -90 to 90 in this case)
function radianToDegree(rad){
    return rad * 180 / Math.PI;
}

// angleToPixel(angle, length)
//     Calculating the number of pixels to move the bubble corresponding to the angle
//     Parameter:
//         angle: the current angle of the device, can be beta (front-to-back) or gamma (side-to-side)
//         length: the length of the corresponding bubble track
//     Return value:
//         The angle in degree
function angleToPixel(angle, length){
    return Math.round(angle/90 * length);
}

// removeMarkerStyles(markerId)
//     Removes every style changes from the marker
//     Parameter:
//         markerId: The id of the marker
function removeMarkerStyles(markerId){
    document.getElementById(markerId).removeAttribute("style");
}

// changeColor(markerId)
//     Changes the marker's color for highlighting purpose
//     Parameter:
//         markerId: The id of the marker
function changeColor(markerId){
    document.getElementById(markerId).style.backgroundColor = "rgba(45, 81, 180, 0.3)";
}

// highlightingV() | highlightingH() 
//     Updates the markers' color corresponding to the vertical and horizontal bubble's position
function highlightingV(){
    if (Math.abs(beta - 45) <= diff) changeColor("vertical-25");
        else removeMarkerStyles("vertical-25");
    if (Math.abs(beta) <= diff) changeColor("vertical-50");
        else removeMarkerStyles("vertical-50");
    if (Math.abs(beta + 45) <= diff) changeColor("vertical-75");
        else removeMarkerStyles("vertical-75");
}

function highlightingH(){
    if (Math.abs(gamma + 45) <= diff) changeColor("horizontal-25");
        else removeMarkerStyles("horizontal-25");
    if (Math.abs(gamma) <= diff) changeColor("horizontal-50");
        else removeMarkerStyles("horizontal-50");
    if (Math.abs(gamma - 45) <= diff) changeColor("horizontal-75");
        else removeMarkerStyles("horizontal-75");
}

// deviceMotionUpdate(event)
//     Callback function which performs operations on the devicemtion event:
//         - Normalizing the acceleration data
//         - Updating the buffer and calculating smooth values
//         - Updating the bubbles' position and markers' color
//     Parameter:
//         event: the object containing properties of the event
function deviceMotionUpdate(event){

    accel = deviceMotionNormalisedAccelerationIncludingGravity(event);      // Normalising acceleration data for iOS device

    beta = accelerationToAngleV(accel);
    gamma = accelerationToAngleH(accel);

    if (buffer.length === bufferSize) buffer.shift();                       // remove the first element of the buffer
    buffer.push([beta, gamma]);                                             // add the pair of beta and gamma to the end of the buffer

    beta = gamma = 0;                                                       // reset the beta and gamma for calculating average values  
    for (var i = 0; i < buffer.length; i++){                                // compute the average beta and gamma
        beta += buffer[i][0];
        gamma += buffer[i][1];
    }
    beta /= buffer.length;
    gamma /= buffer.length;

    // number of pixel to move the vertical bubble
    // for the vertical bubble, take the additive inverse because positve direction of beta is opposite to offsetBubble()
    var pxToMoveV = -angleToPixel(beta, (bubbleTrackLengthV() - bubbleLengthV())/2);
    var pxToMoveH = angleToPixel(gamma, (bubbleTrackLengthH() - bubbleLengthV())/2);

    // updating the bubble and the markers' color
    offsetBubble(0, pxToMoveV, "vertical-bubble");
    offsetBubble(pxToMoveH, 0, "horizontal-bubble");

    highlightingV();
    highlightingH();

    // displaying beta and gamma along the bubble track
    document.getElementById("beta").innerHTML = Math.round(beta) + "°";
    document.getElementById("gamma").innerHTML = Math.round(gamma) + "°";
}

// addExtraFeature()
//     displaying the beta and gamma along the bubble tracks
function addExtraFeature(){

    // create div tag for beta and gamma
    var betaRef = document.createElement("div");
    var gammaRef = document.createElement("div");

    // set id and style attributes
    betaRef.setAttribute("id", "beta");
    gammaRef.setAttribute("id", "gamma");
    betaRef.setAttribute("style", "right: 20vw; top: calc(88px + 40vw); font-size: 18px; position: fixed;");
    gammaRef.setAttribute("style", "left: calc(50vw - 5px); top: calc(95px + 80vw); font-size: 18px; position: fixed;");

    // insert the nodes
    document.getElementById("vertical-track").parentNode.appendChild(betaRef);
    document.getElementById("vertical-track").parentNode.appendChild(gammaRef);
}

window.addEventListener("devicemotion", deviceMotionUpdate);                // add "devicemotion" EventListener
addExtraFeature();