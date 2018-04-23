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

    function completeField(rects) {
        var rightColumn = rects[rects.length - 1].parentElement;
        var rightColumnInitSize = rightColumn.children.length;
        var rightColumnSize = rightColumn.children.length;
        while (rightColumnSize < 7 + rightColumnInitSize / 2) {
            var rect = rightColumn.children[rightColumnSize - 1].cloneNode();
            rect.setAttribute("y", parseInt(rect.getAttribute("y")) + 12);
            rect.setAttribute("data-count", 0);
            rect.setAttribute("fill", "#ebedf0");
            rightColumn.appendChild(rect);
            rightColumnSize = rightColumn.children.length;
        }
    }

    function hideAll(rects) {
        for (var i = 0; i < rects.length; i++)
            rects[i].style.display = "none";
    }

    function duplicateAll(rects) {
        var fakes = [];
        for (var i = 0; i < rects.length; i++) {
            fakes[i] = rects[i].cloneNode();
            fakes[i].className.baseVal = "day2";
            rects[i].parentElement.appendChild(fakes[i]);
        }
        return fakes;
    }

    function drawStartButton(activityGraph) {
        var startButtonDiv = document.createElement("div");
        var startButton = document.createElement("Button");
        var startButtonLabel = document.createTextNode("Play Snake");
        startButtonDiv.style.clear = "left";
        startButtonDiv.appendChild(startButton);
        startButton.appendChild(startButtonLabel);
        startButton.classList.add("btn");
        var footer = activityGraph[0].getElementsByClassName("contrib-footer clearfix mt-1 mx-3 px-3 pb-1");
        footer[0].appendChild(startButtonDiv);
    }

    var activityGraph = document.getElementsByClassName("js-contribution-graph");
    if (activityGraph.length > 0) {
        drawStartButton(activityGraph);
        var realRects = document.getElementsByClassName("day");
        var fakeRects = duplicateAll(realRects);
        hideAll(realRects);
        completeField(fakeRects);
    }
})();
