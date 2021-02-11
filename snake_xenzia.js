// ==UserScript==
// @name         SnakeXenziaGithub
// @namespace    https://github.com/daomatys/SnakeXenzia
// @version      0.2
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

const FIELD_HEIGHT = 7
const FIELD_WIDTH = 53

const CELL_COLOR_EMPTY = "var(--color-calendar-graph-day-bg)"
const CELL_COLOR_L1 = "var(--color-calendar-graph-day-L1-bg)"
const CELL_COLOR_L2 = "var(--color-calendar-graph-day-L2-bg)"
const CELL_COLOR_L3 = "var(--color-calendar-graph-day-L3-bg)"
const CELL_COLOR_L4 = "var(--color-calendar-graph-day-L4-bg)"

const CELL_COLOR_YELLOW = "#e6af4b"
const CELL_COLOR_RED = "#e05038"

class Vec {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Cell {
    constructor(rect) {
        this.rect = rect;
    }

    set color(color) { this.rect.style.fill = color; }

    get color() { return this.rect.style.fill }

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
            rects[i].style.fill = CELL_COLOR_EMPTY;
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
                rect.style.fill = CELL_COLOR_EMPTY;
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
            this.rects[i].style.fill = CELL_COLOR_EMPTY;
        }
    }

    n(n) { return new Cell(this.rects[n]); }

    x(x) { return new Column(this.rects, x); }

    y(y) { return new Row(this.rects, y); }

    byVec(vec) { return this.x(vec.x).y(vec.y) }
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
            document.getElementsByClassName("js-calendar-graph")[0]);

        function startButtonOnClick() {
            if (this.started == false) {
                this.started = true;
                startButton.text = "Turn off";

                this.fld = new Field(document.getElementsByClassName("js-calendar-graph-svg")[0].getElementsByClassName("ContributionCalendar-day"));
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

class SnakeGame {
    constructor(field) {
		this.snakeSize = [6];
        this.snakeVelocity = 200;	
		
        this.snakeHeadLocation = new Vec(0, 0);
        this.snakeHeadMove = new Vec(0, -1);
		
        this.snakeTailLocation = new Vec(0, 6);
        this.snakeTailMove = new Vec(0, -1);
		
        this.snakeDeathCondition = false;
      	this.snakeFeedCondition = false;		

        this.pathSummary = 0;
        this.intervalContainer = undefined;
        this.field = field;

        for (let i = this.snakeSize.Length; i >= 0; i--) {
            this.field.n(i).color = CELL_COLOR_YELLOW;
            this.field.n(i).value = -1;
        }

        window.addEventListener("keydown", this.preventDefaultArrows, false);
        document.onkeydown = this.keyboardArrowsCallback.bind(this);
        this.intervalContainer = window.setInterval(
            this.crawl.bind(this),
            this.snakeVelocity);
    }

    shutdown() {
        window.removeEventListener("keydown", this.preventDefaultArrows, false);
        document.onkeydown = 0;
        window.clearInterval(this.intervalContainer);
    }

    crawl() {
        if (this.snakeDeathCondition == true) {
            this.field.byVec(this.snakeHeadLocation).color = CELL_COLOR_EMPTY;
        } else {
            function moveWithFlip(pos, move) {
                pos.x += move.x;
                pos.y += move.y;
                if (pos.x < 0)
                    pos.x = FIELD_WIDTH - 1;
                if (pos.x > FIELD_WIDTH - 1)
                    pos.x = 0;
                if (pos.y < 0)
                    pos.y = FIELD_HEIGHT - 1;
                if (pos.y > FIELD_HEIGHT - 1)
                    pos.y = 0;
                return pos;
            }

			this.snakeHeadLocation = moveWithFlip(this.snakeHeadLocation, this.snakeHeadMove);
			this.snakeTailLocation = moveWithFlip(this.snakeTailLocation, this.snakeTailMove);

			/* Handle Tail */
			if (this.snakeFeedCondition == false) {				
				if (this.field.byVec(this.snakeTailLocation).value == MARK_UP) {
					this.snakeTailMove = new Vec(0, -1);
				}
				if (this.field.byVec(this.snakeTailLocation).value == MARK_RIGHT) {
					this.snakeTailMove = new Vec(1, 0);
				}
				if (this.field.byVec(this.snakeTailLocation).value == MARK_DOWN) {
					this.snakeTailMove = new Vec(0, 1);
				}
				if (this.field.byVec(this.snakeTailLocation).value == MARK_LEFT) {
					this.snakeTailMove = new Vec(-1, 0);
				}				
				this.field.byVec(this.snakeTailLocation).color = CELL_COLOR_EMPTY;
				this.field.byVec(this.snakeTailLocation).value = 0;					
			} else {
				this.snakeFeedCondition = false;
			}

            /* Handle head */
            if (this.field.byVec(this.snakeHeadLocation).value < 0 && this.snakeHeadMove != 0) {
                this.snakeDeathCondition = true;
                this.field.byVec(this.snakeHeadLocation).color = CELL_COLOR_RED;
            } else {
                if (this.field.byVec(this.snakeHeadLocation).value > 0 ) {
                	this.snakeFeedCondition = true;
              	}
                this.field.byVec(this.snakeHeadLocation).color = CELL_COLOR_YELLOW;
                this.field.byVec(this.snakeHeadLocation).value = -1;
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
            if (this.snakeHeadMove != new Vec(0, 1)) {
                this.snakeHeadMove = new Vec(0, -1);
                this.field.byVec(this.snakeHeadLocation).value = MARK_UP;
            }
            break;
        case KEY_RIGHT: //r
            if (this.snakeHeadMove != new Vec(-1, 0)) {
                this.snakeHeadMove = new Vec(1, 0);
                this.field.byVec(this.snakeHeadLocation).value = MARK_RIGHT;
            }
            break;
        case KEY_DOWN: //d
            if (this.snakeHeadMove != new Vec(0, -1)) {
                this.snakeHeadMove = new Vec(0, 1);
                this.field.byVec(this.snakeHeadLocation).value = MARK_DOWN;
            }
            break;
        case KEY_LEFT: //l
            if (this.snakeHeadMove != new Vec(1, 0)) {
                this.snakeHeadMove = new Vec(-1, 0);
                this.field.byVec(this.snakeHeadLocation).value = MARK_LEFT;
            }
            break;
        }
    }
}

(function() {
    'use strict';

    function cellClickHandler(cell) {
        cell.value = 3;
        cell.color = CELL_COLOR_L3;
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
