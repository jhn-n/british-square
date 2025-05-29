console.time("British Square");

const squares = Array.from(Array(16).keys());
let blue = Array(16).fill(false);
let red = Array(16).fill(false);
let blueToMove = true;
let moves = [3, 7];
moves.forEach(m => makeMove(m));
analyseBoard();
console.timeEnd("British Square");


function makeMove(m) {
    if (blueToMove) { blue[m] = true; } else { red[m] = true; }
    blueToMove = !blueToMove;
}

function undoMove(m) {
    if (blueToMove) { red[m] = false; } else { blue[m] = false; }
    blueToMove = !blueToMove;
}

function validMove(m) {
    if (blue[m] || red[m]) { return false; }
    const opp = blueToMove ? red : blue;
    if ((m > 3 && opp[m - 4]) ||
        (m < 12 && opp[m + 4]) ||
        (m % 4 != 0 && opp[m - 1]) ||
        (m % 4 != 3 && opp[m + 1])) {
        return false;
    }
    return true;
}

function scoreAfterPass() {
    let score = 0;
    if (!blueToMove) { score = -1; }
    blueToMove = !blueToMove;
    score -= squares.filter(m => validMove(m)).length;
    blueToMove = !blueToMove;
    return score;
}

function analysePosition() {
    let best = -100;
    for (let m = 0; m < 16; m++) {
        if (validMove(m)) {
            makeMove(m);
            const score = -analysePosition();
            undoMove(m);
            best = (score > best) ? score : best;
        }
    }
    return (best === -100) ? scoreAfterPass() : best;
}

function analyseBoard() {
    let i, j, score, s;
    let best = -100;
    c = blueToMove ? 'o' : 'x';
    d = blueToMove ? 'x' : 'o';

    console.log("Board\tCurr\tOpp\tAnalysis");
    for (i = 0; i < 16; i += 4) {
        s = "";
        for (j = i; j < i + 4; j++) {
            if (blue[j]) { s += "O"; }
            else if (red[j]) { s += "X"; }
            else { s += "."; }
        }

        s += "\t";
        for (j = i; j < i + 4; j++) {
            s += validMove(j) ? c : ".";
        }

        s += "\t";
        blueToMove = !blueToMove;
        for (j = i; j < i + 4; j++) {
            s += validMove(j) ? d : ".";
        }
        blueToMove = !blueToMove;

        s += "\t";
        for (j = i; j < i + 4; j++) {
            if (validMove(j)) {
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

