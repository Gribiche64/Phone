/* ================================================================
   Mario Slide Puzzle
   Classic 15-puzzle with Mario characters.
   ================================================================ */

const MARIO_TILES = [
  "🍄", "⭐", "🔥", "🐢", "👑",
  "🪙", "💣", "🌈", "🏰", "🍃",
  "🎯", "⚡", "🐙", "🎩", "💀",
  "🌻", "🪺", "🎪", "🛡️", "🧱",
  "🦑", "🪄", "🎵", "🫧",
];

// ── State ──────────────────────────────────────────
let size = 4;
let tiles = [];
let emptyIdx = 0;
let moves = 0;
let timerInterval = null;
let seconds = 0;
let solved = false;

// ── DOM ────────────────────────────────────────────
const boardEl = document.getElementById("puzzle-board");
const moveCountEl = document.getElementById("move-count");
const timerEl = document.getElementById("timer");
const winBanner = document.getElementById("win-banner");
const winStats = document.getElementById("win-stats");
const shuffleBtn = document.getElementById("shuffle-btn");
const sizeSelect = document.getElementById("size-select");
const bubblesEl = document.getElementById("bubbles");

// ── Init ───────────────────────────────────────────
createBubbles();
initPuzzle();

// ── Events ─────────────────────────────────────────
shuffleBtn.addEventListener("click", () => { initPuzzle(); });

sizeSelect.addEventListener("change", () => {
  size = parseInt(sizeSelect.value, 10);
  initPuzzle();
});

boardEl.addEventListener("click", (e) => {
  if (solved) return;
  const tile = e.target.closest(".puzzle-tile");
  if (!tile || tile.classList.contains("empty")) return;
  const idx = parseInt(tile.dataset.idx, 10);
  if (canMove(idx)) {
    swapTiles(idx, emptyIdx);
    moves++;
    moveCountEl.textContent = moves;
    if (moves === 1) startTimer();
    renderBoard();
    if (checkWin()) {
      solved = true;
      stopTimer();
      winBanner.classList.remove("hidden");
      winStats.textContent = moves + " moves in " + formatTime(seconds);
    }
  }
});

// ── Puzzle Logic ───────────────────────────────────
function initPuzzle() {
  const total = size * size;
  tiles = [];
  for (let i = 1; i < total; i++) tiles.push(i);
  tiles.push(0); // 0 = empty
  emptyIdx = total - 1;
  shuffle();
  moves = 0;
  seconds = 0;
  solved = false;
  moveCountEl.textContent = "0";
  timerEl.textContent = "0:00";
  winBanner.classList.add("hidden");
  stopTimer();
  boardEl.style.gridTemplateColumns = "repeat(" + size + ", 1fr)";
  renderBoard();
}

function shuffle() {
  // Perform random valid moves to ensure solvability
  const total = size * size;
  for (let i = 0; i < total * 80; i++) {
    const neighbors = getNeighbors(emptyIdx);
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    swapTiles(pick, emptyIdx);
  }
}

function getNeighbors(idx) {
  const row = Math.floor(idx / size);
  const col = idx % size;
  const result = [];
  if (row > 0) result.push(idx - size);
  if (row < size - 1) result.push(idx + size);
  if (col > 0) result.push(idx - 1);
  if (col < size - 1) result.push(idx + 1);
  return result;
}

function canMove(idx) {
  return getNeighbors(idx).includes(emptyIdx);
}

function swapTiles(a, b) {
  const tmp = tiles[a];
  tiles[a] = tiles[b];
  tiles[b] = tmp;
  if (tiles[a] === 0) emptyIdx = a;
  if (tiles[b] === 0) emptyIdx = b;
}

function checkWin() {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === 0;
}

// ── Rendering ──────────────────────────────────────
function renderBoard() {
  boardEl.innerHTML = tiles.map((val, i) => {
    if (val === 0) {
      return '<div class="puzzle-tile empty" data-idx="' + i + '"></div>';
    }
    const emoji = MARIO_TILES[(val - 1) % MARIO_TILES.length];
    const isCorrect = val === i + 1;
    const cls = "puzzle-tile t" + val + (isCorrect ? " correct" : "");
    return '<div class="' + cls + '" data-idx="' + i + '">'
      + '<span class="tile-emoji">' + emoji + '</span>'
      + '<span class="tile-number">' + val + '</span>'
      + '</div>';
  }).join("");
}

// ── Timer ──────────────────────────────────────────
function startTimer() {
  stopTimer();
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    timerEl.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + ":" + (sec < 10 ? "0" : "") + sec;
}

// ── Bubbles ────────────────────────────────────────
function createBubbles() {
  for (let i = 0; i < 12; i++) {
    const b = document.createElement("div");
    b.className = "bubble";
    const s = Math.random() * 50 + 15;
    b.style.width = s + "px";
    b.style.height = s + "px";
    b.style.left = Math.random() * 100 + "%";
    b.style.top = Math.random() * 100 + "%";
    b.style.setProperty("--dur", (Math.random() * 6 + 4) + "s");
    b.style.animationDelay = Math.random() * 5 + "s";
    bubblesEl.appendChild(b);
  }
}
