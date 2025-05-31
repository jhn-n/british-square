"use strict";

// need WIDTH * HEIGHT <= 32 due to bitboard max size
// need WIDTH * HEIGHT <= 25 or hashmap encoding may not work
const WIDTH = 5;
const HEIGHT = 5;
const USE_HASH = true;

const numSquares = WIDTH * HEIGHT;
const hashMap = new Map();

const hashKey = hashKeyGen(WIDTH, HEIGHT);
const validMoves = validMovesGen(WIDTH, HEIGHT);
const analyse = USE_HASH ? analysePositionHash : analysePosition;

let playerBB = 0;
let oppBB = 0;
let blueToMove = true;

const movesPlayed = [];
movesPlayed.forEach((m) => makeMove(m));

console.time("Analysis");
analyseBoard();
console.timeEnd("Analysis");
console.log(
    `Hashmap size: ${hashMap.size} (${(mapSize(hashMap) / 2 ** 20).toFixed(2)}MB)`
);

function analysePosition(pBB, oBB, blue) {
    let best = -100;
    const moveSpace = validMoves(pBB, oBB);
    if (moveSpace === 0) {
        return scoreAfterPass(pBB, oBB, blue);
    }

    for (let m = 0; m < numSquares; m++) {
        if (getBit(moveSpace, m)) {
            const score = -analyse(oBB, setBit(pBB, m), !blue);
            best = score > best ? score : best;
        }
    }
    return best;
}

function analysePositionHash(pBB, oBB, blue) {
    const hash = hashKey(pBB, oBB);
    if (hashMap.has(hash)) {
        return hashMap.get(hash);
    }

    const score = analysePosition(pBB, oBB, blue);
    hashMap.set(hash, score);
    return score;
}

function analyseBoard() {
    let i, j, score, s;
    let best = -100;
    const playerMoveChar = blueToMove ? "O" : "X";
    const oppMoveChar = blueToMove ? "X" : "O";
    const playerPotChar = blueToMove ? "o" : "x";
    const oppPotChar = blueToMove ? "x" : "o";

    const playerValids = validMoves(playerBB, oppBB);
    const oppValids = validMoves(oppBB, playerBB);

    console.log("Board\tCurr\tOpp\tAnalysis");
    for (i = 0; i < numSquares; i += WIDTH) {
        s = "";
        for (j = i; j < i + WIDTH; j++) {
            if (getBit(playerBB, j)) {
                s += playerMoveChar;
            } else if (getBit(oppBB, j)) {
                s += oppMoveChar;
            } else {
                s += ".";
            }
        }

        s += "\t";
        for (j = i; j < i + WIDTH; j++) {
            s += getBit(playerValids, j) ? playerPotChar : ".";
        }

        s += "\t";
        for (j = i; j < i + WIDTH; j++) {
            s += getBit(oppValids, j) ? oppPotChar : ".";
        }

        s += "\t";
        for (j = i; j < i + WIDTH; j++) {
            if (getBit(playerValids, j)) {
                makeMove(j);
                score = -analyse(playerBB, oppBB, blueToMove, 1);
                undoMove(j);
                if (score > best) {
                    best = score;
                }
                s += score.toString().padStart(3, " ");
            } else {
                s += "  .";
            }
        }
        console.log(s);
    }
    if (best === -100) {
        best = scoreAfterPass();
    }
    console.log("\nScore:", best);
}

function scoreAfterPass(pBB, oBB, blue) {
    let score = -bitCount(validMoves(oBB, pBB));
    return blue ? score : score - 1;
}

function makeMove(m) {
    [playerBB, oppBB] = [oppBB, setBit(playerBB, m)];
    blueToMove = !blueToMove;
}

function undoMove(m) {
    [playerBB, oppBB] = [clearBit(oppBB, m), playerBB];
    blueToMove = !blueToMove;
}

function bitCount(n) {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}

function getBit(bb, bitPosition) {
    return bb & (1 << bitPosition);
}

function setBit(bb, bitPosition) {
    return bb | (1 << bitPosition);
}

function clearBit(bb, bitPosition) {
    return bb & ~(1 << bitPosition);
}

function linearBitSequence(bitStart, bitDifference, numTerms) {
    console.assert(numTerms >= 1, `numTerms: ${numTerms} is less than one`);
    let b = 1;
    for (let i = 1; i < numTerms; i++) {
        b = 1 + (b << bitDifference);
    }
    return b << bitStart;
}

function validMovesGen(width, height) {
    const maskAll = linearBitSequence(0, 1, width * height);
    const maskExLeft = maskAll & ~linearBitSequence(0, width, height);
    const maskExRight = maskAll & ~linearBitSequence(width - 1, width, height);
    const maskExTop = maskAll & ~linearBitSequence(0, 1, width);
    const maskExBottom = maskAll & ~linearBitSequence(width * (height - 1), 1, width);

    function validMoves(pBB, oBB) {
        const forbiddenMoves = pBB | oBB |
            ((oBB & maskExBottom) << width) |
            ((oBB & maskExTop) >> width) |
            ((oBB & maskExRight) << 1) |
            ((oBB & maskExLeft) >> 1);
        return maskAll & ~forbiddenMoves;
    }

    return validMoves;
}

function hashKeyGen(width, height) {
    const encodeMultiplier = 2 ** (width * height);
    const numSymmetries = width === height ? 8 : 4;

    const [rowMask, rowShifts, rowStartMask, rowLastIndex] =
        rowReflectStates(width, height);

    const [lineMask, lineShifts, lineStartMask, lineLastIndex] =
        (width === height) ?
            diagReflectStates(width) :
            colReflectStates(width, height);

    function rowReflect(bb) {
        let ans = bb & rowStartMask;
        for (const [i, shift] of rowShifts.entries()) {
            ans |=
                ((bb & rowMask[i]) << shift) |
                ((bb & rowMask[rowLastIndex - i]) >> shift);
        }
        return ans;
    }

    function lineReflect(bb) {
        let ans = bb & lineStartMask;
        for (const [i, shift] of lineShifts.entries()) {
            ans |=
                ((bb & lineMask[i]) << shift) |
                ((bb & lineMask[lineLastIndex - i]) >> shift);
        }
        return ans;
    }

    function encode(bb1, bb2) {
        return bb1 * encodeMultiplier + bb2;
    }

    function hashKey(pBB, oBB) {
        let lowestHash = encode(pBB, oBB);
        for (let i = 0; i < numSymmetries - 1; i++) {
            const op = i % 2 === 0 ? rowReflect : lineReflect;
            pBB = op(pBB);
            oBB = op(oBB);
            const newHash = encode(pBB, oBB);
            lowestHash = newHash < lowestHash ? newHash : lowestHash;
        }
        return lowestHash;
    }

    return hashKey;
}

function diagReflectStates(width) {
    const lineMask = Array();
    for (let c = 0; c < width; c++) {
        lineMask.push(linearBitSequence(c, width - 1, c + 1));
    }
    for (let r = 1; r < width; r++) {
        lineMask.push(linearBitSequence(width * (r + 1) - 1, width - 1, width - r));
    }

    const lineShifts = Array();
    for (let d = 0; d < width - 1; d++) {
        lineShifts.push(numSquares - 1 - (width + 1) * d);
    }

    const diagStartMask = lineMask[width - 1];
    const diagLastIndex = lineMask.length - 1;
    return [lineMask, lineShifts, diagStartMask, diagLastIndex];
}

function colReflectStates(width, height) {
    const colMask = Array();
    for (let c = 0; c < width; c++) {
        colMask.push(linearBitSequence(c, width, height));
    }

    const colShifts = Array();
    for (let c = 0; c < Math.floor(width / 2); c++) {
        colShifts.push(width - 1 - 2 * c);
    }

    const colStartMask = (width % 2 !== 0) ? colMask[(width - 1) / 2] : 0;
    const colLastIndex = colMask.length - 1;
    return [colMask, colShifts, colStartMask, colLastIndex];
}

function rowReflectStates(width, height) {
    const rowMask = Array(height).fill(0);
    for (let r = 0; r < height; r++) {
        rowMask[r] = linearBitSequence(r * width, 1, width);
    }

    const rowShifts = Array();
    for (let r = 0; r < Math.floor(height / 2); r++) {
        rowShifts.push((height - 1) * width - 2 * width * r);
    }

    const rowStartMask = (height % 2 !== 0) ? rowMask[(height - 1) / 2] : 0;
    const rowLastIndex = rowMask.length - 1;
    return [rowMask, rowShifts, rowStartMask, rowLastIndex];
}

function mapSize(oMap) {
    function replacer(key, value) {
        if (value instanceof Map) {
            return {
                dataType: "Map",
                value: [...value],
            };
        } else {
            return value;
        }
    }
    return JSON.stringify(oMap, replacer).length;
}
