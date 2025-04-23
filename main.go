package main

import (
	"fmt"
	"strconv"
	"strings"
)

const ROWS int = 4
const COLS int = 4
const TOTAL int = ROWS * COLS

type Board struct {
	whites      [TOTAL]bool
	blacks      [TOTAL]bool
	blackToMove bool
}

func main() {
	var b Board
	b.playGame()
}

func (b *Board) printB() {
	fmt.Println()
	fmt.Println("-" + strings.Repeat("----", COLS))
	for r := range ROWS {
		fmt.Printf("|")
		for c := range COLS {
			if b.whites[r*COLS+c] {
				fmt.Printf(" O ")
			} else if b.blacks[r*COLS+c] {
				fmt.Printf(" X ")
			} else {
				if b.validMove(r*COLS + c) {
					fmt.Printf(" . ")
				} else {
					fmt.Printf("   ")
				}
			}
			fmt.Printf("|")
		}
		fmt.Printf("\n")
	}
	fmt.Println("-" + strings.Repeat("----", COLS))
}

func (b *Board) playGame() {
	for {
		var inp string
		b.printB()
		fmt.Printf("Enter your move: ")
		fmt.Scan(&inp)
		move, err := strconv.Atoi(inp)
		if err != nil {
			panic("Non-numeric input: exiting")
		}
		b.playMove(move)
	}
}

func (b *Board) playMove(sq int) {
	if !b.validMove(sq) {
		panic("Playing invalid move!")
	}
	if b.blackToMove {
		b.blacks[sq] = true
		b.blackToMove = false
	} else {
		b.whites[sq] = true
		b.blackToMove = true
	}
}

func (b *Board) validMove(sq int) bool {
	if b.whites[sq] || b.blacks[sq] {
		return false
	}
	var opp [TOTAL]bool = b.blacks
	if b.blackToMove {
		opp = b.whites
	}
	if (sq >= COLS && opp[sq-COLS]) || (sq < TOTAL-COLS && opp[sq+COLS]) ||
		(sq%COLS != 0 && opp[sq-1]) || (sq%COLS != COLS-1 && opp[sq+1]) {
		return false
	}
	return true
}
