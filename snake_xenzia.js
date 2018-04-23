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

    function completeField() {
        var topRightCell = document.querySelector('[x="-39"][y="0"].day');
        var rightColumn = topRightCell.parentElement;
        var rightColumnSize = rightColumn.children.length;
        while (rightColumnSize < 7) {
            var rect = rightColumn.children[rightColumnSize - 1].cloneNode();
            rect.setAttribute("y", parseInt(rect.getAttribute("y")) + 12);
            rect.setAttribute("data-count", 0);
            rect.setAttribute("fill", "#ebedf0");
            rightColumn.appendChild(rect);
            rightColumnSize = rightColumn.children.length;
        }
    }

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
        completeField();
    }
})();
