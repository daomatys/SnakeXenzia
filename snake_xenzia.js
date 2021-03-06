// ==UserScript==
// @name          SnakeXenziaGithub
// @namespace     https://github.com/daomatys/SnakeXenzia
// @version       0.26
// @description   Github activity graph based game "Snake Xenzia"
// @author        daomatys, oxore
// @match         https://github.com/*
// @grant         none
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

const CELL_COLOR_VIOLET = "#7c26cb"
const CELL_COLOR_YELLOW = "#e6af4b"
const CELL_COLOR_RED = "#e05038"

class Vec {
  constructor(x, y) { this.x = x; this.y = y; }
}

const DIRECTION_UP = new Vec(0, -1);
const DIRECTION_DOWN = new Vec(0, 1);
const DIRECTION_LEFT = new Vec(-1, 0);
const DIRECTION_RIGHT = new Vec(1, 0);


class Cell {
  
  constructor(rect) { this.rect = rect; }
  
  set color(color) { this.rect.style.fill = color; }
  
  set value(value) { this.rect.setAttribute("data-count", value); }
  
  get color() { return this.rect.style.fill }
  
  get value() { return this.rect.getAttribute("data-count"); }
  
  get x() { return this.rect.getAttribute("x") % 53; }
  
  get y() { return this.rect.getAttribute("y") % 7; }
}


class Row {
  
  constructor(rects, n) {
    this.row = [];
    for (let i = 0; i < 53; i++) {
      this.row.push(new Cell(rects[i * 7 + n]));
    }
  }
  
  x(x) {
    return this.row[x];
  }
  
}


class Column {
  
  constructor(rects, n) {
    this.column = [];
    for (let i = 0; i < 7; i++) {
      this.column.push(new Cell(rects[n * 7 + i]));
    }
  }
  
  y(y) {
    return this.column[y];
  }
  
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
      rects[i].setAttribute("data-count", 0);
    }
    function fieldComplete(rects) {
      let verticalStep = parseInt(rects[1].getAttribute("y")) - parseInt(rects[0].getAttribute("y"));
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
  
  n(n) {
    return new Cell(this.rects[n]); 
  }
  
  x(x) {
    return new Column(this.rects, x); 
  }
  
  y(y) {
    return new Row(this.rects, y); 
  }
  
  byVec(vec) {
    return this.x(vec.x).y(vec.y);
  }
  
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
  
  set onClick(callback) {
    this.element.addEventListener("click", callback); 
  }
  
  set text(text) {
    this.element.innerText = text; 
  }
  
}


class GithubActivityGraphController {
  
  constructor(startButtonText, onStartFunction, onFinishFunction) {
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
        
        this.fld = new Field(document
          .getElementsByClassName("js-calendar-graph-svg")[0]
          .getElementsByClassName("ContributionCalendar-day"));
        
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
  
  get field() {
    return this.fld; 
  }
  
  set cellsOnClick(callback) {
    this.cellsOnClickCallback = callback;
  }
  
}


class SnakeGame {
  
  constructor(field) {
    this.snakeSize = 5;
    this.snakeVelocity = 160;
    
    this.snakeHeadLocation = new Vec(-1, 3);
    this.snakeHeadMove = new Vec(1, 0);
    
    this.snakeTailLocation = new Vec(FIELD_WIDTH-1-this.snakeSize, 3);
    this.snakeTailMove = new Vec(1, 0);
    
    this.snakeDeathAlert = true;
    this.snakeDeathCondition = false;
    this.snakeFeedCondition = false;
    
    this.foodSpawnCommon = false;
    this.foodSpawnEpic = false;
    this.foodSpawnEpicCounter = 0;
    
    this.pathSummary = 0;
    
    this.intervalContainer = undefined;
    this.field = field;
    
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
      
      switch(this.snakeDeathAlert) {
        case true:
          this.field.byVec(this.snakeHeadLocation).color = CELL_COLOR_RED;
          this.snakeDeathAlert = false;
          break;
          
        case false:
          this.field.byVec(this.snakeHeadLocation).color = CELL_COLOR_YELLOW;
          this.snakeDeathAlert = true;
          break;
      }
    } else {
      function snakeCrawlingEngine(pos, move) {
        pos.x += move.x;
        pos.x < 0 ? pos.x = FIELD_WIDTH - 1 : null;
        pos.x > FIELD_WIDTH - 1 ? pos.x = 0 : null;
        
        pos.y += move.y;
        pos.y < 0 ? pos.y = FIELD_HEIGHT - 1 : null;
        pos.y > FIELD_HEIGHT - 1 ? pos.y = 0 : null;
        return pos;
      }
      
      this.snakeHeadLocation = snakeCrawlingEngine(this.snakeHeadLocation, this.snakeHeadMove);
      if (this.snakeFeedCondition == false) {
        this.snakeTailLocation = snakeCrawlingEngine(this.snakeTailLocation, this.snakeTailMove);
      } else {
        this.snakeFeedCondition = false;
      }
      
      /* Handle Tail */
      if (this.field.byVec(this.snakeTailLocation).value == MARK_UP) {
        this.snakeTailMove = DIRECTION_UP;
      } else if (this.field.byVec(this.snakeTailLocation).value == MARK_DOWN) {
        this.snakeTailMove = DIRECTION_DOWN;
      } else if (this.field.byVec(this.snakeTailLocation).value == MARK_LEFT) {
        this.snakeTailMove = DIRECTION_LEFT;
      } else if (this.field.byVec(this.snakeTailLocation).value == MARK_RIGHT) {
        this.snakeTailMove = DIRECTION_RIGHT;
      }
      this.field.byVec(this.snakeTailLocation).color = CELL_COLOR_EMPTY;
      this.field.byVec(this.snakeTailLocation).value = 0;
      
      /* Handle Head */
      if (this.field.byVec(this.snakeHeadLocation).value < 0 && this.snakeHeadMove != 0) {
        this.snakeDeathCondition = true;
      } else {
        if (this.field.byVec(this.snakeHeadLocation).value > 0 ) {
          this.snakeFeedCondition = true;
          this.snakeSize++;
          if (this.field.byVec(this.snakeHeadLocation).value == 3 ) {
            this.foodSpawnCommon = false;
          }
        }
        this.field.byVec(this.snakeHeadLocation).color = CELL_COLOR_YELLOW;
        this.field.byVec(this.snakeHeadLocation).value = -1;
      }
      if (this.foodSpawnCommon == false) {
        this.food();
      }
      this.pathSummary++;
    }
  }


  food() {
    const getRandomInt = max => Math.floor(Math.random() * Math.floor(max));
    
    this.foodRandomLocation = new Vec(getRandomInt(FIELD_WIDTH), getRandomInt(FIELD_HEIGHT));
    
    while (this.field.byVec(this.foodRandomLocation).value < 0) {
      this.foodRandomLocation = new Vec(getRandomInt(FIELD_WIDTH), getRandomInt(FIELD_HEIGHT));
    }
    this.foodSpawnCommon = true;
    this.field.byVec(this.foodRandomLocation).color = CELL_COLOR_L3;
    this.field.byVec(this.foodRandomLocation).value = 3;
  }
  
  
  preventDefaultArrows(e) {
    if ([KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT].indexOf(e.keyCode) > -1) {
      e.preventDefault();
    }
  }
  
  
  keyboardArrowsCallback(e) {
    switch (e.keyCode) {
    case KEY_UP:
      if (this.snakeHeadMove != DIRECTION_DOWN) {
        this.snakeHeadMove = DIRECTION_UP;
        this.field.byVec(this.snakeHeadLocation).value = MARK_UP;
      }
      break;
      
    case KEY_DOWN:
      if (this.snakeHeadMove != DIRECTION_UP) {
        this.snakeHeadMove = DIRECTION_DOWN;
        this.field.byVec(this.snakeHeadLocation).value = MARK_DOWN;
      }
      break;
      
    case KEY_LEFT:
      if (this.snakeHeadMove != DIRECTION_RIGHT) {
        this.snakeHeadMove = DIRECTION_LEFT;
        this.field.byVec(this.snakeHeadLocation).value = MARK_LEFT;
      }
      break;
      
    case KEY_RIGHT:
      if (this.snakeHeadMove != DIRECTION_LEFT) {
        this.snakeHeadMove = DIRECTION_RIGHT;
        this.field.byVec(this.snakeHeadLocation).value = MARK_RIGHT;
      }
      break;
    }
  }
}


(function() {
  'use strict';
  
  function cellClickHandler(cell) {
    cell.value = 1;
    cell.color = CELL_COLOR_L1;
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