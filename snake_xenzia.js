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
            rects[rects.length] = rect;
            rightColumnSize = rightColumn.children.length;
        }
    }

    function hideAll(rects) {
        for (var i = 0; i < rects.length; i++)
            rects[i].style.display = "none";
    }

    function showAll(rects) {
        for (var i = 0; i < rects.length; i++)
            rects[i].style.display = "block";
    }

    function duplicateAll(rects) {
        var fakes = [];
        for (var i = 0; i < rects.length; i++) {
            fakes[i] = rects[i].cloneNode();
            fakes[i].className.baseVal = "dayfake";
            rects[i].parentElement.appendChild(fakes[i]);
        }
        return fakes;
    }

    function createStartButton() {
        var startButton = document.createElement("Button");
        var startButtonLabel = document.createTextNode("Play Snake");
        startButton.appendChild(startButtonLabel);
        startButton.classList.add("btn");
        startButton.id = "startButton";
        return startButton;
    }

    function drawStartButton(startButton, activityGraph) {
        var startButtonDiv = document.createElement("div");
        startButtonDiv.style.clear = "left";
        startButtonDiv.appendChild(startButton);
        var footer = activityGraph[0].getElementsByClassName("contrib-footer clearfix mt-1 mx-3 px-3 pb-1");
        footer[0].appendChild(startButtonDiv);
    }

    function switchGameState() {
        if (gameState == "off") {
            hideAll(realRects);
            showAll(fakeRects);
            startButton.innerText = "Turn Off";
            gameState = "on";
        } else {
            hideAll(fakeRects);
            showAll(realRects);
            startButton.innerText = "Play Snake";
            gameState = "off";
        }
    }

    var activityGraph = document.getElementsByClassName("js-contribution-graph");
    if (activityGraph.length > 0) {
        var gameState = "off";
        var startButton = createStartButton();
        drawStartButton(startButton, activityGraph);
        startButton.addEventListener("click", switchGameState);
        var realRects = document.getElementsByClassName("day");
        var fakeRects = duplicateAll(realRects);
        hideAll(fakeRects);
        completeField(fakeRects);
    }
})();
