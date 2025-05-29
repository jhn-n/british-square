#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

typedef struct {
    bool white[16];
    bool black[16];
    bool white_to_move;
} board;

void british_square();
void print_board(board *b);
bool is_valid_move(board *b, int m);
void make_move(board *b, int m);
void undo_move(board *b, int m);
int score_after_pass(board *b);
int analyse(board *b);
board *new_board();

void british_square() {
    board *b = new_board();

    print_board(b);
    free(b);
}

int analyse(board *b) {
    int best_score = -100;
    int score, m;
    for (m = 0; m < 16; m++) {
        if (is_valid_move(b, m)) {
            make_move(b, m);
            score = -analyse(b);
            undo_move(b, m);
            if (score > best_score) {
                best_score = score;
            }
        }
    }
    if (best_score == -100) {
        return score_after_pass(b);
    }
    return best_score;
}

int score_after_pass(board *b) {
    int score = 0;
    if (!(b->white_to_move)) {
        // if black cannot move then white has played one extra
        score = -1;
    }

    b->white_to_move = !(b->white_to_move);
    for (int m = 0; m < 16; m++) {
        if (is_valid_move(b, m)) {
            score--;
        }
    }
    b->white_to_move = !(b->white_to_move);
    return score;
}

void make_move(board *b, int m) {
    if (b->white_to_move) {
        b->white[m] = true;
        b->white_to_move = false;
    } else {
        b->black[m] = true;
        b->white_to_move = true;
    }
}

void undo_move(board *b, int m) {
    if (b->white_to_move) {
        b->white_to_move = false;
        b->black[m] = false;
    } else {
        b->white_to_move = true;
        b->white[m] = false;
    }
}

bool is_valid_move(board *b, int m) {
    if (b->white[m] || b->black[m]) {
        return false;
    }
    if (b->white_to_move) {
        if ((m > 3 && b->black[m - 4]) ||
            (m < 12 && b->black[m + 4]) ||
            (m % 4 != 0 && b->black[m - 1]) ||
            (m % 4 != 3 && b->black[m + 1])) {
            return false;
        }
        return true;
    } else {
        if ((m > 3 && b->white[m - 4]) ||
            (m < 12 && b->white[m + 4]) ||
            (m % 4 != 0 && b->white[m - 1]) ||
            (m % 4 != 3 && b->white[m + 1])) {
            return false;
        }
        return true;
    }
}

void print_board(board *b) {
    printf("Board\tCurr\tOpp\tAnalysis\n");
    int i, j, score;
    int best_score = -100;

    char c = 'o';
    char d = 'x';
    if (!(b->white_to_move)) {
        c = 'x';
        d = 'o';
    }

    for (i = 0; i < 16; i += 4) {
        printf("\n");

        for (j = i; j < i + 4; j++) {
            if (b->white[j]) {
                printf("O");
            } else if (b->black[j]) {
                printf("X");
            } else {
                printf(".");
            }
        }

        printf("\t");
        for (j = i; j < i + 4; j++) {
            if (is_valid_move(b, j)) {
                printf("%c", c);
            } else {
                printf(".");
            }
        }

        printf("\t");
        b->white_to_move = !(b->white_to_move);
        for (j = i; j < i + 4; j++) {
            if (is_valid_move(b, j)) {
                printf("%c", d);
            } else {
                printf(".");
            }
        }
        b->white_to_move = !(b->white_to_move);

        printf("\t");
        for (j = i; j < i + 4; j++) {
            if (is_valid_move(b, j)) {
                make_move(b, j);
                score = -analyse(b);
                undo_move(b, j);
                if (score > best_score) {
                    best_score = score;
                }
                printf("%3d", score);
            } else {
                printf("  .");
            }
        }
    }
    if (best_score == -100) {
        best_score = score_after_pass(b);
    }
    printf("\n\nScore: %3d\n", best_score);
}

board *new_board() {
    board *b = (board *)malloc(sizeof(board));
    int i;
    for (i = 0; i < 16; i++) {
        b->white[i] = false;
        b->black[i] = false;
    }
    b->white_to_move = true;
}

int main() {
    clock_t tic, toc;
    double time_taken;
    tic = clock();
    british_square();
    toc = clock();
    time_taken = (double)(toc - tic) / CLOCKS_PER_SEC;

    printf("%f seconds to execute \n", time_taken);
    return 0;
}