import { assert, validateMove, validateMoveList } from './common.js';
import { Sudoku, createSudokuFromJSON } from './Sudoku.js';

export class Game {
    /**
     * @param {Sudoku} sudoku
     */
    constructor(sudoku) {
        assert(sudoku instanceof Sudoku, 'sudoku must be a Sudoku instance');
        this.sudoku = sudoku.clone();
        this.history = [];
        this.redoList = [];
    }

    getSudoku() {
        return this.sudoku.clone();
    }

    /**
     * Apply one user move and push inverse information for undo.
     * @param {{row: number, col: number, value: number}} move
     */
    guess(move) {
        validateMove(move);

        const previousValue = this.sudoku.getCell(move.row, move.col);
        this.sudoku.guess(move);

        this.history.push({
            row: move.row,
            col: move.col,
            value: move.value,
            previousValue,
        });
        this.redoList = [];
    }

    undo() {
        if (!this.canUndo()) return;

        const lastMove = this.history.pop();
        this.sudoku.guess({
            row: lastMove.row,
            col: lastMove.col,
            value: lastMove.previousValue,
        });
        this.redoList.push(lastMove);
    }

    redo() {
        if (!this.canRedo()) return;

        const nextMove = this.redoList.pop();
        this.sudoku.guess({
            row: nextMove.row,
            col: nextMove.col,
            value: nextMove.value,
        });
        this.history.push(nextMove);
    }

    canUndo() {
        return this.history.length > 0;
    }

    canRedo() {
        return this.redoList.length > 0;
    }

    toJSON() {
        return {
            sudoku: this.sudoku.toJSON(),
            history: this.history.map((item) => ({ ...item })),
            redoList: this.redoList.map((item) => ({ ...item })),
        };
    }
}

export function createGame({ sudoku }) {
    return new Game(sudoku);
}

export function createGameFromJSON(json) {
    assert(json && typeof json === 'object', 'game JSON must be an object');
    assert(json.sudoku, 'game JSON must contain sudoku');
    validateMoveList(json.history, 'history');
    validateMoveList(json.redoList, 'redoList');

    const game = new Game(createSudokuFromJSON(json.sudoku));
    game.history = json.history.map((item) => ({ ...item }));
    game.redoList = json.redoList.map((item) => ({ ...item }));
    return game;
}
