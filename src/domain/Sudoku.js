import {
    BOARD_SIZE,
    BOX_SIZE,
    EMPTY,
    assert,
    deepCopyGrid,
    validateFixedMask,
    validateGrid,
    validateMove,
} from './common.js';

export class Sudoku {
    /**
     * @param {number[][]} grid 9x9 matrix where 0 means empty.
     * @param {{fixed?: boolean[][]}} [options] optional fixed-cell mask.
     */
    constructor(grid, options = {}) {
        validateGrid(grid, 'grid');

        const fixedMask = options.fixed ?? grid.map((row) => row.map((cell) => cell !== EMPTY));
        validateFixedMask(fixedMask, 'fixed');

        this.grid = deepCopyGrid(grid);
        this.fixed = fixedMask.map((row) => [...row]);
    }

    /** @returns {number[][]} deep-copied 9x9 board snapshot. */
    getGrid() {
        return deepCopyGrid(this.grid);
    }

    /**
     * Returns the value at a specific cell.
     * @param {number} row
     * @param {number} col
     * @returns {number}
     */
    getCell(row, col) {
        // assert(Number.isInteger(row), 'row must be an integer');
        // assert(row >= 0 && row < BOARD_SIZE, 'row must be in [0, 8]');
        // assert(Number.isInteger(col), 'col must be an integer');
        // assert(col >= 0 && col < BOARD_SIZE, 'col must be in [0, 8]');
        return this.grid[row][col];
    }

    /**
     * Apply one move with Sudoku validation.
     * - value = 0 means clear a non-fixed cell.
     * - non-zero value must satisfy row/column/box constraints.
     * @param {{row: number, col: number, value: number}} move
     */
    guess(move) {
        validateMove(move);

        const { row, col, value } = move;
        assert(!this.fixed[row][col], `cell (${row}, ${col}) is fixed and cannot be modified`);

        const previousValue = this.grid[row][col];
        this.grid[row][col] = EMPTY;

        if (value !== EMPTY) {
            assert(this.#isValueAllowed(row, col, value), `move violates Sudoku rule at (${row}, ${col})`);
        }

        this.grid[row][col] = value;
        return previousValue;
    }

    clone() {
        return new Sudoku(this.grid, { fixed: this.fixed });
    }

    /**
     * Serialize into plain data with deep copies.
     * Keeping fixed mask makes deserialization deterministic.
     */
    toJSON() {
        return {
            grid: deepCopyGrid(this.grid),
            fixed: this.fixed.map((row) => [...row]),
        };
    }

    toString() {
        return this.grid.map((row) => row.join(' ')).join('\n');
    }

    #isValueAllowed(targetRow, targetCol, value) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            if (this.grid[targetRow][col] === value) {
                return false;
            }
        }

        for (let row = 0; row < BOARD_SIZE; row += 1) {
            if (this.grid[row][targetCol] === value) {
                return false;
            }
        }

        const boxRowStart = Math.floor(targetRow / BOX_SIZE) * BOX_SIZE;
        const boxColStart = Math.floor(targetCol / BOX_SIZE) * BOX_SIZE;

        for (let row = boxRowStart; row < boxRowStart + BOX_SIZE; row += 1) {
            for (let col = boxColStart; col < boxColStart + BOX_SIZE; col += 1) {
                if (this.grid[row][col] === value) {
                    return false;
                }
            }
        }

        return true;
    }
}

export function createSudoku(input) {
    return new Sudoku(input);
}

export function createSudokuFromJSON(json) {
    assert(json && typeof json === 'object', 'sudoku JSON must be an object');
    return new Sudoku(json.grid, { fixed: json.fixed });
}
