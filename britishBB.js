"use strict"


const maskAll = (1 << 16) - 1;
const maskExTop = maskAll - ((1 << 0) + (1 << 1) + (1 << 2) + (1 << 3));
const maskExLeft = maskAll - ((1 << 0) + (1 << 4) + (1 << 8) + (1 << 12));
const maskExBottom = maskAll - ((1 << 12) + (1 << 13) + (1 << 14) + (1 << 15));
const maskExRight = maskAll - ((1 << 3) + (1 << 7) + (1 << 11) + (1 << 15));

let playerBB = 0;
let oppBB = 0;
let blueToMove = true;

const movesPlayed = [2,7];
movesPlayed.forEach(m => makeMove(m));

console.time("British Square");
analyseBoard();
console.timeEnd("British Square");

function analyseBoard() {
    let i, j, score, s;
    let best = -100;
    const playerMove = blueToMove ? 'O' : 'X';
    const oppMove = blueToMove ? 'X' : 'O';
    const playerPot = blueToMove ? 'o' : 'x';
    const oppPot = blueToMove ? 'x' : 'o';
    
    const playerValids = validMoves();
    [playerBB, oppBB] = [oppBB, playerBB];
    const oppValids = validMoves();
    [playerBB, oppBB] = [oppBB, playerBB];

    console.log("Board\tCurr\tOpp\tAnalysis");
    for (i = 0; i < 16; i += 4) {
        s = "";
        for (j = i; j < i + 4; j++) {
            if (getBit(playerBB, j)) { s += playerMove; }
            else if (getBit(oppBB, j)) { s += oppMove; }
            else { s += "."; }
        }

        s += "\t";
        for (j = i; j < i + 4; j++) {
            s += getBit(playerValids, j) ? playerPot : ".";
        }

        s += "\t";
        for (j = i; j < i + 4; j++) {
            s += getBit(oppValids, j) ? oppPot : ".";
        }

        s += "\t";
        for (j = i; j < i + 4; j++) {
            if (getBit(playerValids, j)) {
                makeMove(j);
                score = -analysePosition();
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
    console.log("\n\nScore: ", best);
}

function makeMove(m) {
    [playerBB, oppBB] = [oppBB, setBit(playerBB, m)];
    blueToMove = !blueToMove;
}

function undoMove(m) {
    [playerBB, oppBB] = [clearBit(oppBB, m), playerBB];
    blueToMove = !blueToMove;
}

function validMoves() {
    return maskAll & ~(playerBB | oppBB |
        ((oppBB & maskExBottom) << 4) |
        ((oppBB & maskExTop) >> 4) |
        ((oppBB & maskExRight) << 1) |
        ((oppBB & maskExLeft) >> 1));
}

function scoreAfterPass() {
    let score = blueToMove ? 0 : -1;
    [playerBB, oppBB] = [oppBB, playerBB];
    score -= bitCount(validMoves());
    [playerBB, oppBB] = [oppBB, playerBB];
    return score;
}

function analysePosition() {
    let best = -100;
    const moveSpace = validMoves();
    for (let m = 0; m < 16; m++) {
        if (getBit(moveSpace, m)) {
            makeMove(m);
            const score = -analysePosition();
            undoMove(m);
            best = (score > best) ? score : best;
        }
    }
    return (best === -100) ? scoreAfterPass() : best;
}

function bitCount(n) {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
    return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
}

function getBit(number, bitPosition) {
    return number & (1 << bitPosition);
}

function setBit(number, bitPosition) {
    return number | (1 << bitPosition);
}

function clearBit(number, bitPosition) {
    return number & ~(1 << bitPosition);
}