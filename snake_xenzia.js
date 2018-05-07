// ==UserScript==
// @name         Snake Xenzia on Github
// @namespace    https://github.com/daomatys/SnakeXenzia
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

    function removeAll(rects) {
        for (var i = 0; i < rects.length; i++)
            rects[i].remove();
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
            fakes[i].addEventListener("click", cellClickHandler, false);
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
            fakeRects = duplicateAll(realRects);
            completeField(fakeRects);
            hideAll(realRects);
            window.addEventListener("keydown", preventDefaultArrows, false);
            document.onkeydown = keyboardArrowsCallback;
            startButton.innerText = "Turn Off";
            hPos = 0; hWas = 1; hMove = 0; tMove = 0; tPos = 3; s = [2];
            sDeath = false; sVelocity = 200; sPathSummary = 0;
            for (i = 2; i >= 0; i--) {
                fakeRects[i].style.fill = "#e6af4b";
                fakeRects[i].setAttribute("data-count", -1);
                }
            intervalContainer = window.setInterval(sCrawling, sVelocity);
            gameState = "on";

        } else {
            removeAll(fakeRects);
            showAll(realRects);
            window.removeEventListener("keydown", preventDefaultArrows, false);
            document.onkeydown = 0;
            startButton.innerText = "Play Snake";
            window.clearInterval(intervalContainer);
            gameState = "off";
        }
    }

    function preventDefaultArrows(e) {
        if ([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }

    function keyboardArrowsCallback(e) {
        switch (e.keyCode) {
            case 37: //l
                if (hMove != 7) {
                    hMove = -7;
                    fakeRects[hPos].setAttribute("data-count", -4); }
                break;
            case 38: //u
                if (hMove != 1) {
                    hMove = -1;
                    fakeRects[hPos].setAttribute("data-count", -1); }
                break;
            case 39: //r
                if (hMove != -7) {
                    hMove = 7;
                    fakeRects[hPos].setAttribute("data-count", -2); }
                break;
            case 40: //d
                if (hMove != -1) {
                    hMove = 1;
                    fakeRects[hPos].setAttribute("data-count", -3); }
                break;
        }
    }

    function cellClickHandler(e) {
        e.target.setAttribute("data-count", parseInt(e.target.getAttribute("data-count")) + 1);
        e.target.style.fill = "rgb(35, 154, 59)";
    }

    function sBorderFlip() {
        if ((hWas + 1) % 7 == 0 && (hPos + 7) % 7 == 0)
            hPos -= 7;
        if ((hPos + 1) % 7 == 0 && (hWas + 7) % 7 == 0)
            hPos += 7;
        if ((hPos < 0 && hWas < 7))
            hPos += 371;
        if (hPos > 371 && hWas > 363)
            hPos -= 371;
    }

    function sHead() {
        if (fakeRects[hPos].getAttribute("data-count") == -1 && hMove != 0) {
            sDeath = true;
            fakeRects[hPos].style.fill = "#e05038";
        }
        else {
            fakeRects[hPos].style.fill = "#e6af4b";
            fakeRects[hPos].setAttribute("data-count", -1);
        }
    }

    function sTail() {
        switch (fakeRects[hPos].getAttribute("data-count")) {
            case -4: //l
                tMove = -7;
                break;
            case -1: //u
                tMove = -1;
                break;
            case -2: //r
                tMove = 7;
                break;
            case -3: //d
                tMove = 1;
                break;
        }
        //tPos += tMove;
        fakeRects[tPos].style.fill = "#ebedf0";
        fakeRects[tPos].setAttribute("data-count", 0);
    }

    function sCrawling() {
        sPathSummary++;
        if (sPathSummary == 1) {
            hMove = -1; tMove = -1; }
        if (sDeath) {
            fakeRects[hPos].style.fill = "#ebedf0"; }
        else {
            hWas = hPos;
            hPos += hMove;
            tWas = tPos;
            tPos += tMove;
            sBorderFlip();
            sHead();
            sTail();
        }
    }

    var activityGraph = document.getElementsByClassName("js-contribution-graph");
    if (activityGraph.length > 0) {
        var gameState = "off";
        var startButton = createStartButton();
        drawStartButton(startButton, activityGraph);
        startButton.addEventListener("click", switchGameState);
        var fakeRects, realRects = document.getElementsByClassName("day");
        var s, i, tPos, hPos, tWas, hWas, tMove, hMove, sVelocity, sPathSummary, sDeath, intervalContainer;
    }
})();
