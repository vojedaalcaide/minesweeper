// constants
const MINE_SYMBOL = 9;
const EMPTY_SYMBOL = 0;
const BOMB_CHAR = '*';
const CELL_SIZE_DESKTOP = 25; // in pixels
const CELL_SIZE_MOBILE = 50; // in pixels

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
const ID_CUSTOM_OPTIONS = 'custom-settings';
const ID_CUSTOM_X = 'input-custom-x';
const ID_CUSTOM_Y = 'input-custom-y';
const ID_CUSTOM_MINES = 'input-custom-mines';

// difficulty modes
const DIFFICULTY_MODE = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
    IMPOSSIBLE: 'IMPOSSIBLE',
    CUSTOM: 'CUSTOM'
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

// main execution when document loads
$(document).ready(function(){

    resetGame();
    setCustomSettingsListener();

    $('#' + ID_DIFFICULTY_SELECT).val(DIFFICULTY_MODE.MEDIUM);
    $('#' + ID_PLAY_BTN).on('click', function(ev){
        currentDificulty = $('#' + ID_DIFFICULTY_SELECT).val();
        resetGame();
    });  
});

// reset game with a new configuration
function resetGame() {
    var diffConfig = getDifficultyConfig(currentDificulty);
    mineSweeper = null;
    mineSweeper = new MineSweeper(diffConfig, {
        gameWin: onGameWin,
        gameOver: onGameOver
    });

    // game not initalized
    if (!mineSweeper.getConfig) {
        window.document.write('<strong>ERROR</strong> initializing <em>MineSweeper</em> instance');
    }
    resetUI();
}

// initialize the UI and user events
function resetUI() {
    var uiConfig = getDifficultyConfig(currentDificulty);
    var $container = $('#' + ID_MAIN_CONTAINER);
    // mount panel
    var cellSize = getCellSize();
    $container.css({
        width: uiConfig.sizeX * cellSize + 'px',
        height: uiConfig.sizeY * cellSize + 'px',
    });
    $container.empty();
    resetResultDiv();

    // print cells
    for (var y = 0; y < uiConfig.sizeY; y++) {
        for (var x = 0; x < uiConfig.sizeX; x++) {
            $container.append('<button id="cell-' + y + '-' + x + '" class="cell-btn"></button>');
        }
    }
    $('.' + CLASS_CELL_BTN).css({ width: cellSize + 'px', height: cellSize + 'px' });

    setCellListeners();
    startTimer();
}

// setting up click events on cells
function setCellListeners() {
    $('.' + CLASS_CELL_BTN)
    .on('click', function(ev) {
        if (!$(ev.target).hasClass(CLASS_USER_MARK)) {
            onCellClick(this);
        }
    })
    .on('mousedown', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.which === 3) { // right mouse click
            onCellRightClick(this);
        }
    });
}

// set difficulty selector listener for listening to select selection changes
function setCustomSettingsListener() {
    $('#' + ID_DIFFICULTY_SELECT).click(function(ev) {
        if (ev.target.selectedOptions[0].value === DIFFICULTY_MODE.CUSTOM) {
            $('#' + ID_CUSTOM_OPTIONS).show();
        } else {
            $('#' + ID_CUSTOM_OPTIONS).hide();
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

// transform integer cell code value to something readable for the UI
function parseCharacterToUI(character) {
    if (character === MINE_SYMBOL || character === EMPTY_SYMBOL) {
        character = ' ';
    }
    return character;
}

// print win flag icon on cells with bomb (when on game win)
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
    if (diff !== DIFFICULTY_MODE.CUSTOM) return DIFFICULTY_CONFIG[diff];
    else {
        return {
            sizeX: parseInt($('#' + ID_CUSTOM_X).val(), 10),
            sizeY: parseInt($('#' + ID_CUSTOM_Y).val(), 10),
            numMines: parseInt($('#' + ID_CUSTOM_MINES).val(), 10),
        };
    }
}

// function to know if we are on a mobile browser
function isMobileBrowser() {
    var check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
}

// get cell size (in px) depending on type of browser will return one value or another
function getCellSize() {
    return isMobileBrowser() ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP;
}
