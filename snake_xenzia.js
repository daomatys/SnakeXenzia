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
            hugeSnake = []; selfHarm = false; goSnake = 0; moveSnake = 0; prevSnake = 0; endPulse = 0;
            startButton.innerText = "Turn Off";
            intervalContainer = window.setInterval(actionsSnake, 140);
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
            case 37:
                if (moveSnake != 7)
                    moveSnake = -7; //left
                break;
            case 38:
                if (moveSnake != 1)
                    moveSnake = -1; //up
                break;
            case 39:
                if (moveSnake != -7)
                    moveSnake = 7; //right
                break;
            case 40:
                if (moveSnake != -1)
                    moveSnake = 1; //down
                break;
        }
    }

    function cellClickHandler(e) {
        e.target.setAttribute("data-count", parseInt(e.target.getAttribute("data-count")) + 1);
        e.target.style.fill = "rgb(35, 154, 59)";
    }

    function borderTeleporter() {
        if ((prevSnake + 1) % 7 == 0 && (goSnake + 7) % 7 == 0)
            goSnake -= 7;
        if ((goSnake + 1) % 7 == 0 && (prevSnake + 7) % 7 == 0)
            goSnake += 7;
        if ((goSnake < 0 && prevSnake < 7))
            goSnake += 371;
        if (goSnake > 370 && prevSnake > 363)
            goSnake -= 371;
    }

    function segmentSnake() {
        fakeRects[goSnake].style.fill = "#e6af4b";
        fakeRects[goSnake].setAttribute("data-count", -1); //wandering
        //fakeRects[prevSnake].style.fill = "#ebedf0";
    }

    function movementSnake() {
        if (fakeRects[goSnake].getAttribute("data-count") > 0) //yummy!
            hugeSnake.push();
        if (fakeRects[goSnake].getAttribute("data-count") == -1 && moveSnake != 0) { //bloodbath
            selfHarm = true;
            fakeRects[goSnake].style.fill = "#e05038";
        } else
            segmentSnake();
    }

    function actionsSnake() {
        if (selfHarm) {
            fakeRects[goSnake].style.fill = "#ebedf0";
            //   TODO: Implement blinking without call a switchGameState()
            //   function, because it must be called only on startButton
            //   click event
            //if (endPulse++ > 10)
            //    var gameState = "off";
            //else
            //    switchGameState();
        } else {
            prevSnake = goSnake;
            goSnake += moveSnake;
            borderTeleporter();
            movementSnake();
        }
    }

    var activityGraph = document.getElementsByClassName("js-contribution-graph");
    if (activityGraph.length > 0) {
        var gameState = "off";
        var startButton = createStartButton();
        drawStartButton(startButton, activityGraph);
        startButton.addEventListener("click", switchGameState);
        var fakeRects, realRects = document.getElementsByClassName("day");
        var hugeSnake = [];
        var selfHarm = false;
        var goSnake = 0, moveSnake = 0, prevSnake = 0, endPulse = 0;
        var intervalContainer;
    }
})();
