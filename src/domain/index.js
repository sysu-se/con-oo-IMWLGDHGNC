/**
 * Domain API entrypoint.
 *
 * Keep this file focused on exports so callers have a stable import path,
 * while implementation details stay in dedicated modules.
 */

export { createSudoku, createSudokuFromJSON } from './Sudoku.js';
export { createGame, createGameFromJSON } from './Game.js';
