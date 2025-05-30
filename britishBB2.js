"use strict"

const validMoves = validMovesGen();

let playerBB = 0;
let oppBB = 0;
let blueToMove = true;

const movesPlayed = [];
movesPlayed.forEach(m => makeMove(m));

console.time();
analyseBoard();
console.timeEnd();
const m = new Map();
m.set([35, 72], 3);
console.log(m, typeof m);

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
    for (i = 0; i < 16; i += 4) {
        s = "";
        for (j = i; j < i + 4; j++) {
            if (getBit(playerBB, j)) { s += playerMoveChar; }
            else if (getBit(oppBB, j)) { s += oppMoveChar; }
            else { s += "."; }
        }

        s += "\t";
        for (j = i; j < i + 4; j++) {
            s += getBit(playerValids, j) ? playerPotChar : ".";
        }

        s += "\t";
        for (j = i; j < i + 4; j++) {
            s += getBit(oppValids, j) ? oppPotChar : ".";
        }

        s += "\t";
        for (j = i; j < i + 4; j++) {
            if (getBit(playerValids, j)) {
                makeMove(j);
                score = -analysePosition(playerBB, oppBB, blueToMove);
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
    console.log("\nScore: ", best);
}

function hashKeyGen() {
    const maskRow0 = (1 << 0) + (1 << 1) + (1 << 2) + (1 << 3);
    const maskRow1 = maskRow1 << 4;
    const maskRow2 = maskRow1 << 8;
    const maskRow3 = maskRow1 << 12;
    const maskDiag0 = (1 << 0);
    const maskDiag1 = (1 << 1) + (1 << 4);
    const maskDiag2 = (1 << 2) + (1 << 5) + (1 << 8);
    const maskDiag3 = (1 << 3) + (1 << 6) + (1 << 9) + (1 << 12);
    const maskDiag4 = (1 << 7) + (1 << 10) + (1 << 13);
    const maskDiag5 = (1 << 11) + (1 << 14);
    const maskDiag6 = (1 << 15);
    const encodeMultiplier = 2**16;

    function horReflect(bb) {
        return (bb & maskRow0) << 12 |
            (bb & maskRow1) << 4 |
            (bb & maskRow2) >> 4 |
            (bb & maskRow3) >> 12;
    }

    function diagReflect(bb) {
       return (bb & maskDiag0) << 15 |
            (bb & maskDiag1) << 10 |
            (bb & maskDiag2) << 5 |
            (bb & maskDiag3) |
            (bb & maskDiag4) >> 5 |
            (bb & maskDiag5) >> 10 |
            (bb & maskDiag1) >> 15;
    }

    function encode2to1(bb1, bb2) {
        return bb1 * encodeMultiplier + bb2;
    }


}

function validMovesGen() {
    const maskAll = (1 << 16) - 1;
    const maskExTop = maskAll - ((1 << 0) + (1 << 1) + (1 << 2) + (1 << 3));
    const maskExLeft = maskAll - ((1 << 0) + (1 << 4) + (1 << 8) + (1 << 12));
    const maskExBottom = maskAll - ((1 << 12) + (1 << 13) + (1 << 14) + (1 << 15));
    const maskExRight = maskAll - ((1 << 3) + (1 << 7) + (1 << 11) + (1 << 15));

    return function(pBB, oBB) {
        return maskAll & ~(pBB | oBB |
            (oBB & maskExBottom) << 4 |
            (oBB & maskExTop) >> 4 |
            (oBB & maskExRight) << 1 |
            (oBB & maskExLeft) >> 1);
    };
}

function analysePosition(pBB, oBB, blue) {
    let best = -100;
    const moveSpace = validMoves(pBB, oBB);
    for (let m = 0; m < 16; m++) {
        if (getBit(moveSpace, m)) {
            const score = -analysePosition(oBB, setBit(pBB, m), !blue);
            best = (score > best) ? score : best;
        }
    }
    return (best === -100) ? scoreAfterPass(pBB, oBB, blue) : best;
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