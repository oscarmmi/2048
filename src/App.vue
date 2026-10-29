<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { createBoard, hasWon, isGameOver, moveBoard, type Board, type Direction } from './game'

const bestStorageKey = '2048-best-score'
const board = ref<Board>(createBoard())
const score = ref(0)
const best = ref(readBestScore())
const previous = ref<{ board: Board; score: number } | null>(null)
const continuedAfterWin = ref(false)
const gameOver = computed(() => isGameOver(board.value))
const won = computed(() => hasWon(board.value))
const showWin = computed(() => won.value && !continuedAfterWin.value)
const touchStart = ref<{ x: number; y: number } | null>(null)
const scoreGain = ref(0)
let scoreGainTimer: ReturnType<typeof setTimeout> | undefined

function readBestScore(): number {
  try {
    return Number(window.localStorage.getItem(bestStorageKey)) || 0
  } catch {
    return 0
  }
}

function move(direction: Direction) {
  if (gameOver.value || showWin.value) return
  const result = moveBoard(board.value, direction)
  if (!result.moved) return

  previous.value = { board: board.value.map((row) => [...row]), score: score.value }
  board.value = result.board
  score.value += result.scoreGain
  scoreGain.value = result.scoreGain
  if (scoreGainTimer) clearTimeout(scoreGainTimer)
  if (result.scoreGain) scoreGainTimer = setTimeout(() => (scoreGain.value = 0), 850)

  if (score.value > best.value) {
    best.value = score.value
    try {
      window.localStorage.setItem(bestStorageKey, String(best.value))
    } catch {
      // The game remains playable when browser storage is unavailable.
    }
  }
  if (hasWon(board.value)) continuedAfterWin.value = false
}

function restart() {
  board.value = createBoard()
  score.value = 0
  previous.value = null
  continuedAfterWin.value = false
  scoreGain.value = 0
}

function undo() {
  if (!previous.value) return
  board.value = previous.value.board
  score.value = previous.value.score
  previous.value = null
  continuedAfterWin.value = false
  scoreGain.value = 0
}

function handleKeydown(event: KeyboardEvent) {
  const directions: Record<string, Direction> = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowRight: 'right', d: 'right', D: 'right',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left',
  }
  const direction = directions[event.key]
  if (direction) {
    event.preventDefault()
    move(direction)
  } else if (event.key.toLowerCase() === 'r') {
    restart()
  } else if (event.key.toLowerCase() === 'z') {
    undo()
  }
}

function handleTouchStart(event: TouchEvent) {
  const touch = event.changedTouches[0]
  if (touch) touchStart.value = { x: touch.clientX, y: touch.clientY }
}

function handleTouchEnd(event: TouchEvent) {
  const start = touchStart.value
  const touch = event.changedTouches[0]
  touchStart.value = null
  if (!start || !touch) return
  const dx = touch.clientX - start.x
  const dy = touch.clientY - start.y
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (scoreGainTimer) clearTimeout(scoreGainTimer)
})
</script>

<template>
  <main class="page-shell">
    <header class="topbar">
      <a class="wordmark" href="#top" aria-label="2048 home"><span class="mark-grid"><i></i><i></i><i></i><i></i></span>STUDIO / 01</a>
      <div class="topbar-note"><span class="status-dot"></span> A little game for your next break</div>
    </header>

    <section id="top" class="game-layout" aria-label="2048 game">
      <div class="game-column">
        <div class="title-row">
          <div>
            <p class="eyebrow">THE CLASSIC NUMBER PUZZLE</p>
            <h1>2048<span class="title-period">.</span></h1>
          </div>
          <button class="icon-button restart-icon" aria-label="Start a new game" title="New game (R)" @click="restart">↻</button>
        </div>

        <div class="board-frame">
          <div
            class="board"
            role="grid"
            aria-label="2048 game board. Use arrow keys or WASD to slide tiles."
            @touchstart.passive="handleTouchStart"
            @touchend.passive="handleTouchEnd"
          >
            <template v-for="(row, rowIndex) in board" :key="rowIndex">
              <div
                v-for="(tile, colIndex) in row"
                :key="`${rowIndex}-${colIndex}`"
                class="cell"
                :class="tile ? `tile tile-${tile}` : 'tile-empty'"
                role="gridcell"
                :aria-label="tile ? `${tile}` : 'empty'"
              >
                <span v-if="tile">{{ tile }}</span>
              </div>
            </template>
            <Transition name="overlay">
              <div v-if="showWin || gameOver" class="game-overlay" :class="{ 'is-win': showWin }">
                <div class="overlay-card">
                  <span class="overlay-kicker">{{ showWin ? 'A NEW MILESTONE' : 'NO MOVES LEFT' }}</span>
                  <h2>{{ showWin ? 'You made it.' : 'Good run.' }}</h2>
                  <p>{{ showWin ? 'The 2048 tile is yours. Keep going and see how far you can take it.' : 'Every tile is locked in. Fancy another round?' }}</p>
                  <button v-if="showWin" class="primary-button" @click="continuedAfterWin = true">Keep playing <span>→</span></button>
                  <button v-else class="primary-button" @click="restart">Play again <span>↻</span></button>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <div class="board-caption">
          <span><span class="caption-star">✳</span> MERGE. GROW. REPEAT.</span>
          <span class="move-hint">Swipe or use <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></span>
        </div>
      </div>

      <aside class="side-column">
        <div class="score-panel">
          <div class="scores">
            <div class="score-box">
              <span class="score-label">SCORE</span>
              <strong>{{ score }}</strong>
              <Transition name="score-pop"><span v-if="scoreGain" class="score-gain">+{{ scoreGain }}</span></Transition>
            </div>
            <div class="score-box best-box">
              <span class="score-label">BEST</span>
              <strong>{{ best }}</strong>
            </div>
          </div>
          <div class="panel-rule"></div>
          <div class="panel-actions">
            <button class="primary-button new-game" @click="restart">New game <span>↻</span></button>
            <button class="secondary-button" :disabled="!previous" title="Undo last move (Z)" @click="undo"><span class="undo-arrow">↶</span> Undo</button>
          </div>
        </div>

        <div class="how-to">
          <p class="eyebrow">HOW TO PLAY</p>
          <p class="how-copy">Join the numbers, find your rhythm, and make it all the way to <strong>2048.</strong></p>
          <div class="step-list">
            <div class="step"><span class="step-number">01</span><span>Slide tiles with <strong>arrow keys</strong> or <strong>WASD</strong>.</span></div>
            <div class="step"><span class="step-number">02</span><span>Matching numbers merge into one. Every merge adds to your score.</span></div>
            <div class="step"><span class="step-number">03</span><span>Reach <strong>2048</strong> to win. Keep going if you’re on a roll.</span></div>
          </div>
        </div>

        <div class="shortcut-card">
          <div class="shortcut-heading"><span class="shortcut-spark">✳</span> QUICK KEYS</div>
          <div class="shortcut-row"><span>New game</span><kbd>R</kbd></div>
          <div class="shortcut-row"><span>Undo move</span><kbd>Z</kbd></div>
          <p>One undo, just in case.</p>
        </div>
      </aside>
    </section>

    <footer class="footer"><span>MADE FOR THE JOY OF A GOOD MERGE</span><span>TAKE YOUR TIME <b>·</b> MAKE YOUR MOVE</span></footer>
  </main>
</template>
