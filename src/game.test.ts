import { describe, expect, it } from 'vitest'
import { isGameOver, moveBoard, type Board } from './game'

const keepFirstEmpty = () => 0

describe('2048 game rules', () => {
  it('merges two matching tiles once and adds the merged value to the score', () => {
    const board: Board = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]

    const result = moveBoard(board, 'left', keepFirstEmpty)

    expect(result.moved).toBe(true)
    expect(result.scoreGain).toBe(4)
    expect(result.board[0]).toEqual([4, 2, 0, 0])
  })

  it('does not spawn a tile when a move changes nothing', () => {
    const board: Board = [
      [2, 4, 8, 16],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ]
    let randomCalls = 0

    const result = moveBoard(board, 'left', () => {
      randomCalls += 1
      return 0
    })

    expect(result.moved).toBe(false)
    expect(result.board).toEqual(board)
    expect(randomCalls).toBe(0)
  })

  it('recognizes a full board with no adjacent equal tiles as a loss', () => {
    const board: Board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]

    expect(isGameOver(board)).toBe(true)
  })

  it('does not merge a tile twice in one move', () => {
    const board: Board = [
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]

    const result = moveBoard(board, 'left', keepFirstEmpty)

    expect(result.scoreGain).toBe(8)
    expect(result.board[0]).toEqual([4, 4, 2, 0])
  })
})
