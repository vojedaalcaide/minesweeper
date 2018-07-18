function MineSweeper (options, callbacks) {

    var base = this;

    // default options (to be setted by constructor)
    defaultOptions = {
        mineSymbol: 9,
        emptySymbol: 0,
        // sizeX: 10,
        // sizeY: 10,
        // numMines: 20,
    }

    /* callbacks : { gameWin, gameOver } */

    base.MATRIX = [];
    base.matrixRevealed = []; // matrix with revealed cells
    base.cellsRevealed = 0;

    // options validations
    if (!options) {
        console.error('No `options` received as parameter');
    } else {
        if (!options.sizeX || typeof options.sizeX !== 'number') {
            console.error('`options.sizeX` not defined or not a number when initializing MineSweeper()');
            return;
        }
        if (!options.sizeY || typeof options.sizeY !== 'number') {
            console.error('`options.sizeY` not defined or not a number when initializing MineSweeper()');
            return;
        }
        if (!options.numMines || typeof options.numMines !== 'number') {
            console.error('`options.numMines` not defined or not a number when initializing MineSweeper()');
            return;
        }
    }

    // set configuration from
    this.config = Object.assign({}, defaultOptions, options);

    this.init = function () {
        base.MATRIX = base.generateArrayZeros({
            x: base.config.sizeX,
            y: base.config.sizeY,
            char: base.config.emptySymbol
        });
        base.matrixRevealed = base.generateArrayZeros({
            x: base.config.sizeX,
            y: base.config.sizeY
        });
        var minesArray = base.generateMines(base.config.sizeX, base.config.sizeY, base.config.numMines);
        base.assignMines(base.MATRIX, minesArray);
        base.calculateNumbers(base.MATRIX);
    }

    this.generateMines = function(x, y, mines) {
        var matrix = base.generateArrayZeros({x, y});
        var minesGenerated = 0;
        while (minesGenerated < mines) {
            var y = Math.floor(Math.random() * base.config.sizeX);
            var x = Math.floor(Math.random() * base.config.sizeY);
            if (matrix[y][x] !== 1) {
                matrix[y][x] = 1;
                minesGenerated++;
            }
        }
        return matrix;
    }
    
    // assign mines to original matrix
    this.assignMines = function (originalMatrix, minesMatrix) {
        for (var y = 0; y < originalMatrix.length; y++) {
            for (var x = 0; x < originalMatrix[0].length; x++) {
                if (minesMatrix[y][x] === 1) {
                    originalMatrix[y][x] = base.config.mineSymbol;
                }
            }
        }
    }
    
    // calculate numbers in cells in function of number of mines in boundary
    this.calculateNumbers = function(matrix) {
        for (var y = 0; y < matrix.length; y++) {
            for (var x = 0; x < matrix[0].length; x++) {
                if (matrix[y][x] !== base.config.mineSymbol) {
                    matrix[y][x] = base.calculateMinesInBoundaryForCell(x, y, matrix);
                }
            }
        }
    }
    
    // return the number of mines in the boundary for specific cell
    this.calculateMinesInBoundaryForCell = function(x, y, matrix) {
        var mines = 0;
        if (matrix[y-1]) {
            if (base.cellHasMine(matrix[y-1][x-1])) mines++;
            if (base.cellHasMine(matrix[y-1][x])) mines++;
            if (base.cellHasMine(matrix[y-1][x+1])) mines++;
        }
        if (base.cellHasMine(matrix[y][x-1])) mines++;
        if (base.cellHasMine(matrix[y][x+1])) mines++;
        if (matrix[y+1]) {
            if (base.cellHasMine(matrix[y+1][x-1])) mines++;
            if (base.cellHasMine(matrix[y+1][x])) mines++;
            if (base.cellHasMine(matrix[y+1][x+1])) mines++;
        }
        return mines;
    }
    
    // return if a cell has a mine
    this.cellHasMine = function(cellValue) {
        return cellValue === base.config.mineSymbol;
    }

    // reveal adjacents cells from a base (x, y) cell
    // `noSpread` -> boolean indicating if when revealing a cell must NOT spread to its adjacents
    this.revealCellWithAdjacents = function(x, y, list) {
        if (!list || !Array.isArray(list)) {
            list = [];
        }
        var value = base.getCellValue(x, y);
        if (value === base.config.mineSymbol) {
            // bomb explode
            setTimeout(function() {
                callbacks.gameOver();
            }, 150);
        } else {
            base.cellsRevealed++;
            var totalCells = base.config.sizeX * base.config.sizeY;
            if ((totalCells - base.cellsRevealed) <= base.config.numMines) {
                setTimeout(function() {
                    callbacks.gameWin();
                }, 150);
            }
        }
        list.push({ x, y, value });
        base.matrixRevealed[y][x] = 1;
        if (value > base.config.emptySymbol) {
            return list;
        } else {
            // up
            if (base.cellExistsNotMineNotRevealed(x, y-1)) {
                base.revealCellWithAdjacents(x, y-1, list);
            }
            // right
            if (base.cellExistsNotMineNotRevealed(x+1, y)) {
                base.revealCellWithAdjacents(x+1, y, list);
            }
            // down
            if (base.cellExistsNotMineNotRevealed(x, y+1)) {
                base.revealCellWithAdjacents(x, y+1, list);
            }
            // left
            if (base.cellExistsNotMineNotRevealed(x-1, y)) {
                base.revealCellWithAdjacents(x-1, y, list);
            }
            // diagonal up-right
            if (base.cellExistsNotMineNotRevealed(x+1, y-1)) {
                base.revealCellWithAdjacents(x+1, y-1, list);
            }
            // diagonal down-right
            if (base.cellExistsNotMineNotRevealed(x+1, y+1)) {
                base.revealCellWithAdjacents(x+1, y+1, list);
            }
            // diagonal down-left
            if (base.cellExistsNotMineNotRevealed(x-1, y+1)) {
                base.revealCellWithAdjacents(x-1, y+1, list);
            }
            // diagonal up-left
            if (base.cellExistsNotMineNotRevealed(x-1, y-1)) {
                base.revealCellWithAdjacents(x-1, y-1, list);
            }
        }
        return list;
    }

    // support function to know if a cell exists and is not a mine and is not revealed
    this.cellExistsNotMineNotRevealed = function(x, y) {
        var cellValue = base.getCellValue(x, y);
        return cellValue !== undefined && cellValue !== base.config.mineSymbol && base.matrixRevealed[y][x] === 0;
    }

    // return cells with a mine inside
    this.getCellsWithMine = function() {
        var mineCells = [];
        for (var y = 0; y < base.config.sizeY; y++) {
            for (var x = 0; x < base.config.sizeX; x++) {
                if (base.getCellValue(x, y) === base.config.mineSymbol) {
                    mineCells.push({ x, y });
                }
            }
        }
        return mineCells;
    }
    
    /*
        Generate an empty array or matrix.
        If only 'y' parameter is not passed by argument,
        an array of 1 dimension will be created.

        @oaram options = {
            x:      number of x positions
            y:      number of y positions
            char:   character to fill cells
        }
    */
    this.generateArrayZeros = function(options) {
        var array = [];
        options = Object.assign({
            x: 1,
            y: 0,
            char: 0
        }, options);
        if (!options.y) {
            for (var x = 0; x < options.x; x++) {
                array[x] = options.char;
            }
        } else {
            for (var y = 0; y < options.y; y++) {
                array[y] = [];
                for (var x = 0; x < options.x; x++) {
                    array[y][x] = options.char;
                }
            }
        }
        return array;
    }

    this.getConfig = function() {
        return JSON.parse(JSON.stringify(base.config));
    }

    this.getCellValue = function(x, y) {
        if (x >= base.config.sizeX || y >= base.config.sizeY || x < 0 || y < 0) {
            return undefined;
        }
        return base.MATRIX[y][x];
    }

    // initialize logic
    this.init();

    // visible properties from outside
    return {
        getConfig: base.getConfig,
        revealCellWithAdjacents: base.revealCellWithAdjacents,
        getCellsWithMine: base.getCellsWithMine,
    }
}