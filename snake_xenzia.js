// ==UserScript==
// @name         Snake Xenzia on Github
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Github activity graph based game "Snake Xenzia"
// @author       daomatys, oxore
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function drawStartButton() {
        var startButtonDiv = document.createElement("div");
        var startButton = document.createElement("Button");
        var startButtonLabel = document.createTextNode("Play Snake");
        startButtonDiv.appendChild(startButton);
        startButton.appendChild(startButtonLabel);
        startButton.classList.add("btn");
        var footer = activityGraph[0].getElementsByClassName("contrib-footer clearfix mt-1 mx-3 px-3 pb-1");
        footer[0].appendChild(startButtonDiv);
    }

    var activityGraph = document.getElementsByClassName("js-contribution-graph");
    if (activityGraph.length > 0) {
       drawStartButton();
    }
})();
