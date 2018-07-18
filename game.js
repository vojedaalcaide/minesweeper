// constants
const MINE_SYMBOL = 9;
const EMPTY_SYMBOL = 0;
const BOMB_CHAR = '*';

// classes
const ID_MAIN_CONTAINER = 'minesweeper-container';
const CLASS_REVEALED = 'revealed';
const CLASS_CELL_BTN = 'cell-btn';
const CLASS_BOMB = 'cell-bomb';
const CLASS_EXPLODE = 'cell-explode';
const CLASS_WIN = 'cell-win';
const CLASS_USER_MARK = 'cell-marked';
const CLASS_CELL_NUMBER_PREFIX = 'cell-';
const ID_RESULT_DIV = 'result-div';
const CLASS_RESULT_WIN = 'win';
const CLASS_RESULT_LOSE = 'lose';
const ID_DIFFICULTY_SELECT = 'difficulty-select';
const ID_PLAY_BTN = 'play-btn';
const ID_TIMER = 'timer-txt';

// difficulty modes
const DIFFICULTY_MODE = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
    IMPOSSIBLE: 'IMPOSSIBLE'
};
// Difficulty configurations
const DIFFICULTY_CONFIG = {
    EASY: {
        sizeX: 16,
        sizeY: 16,
        numMines: 20,
    },
    MEDIUM: {
        sizeX: 20,
        sizeY: 20,
        numMines: 30,
    },
    HARD: {
        sizeX: 20,
        sizeY: 20,
        numMines: 50,
    },
    IMPOSSIBLE: {
        sizeX: 25,
        sizeY: 25,
        numMines: 100,
    },
}

// variables (may be setted by users)
// var SIZE_X = 20;
// var SIZE_Y = 20;
// var NUM_MINES = 30;
var CELL_SIZE = 25; // in pixels (px)


// mine sweeper object instance
var mineSweeper;
// current selected difficulty
var currentDificulty = DIFFICULTY_MODE.MEDIUM;
// timer in seconds
var secondsPlayed;
// interval
var interval;
// start time
var startTime;

$(document).ready(function(){

    resetGame();

    $('#' + ID_DIFFICULTY_SELECT).val(DIFFICULTY_MODE.MEDIUM);
    $('#' + ID_PLAY_BTN).on('click', function(ev){
        currentDificulty = $('#' + ID_DIFFICULTY_SELECT).val();
        resetGame();
    });  
});

function resetGame() {
    var diffConfig = getDifficultyConfig(currentDificulty);
    mineSweeper = new MineSweeper({
        cellSize: CELL_SIZE,
        sizeX: diffConfig.sizeX,
        sizeY: diffConfig.sizeY,
        numMines: diffConfig.numMines,
    }, {
        gameWin: onGameWin,
        gameOver: onGameOver
    });
    resetUI();
}

// Initialize the UI and user events
function resetUI() {
    var uiConfig = getDifficultyConfig(currentDificulty);
    var $container = $('#' + ID_MAIN_CONTAINER);
    // mount panel
    $container.css({
        width: uiConfig.sizeX * CELL_SIZE + 'px',
        height: uiConfig.sizeY * CELL_SIZE + 'px',
    });
    $container.empty();
    resetResultDiv();

    // print cells
    for (var y = 0; y < uiConfig.sizeY; y++) {
        for (var x = 0; x < uiConfig.sizeX; x++) {
            $container.append('<button id="cell-' + y + '-' + x + '" class="cell-btn"></button>');
        }
    }
    $('.' + CLASS_CELL_BTN).css({width: CELL_SIZE + 'px', height: CELL_SIZE + 'px'});

    setCellListeners();
    startTimer();
}

// Setting up click events on cells
function setCellListeners() {
    $('.' + CLASS_CELL_BTN)
    .on('click', function(ev) {
        onCellClick(this);        
    })
    .on('mousedown', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.which === 3) { // right mouse click
            onCellRightClick(this);
        }
    });
}

// on click buttons callback
function onCellClick(cellElement) {
    var splitted = $(cellElement).attr('id').split('-');
    var posY = parseInt(splitted[1], 10);
    var posX = parseInt(splitted[2], 10);
    var listRevealed = mineSweeper.revealCellWithAdjacents(posX, posY);
    for (var i = 0; i < listRevealed.length; i++) {
        revealCell(document.getElementById('cell-' + listRevealed[i].y + '-' + listRevealed[i].x),  listRevealed[i].value);
    }
}

// on right click callback
function onCellRightClick(cellElement) {
    $(cellElement).toggleClass(CLASS_USER_MARK);
}

// process for revealing a cell value to the user
function revealCell(cellElement, value) {
    // show user cell value
    $(cellElement).html(parseCharacterToUI(value))
    .off('click').off('mousedown')
    .addClass(CLASS_REVEALED)
    .removeClass(CLASS_USER_MARK);

    // add class depending on cell value
    var classToAdd = '';
    if (value === MINE_SYMBOL) {
        classToAdd = CLASS_EXPLODE;        
    } else {
        classToAdd = CLASS_CELL_NUMBER_PREFIX + value;
    }
    $(cellElement).addClass(classToAdd);
}

// Transform integer cell code value to something readable for the UI
function parseCharacterToUI(character) {
    if (character === MINE_SYMBOL || character === EMPTY_SYMBOL) {
        character = ' ';
    }
    return character;
}

function printCellsGameWin() {
    $('.cell-btn:not(.revealed)').addClass(CLASS_WIN);
}

// `boolean` game has finished as win (true) or lose (false)
function gameFinish(win) {
    stopTimer();
    $('.' + CLASS_CELL_BTN).off('click').off('mousedown').removeClass(CLASS_USER_MARK);
    if (win) {
        printCellsGameWin();
    }
    var $resultDiv = $('#' + ID_RESULT_DIV);
    var classToAdd = win ? CLASS_RESULT_WIN : CLASS_RESULT_LOSE;
    var msg = win ? 'You win!' : 'You lose!';
    $resultDiv.addClass(classToAdd)
    .removeClass('hide')
    .html(msg);
    if (!win) {
        var mineCells = mineSweeper.getCellsWithMine();
        for (var i = 0; i < mineCells.length; i++) {
            $(document.getElementById('cell-' + mineCells[i].y + '-' + mineCells[i].x)).addClass(CLASS_BOMB);
        }
    }
}

// reset result div information to empty state
function resetResultDiv() {
    $('#' + ID_RESULT_DIV).addClass('hide')
    .removeClass(CLASS_RESULT_WIN)
    .removeClass(CLASS_RESULT_LOSE)
    .empty();
}

// reset timer
function resetTimer() {
    if (interval) {
        clearInterval(interval);
    }
    secondsPlayed = 0;
    startTime = undefined;
}

// start timer from zero
function startTimer() {
    resetTimer();
    startTime = new Date().getTime();
    interval = setInterval(function() {
        secondsPlayed = Math.floor((new Date().getTime() - startTime) / 1000);
        var normalized = normalizeTime(secondsPlayed);
        var $timer = $('#' + ID_TIMER);
        if ($timer.html() !== normalized) {
            $('#' + ID_TIMER).html(normalized);
        }
    }, 200);
}

// stop timer
function stopTimer() {
    if (interval) clearInterval(interval);
}

// normalize secinds amount into a something like "00:00"
function normalizeTime(secs) {
    var minutes = Math.floor(secs / 60);
    var seconds = secs % 60;
    minutes = ('00' + minutes).slice(-2);
    seconds = ('00' + seconds).slice(-2);
    return minutes + ':' + seconds;
}

// callback called when user wins the game
function onGameWin() {
    gameFinish(true);
}

// callback called when user has lost the game
function onGameOver() {
    gameFinish(false);
}

// get difficulty configuration
function getDifficultyConfig(diff) {
    var diff = diff || $('#' + ID_DIFFICULTY_SELECT).val();
    return DIFFICULTY_CONFIG[diff];
}
