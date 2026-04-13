/**
 * Shared domain constants and validation helpers.
 */

export const BOARD_SIZE = 9;
export const BOX_SIZE = 3;
export const EMPTY = 0;

export function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

export function deepCopyGrid(grid) {
    return grid.map((row) => [...row]);
}

function isIntegerInRange(value, min, max) {
    return Number.isInteger(value) && value >= min && value <= max;
}

export function validateGrid(grid, fieldName = 'grid') {
    assert(Array.isArray(grid), `${fieldName} must be a 9x9 array`);
    assert(grid.length === BOARD_SIZE, `${fieldName} must contain 9 rows`);

    for (let row = 0; row < BOARD_SIZE; row += 1) {
        assert(Array.isArray(grid[row]), `${fieldName}[${row}] must be an array`);
        assert(grid[row].length === BOARD_SIZE, `${fieldName}[${row}] must contain 9 columns`);
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            assert(
                isIntegerInRange(grid[row][col], 0, 9),
                `${fieldName}[${row}][${col}] must be an integer in [0, 9]`,
            );
        }
    }
}

export function validateFixedMask(fixed, fieldName = 'fixed') {
    assert(Array.isArray(fixed), `${fieldName} must be a 9x9 array`);
    assert(fixed.length === BOARD_SIZE, `${fieldName} must contain 9 rows`);

    for (let row = 0; row < BOARD_SIZE; row += 1) {
        assert(Array.isArray(fixed[row]), `${fieldName}[${row}] must be an array`);
        assert(fixed[row].length === BOARD_SIZE, `${fieldName}[${row}] must contain 9 columns`);
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            assert(typeof fixed[row][col] === 'boolean', `${fieldName}[${row}][${col}] must be boolean`);
        }
    }
}

function validateIndex(name, index) {
    assert(Number.isInteger(index), `${name} must be an integer`);
    assert(index >= 0 && index < BOARD_SIZE, `${name} must be in [0, 8]`);
}

export function validateMove(move) {
    assert(move && typeof move === 'object', 'move must be an object');
    validateIndex('move.row', move.row);
    validateIndex('move.col', move.col);
    assert(isIntegerInRange(move.value, 0, 9), 'move.value must be an integer in [0, 9]');
}

export function validateMoveList(list, fieldName) {
    assert(Array.isArray(list), `${fieldName} must be an array`);
    list.forEach((entry, index) => {
        assert(entry && typeof entry === 'object', `${fieldName}[${index}] must be an object`);
        validateMove(entry);
        assert(
            isIntegerInRange(entry.previousValue, 0, 9),
            `${fieldName}[${index}].previousValue must be an integer in [0, 9]`,
        );
    });
}
