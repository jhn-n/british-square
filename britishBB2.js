"use strict"

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
movesPlayed.forEach(m => makeMove(m));

console.time("Analysis");
analyseBoard();
console.timeEnd("Analysis");
console.log("Hashmap size:", hashMap.size, (mapSize(hashMap) / 2 ** 20).toFixed(2), "MB")


function analysePosition(pBB, oBB, blue) {
    let best = -100;
    const moveSpaceBB = validMoves(pBB, oBB);
    for (let m = 0; m < numSquares; m++) {
        if (getBit(moveSpaceBB, m)) {
            const score = -analyse(oBB, setBit(pBB, m), !blue);
            best = (score > best) ? score : best;
        }
    }
    return (best === -100) ? scoreAfterPass(pBB, oBB, blue) : best;
}

function analysePositionHash(pBB, oBB, blue) {
    const lowestHash = hashKey(pBB, oBB);
    if (hashMap.has(lowestHash)) {
        return hashMap.get(lowestHash);
    }
    const score = analysePosition(pBB, oBB, blue);
    hashMap.set(lowestHash, score);
    return score;
}

function analyseBoard() {
    let i, j, score, s;
    let best = -100;
    const playerMoveChar = blueToMove ? 'O' : 'X';
    const oppMoveChar = blueToMove ? 'X' : 'O';
    const playerPotChar = blueToMove ? 'o' : 'x';
    const oppPotChar = blueToMove ? 'x' : 'o';

    const playerValids = validMoves(playerBB, oppBB);
    const oppValids = validMoves(oppBB, playerBB);

    console.log("Board\tCurr\tOpp\tAnalysis");
    for (i = 0; i < numSquares; i += WIDTH) {
        s = "";
        for (j = i; j < i + WIDTH; j++) {
            if (getBit(playerBB, j)) { s += playerMoveChar; }
            else if (getBit(oppBB, j)) { s += oppMoveChar; }
            else { s += "."; }
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
                s += "  ."
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
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
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

function validMovesGen(width, height) {
    const maskAll = (1 << width * height) - 1;
    let maskExTop = maskAll,
        maskExBottom = maskAll,
        maskExLeft = maskAll,
        maskExRight = maskAll;
    for (let i = 0; i < width; i++) {
        maskExTop = clearBit(maskExTop, i);
        maskExBottom = clearBit(maskExBottom, width * (height - 1) + i);
    }
    for (let i = 0; i < width * height; i += width) {
        maskExLeft = clearBit(maskExLeft, i);
        maskExRight = clearBit(maskExRight, i + width - 1);
    }

    return function (pBB, oBB) {
        return maskAll & ~(pBB | oBB |
            (oBB & maskExBottom) << width |
            (oBB & maskExTop) >> width |
            (oBB & maskExRight) << 1 |
            (oBB & maskExLeft) >> 1);
    };
}

function hashKeyGen(width, height) {
    const encodeMultiplier = 2 ** (width * height);
    const numSymmetries = (width === height) ? 8 : 4;
    const [rowMask, rowShifts, rowStartMask, rowLastIndex] = rowReflectStates(width, height);
    const [lineMask, lineShifts, lineStartMask, lineLastIndex] = lineReflectStates(width, height);

    function rowReflect(bb) {
        let ans = bb & rowStartMask;
        for (const [i, shift] of rowShifts.entries()) {
            ans |= (bb & rowMask[i]) << shift | (bb & rowMask[rowLastIndex - i]) >> shift;
        }
        return ans;
    }

    function lineReflect(bb) {
        let ans = bb & lineStartMask;
        for (const [i, shift] of lineShifts.entries()) {
            ans |= (bb & lineMask[i]) << shift | (bb & lineMask[lineLastIndex - i]) >> shift;
        }
        return ans;
    }

    function encode(bb1, bb2) {
        return bb1 * encodeMultiplier + bb2;
    }

    return function (pBB, oBB) {
        let lowestHash = encode(pBB, oBB);
        for (let i = 0; i < numSymmetries - 1; i++) {
            const op = (i % 2 === 0) ? rowReflect : lineReflect;
            pBB = op(pBB);
            oBB = op(oBB);
            const newHash = encode(pBB, oBB);
            lowestHash = (newHash < lowestHash) ? newHash : lowestHash;
        }
        return lowestHash;
    };
}


function lineReflectStates(width, height) {
    if (width === height) {
        return diagReflectStates(width);
    } else {
        return colReflectStates(width, height);
    }
}

function diagReflectStates(width) {
    const lineMask = Array();
    for (let d = 0; d < width; d++) {
        let newDiag = 0;
        const numElements = d + 1;
        for (let i = 0; i < numElements; i++) {
            newDiag = setBit(newDiag, d + i * (width - 1));
        }
        lineMask.push(newDiag);
    }
    for (let d = 1; d < width; d++) {
        let newDiag = 0;
        const numElements = width - d;
        for (let i = 0; i < numElements; i++) {
            newDiag = setBit(newDiag, width - 1 + width * d + i * (width - 1));
        }
        lineMask.push(newDiag);
    }

    const lineShifts = Array();
    for (let d = 0; d < width - 1; d++) {
        lineShifts.push(numSquares - 1 - (width + 1) * d);
    }

    const diagStartMask = lineMask[width - 1];
    const diagLastIndex = lineMask.length - 1
    return [lineMask, lineShifts, diagStartMask, diagLastIndex]
}

function colReflectStates(width, height) {
    const colMask = Array(width).fill(0);
    for (let c = 0; c < width; c++) {
        for (let r = 0; r < height; r++) {
            colMask[c] += 1 << (c + r * width);
        }
    }

    const colShifts = Array();
    for (let c = 0; c < Math.floor(width / 2); c++) {
        colShifts.push(width - 1 - 2 * c);
    }

    const colStartMask = (width % 2 !== 0) ? colMask[(width - 1) / 2] : 0;
    const colLastIndex = colMask.length - 1;
    return [colMask, colShifts, colStartMask, colLastIndex]
}

function rowReflectStates(width, height) {
    const rowMask = Array(height).fill(0);
    for (let r = 0; r < height; r++) {
        rowMask[r] = (1 << (r + 1) * width) - (1 << r * width);
    }

    const rowShifts = Array();
    for (let r = 0; r < Math.floor(height / 2); r++) {
        rowShifts.push((height - 1) * width - 2 * width * r);
    }

    const rowStartMask = (height % 2 !== 0) ? rowMask[(height - 1) / 2] : 0;
    const rowLastIndex = rowMask.length - 1;
    return [rowMask, rowShifts, rowStartMask, rowLastIndex]
}


function mapSize(oMap) {
    function replacer(key, value) {
        if (value instanceof Map) {
            return {
                dataType: 'Map',
                value: [...value],
            };
        } else {
            return value;
        }
    }
    return JSON.stringify(oMap, replacer).length;
}
