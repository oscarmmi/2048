export type Direction = 'up' | 'right' | 'down' | 'left'
export type Board = number[][]

export interface MoveResult {
  board: Board
  scoreGain: number
  moved: boolean
}

const SIZE = 4

export function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0))
}

export function spawnTile(board: Board, random: () => number = Math.random): Board {
  const next = board.map((row) => [...row])
  const empty: Array<[number, number]> = []
  next.forEach((row, r) => row.forEach((value, c) => {
    if (value === 0) empty.push([r, c])
  }))
  if (!empty.length) return next

  const [row, col] = empty[Math.min(empty.length - 1, Math.floor(random() * empty.length))]
  next[row][col] = random() < 0.9 ? 2 : 4
  return next
}

export function createBoard(random: () => number = Math.random): Board {
  return spawnTile(spawnTile(emptyBoard(), random), random)
}

function lineCoordinates(direction: Direction, line: number): Array<[number, number]> {
  switch (direction) {
    case 'left': return [[line, 0], [line, 1], [line, 2], [line, 3]]
    case 'right': return [[line, 3], [line, 2], [line, 1], [line, 0]]
    case 'up': return [[0, line], [1, line], [2, line], [3, line]]
    case 'down': return [[3, line], [2, line], [1, line], [0, line]]
  }
}

function compressAndMerge(values: number[]): { values: number[]; scoreGain: number } {
  const compact = values.filter((value) => value !== 0)
  const merged: number[] = []
  let scoreGain = 0

  for (let index = 0; index < compact.length; index += 1) {
    if (compact[index] === compact[index + 1]) {
      const value = compact[index] * 2
      merged.push(value)
      scoreGain += value
      index += 1
    } else {
      merged.push(compact[index])
    }
  }

  while (merged.length < SIZE) merged.push(0)
  return { values: merged, scoreGain }
}

export function moveBoard(board: Board, direction: Direction, random: () => number = Math.random): MoveResult {
  const next = board.map((row) => [...row])
  let scoreGain = 0

  for (let line = 0; line < SIZE; line += 1) {
    const coordinates = lineCoordinates(direction, line)
    const values = coordinates.map(([row, col]) => board[row][col])
    const result = compressAndMerge(values)
    scoreGain += result.scoreGain
    coordinates.forEach(([row, col], index) => { next[row][col] = result.values[index] })
  }

  const moved = next.some((row, r) => row.some((value, c) => value !== board[r][c]))
  return { board: moved ? spawnTile(next, random) : next, scoreGain, moved }
}

export function hasWon(board: Board): boolean {
  return board.some((row) => row.some((value) => value >= 2048))
}

export function isGameOver(board: Board): boolean {
  if (board.some((row) => row.some((value) => value === 0))) return false
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (row < SIZE - 1 && board[row][col] === board[row + 1][col]) return false
      if (col < SIZE - 1 && board[row][col] === board[row][col + 1]) return false
    }
  }
  return true
}
