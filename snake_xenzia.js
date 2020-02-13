// ==UserScript==
// @name         Snake Xenzia on Github
// @namespace    https://github.com/daomatys/SnakeXenzia
// @version      0.1
// @description  Github activity graph based game "Snake Xenzia"
// @author       daomatys, oxore
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

const KEY_UP = 38
const KEY_DOWN = 40
const KEY_LEFT = 37
const KEY_RIGHT = 39

const MARK_UP = -11
const MARK_DOWN = -13
const MARK_LEFT = -14
const MARK_RIGHT = -12

class Cell {
    constructor(rect) {
        this.rect = rect;
    }

    set color(color) { this.rect.setAttribute("fill", color); }

    get color() { return this.rect.getAttribute("fill"); }

    set value(value) { this.rect.setAttribute("data-count", value); }

    get value() { return this.rect.getAttribute("data-count"); }

    get x() { return this.rect.getAttribute("x") % 53; }

    get y() { return this.rect.getAttribute("y") % 7; }
}

class Row {
    constructor(rects, n) {
        this.row = [];
        for (let i = 0; i < 53; i++) {
            this.row.push(new Cell(rects[7*i+n]));
        }
    }

    x(x) { return this.row[x]; }
}

class Column {
    constructor(rects, n) {
        this.column = [];
        for (let i = 0; i < 7; i++) {
            this.column.push(new Cell(rects[n*7+i]));
        }
    }

    y(y) { return this.column[y]; }
}

class Field {
    constructor(realGraphRects) {
        this.realGraphRects = realGraphRects;
        let rects = [];
        for (let i = 0; i < realGraphRects.length; i++) {
            rects[i] = realGraphRects[i].cloneNode();
            rects[i].className.baseVal = "dayfake";
            realGraphRects[i].parentElement.appendChild(rects[i]);
        }

        function fieldComplete(rects) {
            let verticalStep = parseInt(rects[1].getAttribute("y"))
                - parseInt(rects[0].getAttribute("y"));
            let lastColumn = rects[rects.length - 1].parentElement;
            let lastColumnSize = lastColumn.children.length;
            for (let i = 0; i < 7 - lastColumnSize / 2; i++) {
                let rect = lastColumn
                    .children[lastColumn.children.length - 1]
                    .cloneNode();
                let y = parseInt(rect.getAttribute("y")) + verticalStep;
                rect.setAttribute("y", y);
                rect.setAttribute("data-count", 0);
                rect.setAttribute("fill", "#ebedf0");
                lastColumn.appendChild(rect);
                rects.push(rect);
            }
        }

        fieldComplete(rects);
        this.rects = rects;

        this.activate();
    }

    set cellsOnClick(callback) {
        this.rects.forEach(
            rect => rect.addEventListener(
                "click",
                function(e) { callback(new Cell(e.target)); }));
    }

    rectsHide(elements) {
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = "none";
        }
    }

    rectsShow(elements) {
        for (let i = 0; i < elements.length; i++) {
            elements[i].style.display = "block";
        }
    }

    activate() {
        this.rectsHide(this.realGraphRects);
        this.rectsShow(this.rects);
    }

    deactivate() {
        this.rectsHide(this.rects);
        this.rectsShow(this.realGraphRects);
    }

    destroy() {
        this.deactivate();
        for (let i = 0; i < this.rects.length; i++) {
            this.rects[i].remove();
        }
    }

    clear() {
        for (let i = 0; i < this.rects.length; i++) {
            this.rects[i].setAttribute("data-count", 0);
            this.rects[i].setAttribute("fill", "#ebedf0");
        }
    }

    n(n) { return new Cell(this.rects[n]); }

    x(x) { return new Column(this.rects, x); }

    y(y) { return new Row(this.rects, y); }
}

class StartButton {
    constructor(buttonId, buttonText) {
        let element = document.createElement("Button");
        element.appendChild(document.createTextNode(buttonText));
        element.classList.add("btn");
        element.id = buttonId;

        let divWrapper = document.createElement("div");
        divWrapper.style.clear = "left";
        divWrapper.appendChild(element);

        this.element = element;
        this.divWrapper = divWrapper;

    }

    attachTo(newParentElement) {
        newParentElement.appendChild(this.divWrapper);
    }

    set onClick(callback) { this.element.addEventListener("click", callback); }

    set text(text) { this.element.innerText = text; }
}

class GithubActivityGraphController {
    constructor(startButtonText, onStartFunction, onFinishFunction){
        this.started = false;

        let startButtonId = startButtonText
            .toLowerCase()
            .replace(" ", "-")
            .concat("-btn");

        let startButton = new StartButton(startButtonId, startButtonText);
        startButton.attachTo(
            document.getElementsByClassName(
                "contrib-footer clearfix mt-1 mx-3 px-3 pb-1")[0]);

        function startButtonOnClick() {
            if (this.started == false) {
                this.started = true;
                startButton.text = "Turn off";

                this.fld = new Field(document.getElementsByClassName("day"));
                this.fld.cellsOnClick = this.cellsOnClickCallback;

                onStartFunction(this);
            } else {
                onFinishFunction(this);

                startButton.text = startButtonText;
                this.fld.destroy();
                this.started = false;
            }
        }

        startButton.onClick = startButtonOnClick.bind(this);

    }

    get field() { return this.fld; }

    set cellsOnClick(callback) { this.cellsOnClickCallback = callback; }
}

class Pos {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class SnakeGame {
    constructor(field) {
        this.hPos = 0;
        this.hWas = 1;
        this.hMove = -1;
        this.tPos = 2;
        this.tWas = 3;
        this.tMove = -1;
        this.s = [2];
        this.sDeath = false;
        this.sVelocity = 200;
        this.pathSummary = 0;
        this.intervalContainer = undefined;

        this.field = field;

        for (let i = this.s.Length; i >= 0; i--) {
            this.field.n(i).color = "#e6af4b";
            this.field.n(i).value = -1;
        }

        window.addEventListener("keydown", this.preventDefaultArrows, false);
        document.onkeydown = this.keyboardArrowsCallback.bind(this);
        this.intervalContainer = window.setInterval(
            this.crawl.bind(this),
            this.sVelocity);
    }

    shutdown() {
        window.removeEventListener("keydown", this.preventDefaultArrows, false);
        document.onkeydown = 0;
        window.clearInterval(this.intervalContainer);
    }

    crawl() {
        if (this.sDeath == true) {
            this.field.n(this.hPos).color = "#ebedf0";
        } else {
            function sBorderFlip(pos, was, move) {
                was = pos;
                pos += move;
                if ((was + 1) % 7 == 0 && (pos + 7) % 7 == 0)
                    pos -= 7;
                if ((pos + 1) % 7 == 0 && (was + 7) % 7 == 0)
                    pos += 7;
                if ((pos < 0 && was < 7))
                    pos += 371;
                if (pos > 371 && was > 363)
                    pos -= 371;
                return pos;
            }

            this.hPos = sBorderFlip(this.hPos, this.hWas, this.hMove);
            this.tPos = sBorderFlip(this.tPos, this.tWas, this.tMove);

            /* Handle Tail */
            if (this.field.n(this.tPos).value == MARK_UP) {
                this.tMove = -1;
            }
            if (this.field.n(this.tPos).value == MARK_RIGHT) {
                this.tMove = 7;
			}
            if (this.field.n(this.tPos).value == MARK_DOWN) {
                this.tMove = 1;
            }
            if (this.field.n(this.tPos).value == MARK_LEFT) {
                this.tMove = -7;
            }
            this.field.n(this.tPos).color = "#ebedf0";
            this.field.n(this.tPos).value = 0;

            /* Handle head */
            if (this.field.n(this.hPos).value < 0 && this.hMove != 0) {
                this.sDeath = true;
                this.field.n(this.hPos).color = "#e05038";
            } else {
                this.field.n(this.hPos).color = "#e6af4b";
                this.field.n(this.hPos).value = -1;
            }

            this.pathSummary++;
        }
    }

    preventDefaultArrows(e) {
        if ([KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }

    keyboardArrowsCallback(e) {
        switch (e.keyCode) {
        case KEY_UP: //u
            if (this.hMove != 1) {
                this.hMove = -1;
                this.field.n(this.hPos).value = MARK_UP;
            }
            break;
        case KEY_RIGHT: //r
            if (this.hMove != -7) {
                this.hMove = 7;
                this.field.n(this.hPos).value = MARK_RIGHT;
            }
            break;
        case KEY_DOWN: //d
            if (this.hMove != -1) {
                this.hMove = 1;
                this.field.n(this.hPos).value = MARK_DOWN;
            }
            break;
        case KEY_LEFT: //l
            if (this.hMove != 7) {
                this.hMove = -7;
                this.field.n(this.hPos).value = MARK_LEFT;
            }
            break;
        }
    }
}

(function() {
    'use strict';

    function cellClickHandler(cell) {
        cell.value = cell.value + 1;
        cell.color = "rgb(35, 154, 59)";
    }

    if (document.getElementsByClassName("js-calendar-graph").length > 0) {
        let gameState = undefined;

        let GAG = new GithubActivityGraphController(
            "Play Snake",
            function(gag) {
                gameState = new SnakeGame(gag.field);
            },
            function() {
                gameState.shutdown();
            });

        GAG.cellsOnClick = cellClickHandler;
    }
})();
