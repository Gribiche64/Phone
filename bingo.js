/* ================================================================
   Universal Bingo
   Tap-to-mark bingo cards synced via Firebase Realtime DB.
   ================================================================ */

const FIREBASE_URL = "https://swear-jar-fca22-default-rtdb.firebaseio.com";
const BINGO_STORAGE = "universal-bingo-v1";

const BINGO_ITEMS = [
  "Someone in a wizard robe",
  "Butterbeer spotted",
  "Kid having a meltdown",
  "Dad asleep in line",
  "Someone takes a selfie",
  "Hear a ride scream",
  "Turkey leg spotted",
  "Character meet & greet",
  "Someone trips",
  "Matching family shirts",
  "Stroller traffic jam",
  "Someone runs to a ride",
  "Lost kid announcement",
  "Face paint spotted",
  "Gift shop bag overload",
  "Someone wearing Minion ears",
  "\"Are we there yet?\"",
  "Someone drops food",
  "Water ride splash victim",
  "Phone battery complaint",
  "Someone cuts in line",
  "Magic wand waving",
  "Map argument",
  "Sunburn spotted",
  "Overpriced snack purchased",
  "Someone says \"epic\"",
  "Fanny pack sighting",
  "Someone FaceTimes on a ride",
  "Ride breaks down",
  "Souvenir cup refill",
  "Dancing to park music",
  "Poncho crew in the rain",
  "\"One more ride\" negotiation",
  "Someone naps on a bench",
  "Photo bomb a stranger",
  "Glow stick necklace",
  "Kid meets a villain",
  "Someone buys a wand",
  "Queue movie spotted",
  "Crocs in the wild",
];

const PLAYERS = [
  { name: "Meg", avatar: "🌴" },
  { name: "Lincoln", avatar: "🦎" },
  { name: "Kailer", avatar: "🐊" },
];

// ── State ──────────────────────────────────────────
let currentPlayer = localStorage.getItem("bingo-player") || "Meg";
let boards = loadLocal() || {};
let wins = {};
let syncInProgress = false;

// ── DOM ────────────────────────────────────────────
const boardEl = document.getElementById("bingo-board");
const playerSelect = document.getElementById("bingo-player");
const newCardBtn = document.getElementById("new-card-btn");
const bannerEl = document.getElementById("bingo-banner");
const scoresEl = document.getElementById("bingo-scores");
const syncIndicator = document.getElementById("sync-status");
const bubblesEl = document.getElementById("bubbles");

// ── Init ───────────────────────────────────────────
createBubbles();
playerSelect.value = currentPlayer;
if (!boards[currentPlayer]) boards[currentPlayer] = generateCard();
saveLocal();
pushToFirebase();
renderBoard();
renderScores();
fetchFromFirebase();
setInterval(fetchFromFirebase, 3000);

// ── Events ─────────────────────────────────────────
playerSelect.addEventListener("change", () => {
  currentPlayer = playerSelect.value;
  localStorage.setItem("bingo-player", currentPlayer);
  if (!boards[currentPlayer]) {
    boards[currentPlayer] = generateCard();
    saveLocal();
    pushToFirebase();
  }
  renderBoard();
  checkBingo();
});

newCardBtn.addEventListener("click", () => {
  boards[currentPlayer] = generateCard();
  saveLocal();
  pushToFirebase();
  renderBoard();
  bannerEl.classList.add("hidden");
});

boardEl.addEventListener("click", (e) => {
  const cell = e.target.closest(".bingo-cell");
  if (!cell || cell.classList.contains("free")) return;
  const idx = parseInt(cell.dataset.idx, 10);
  const card = boards[currentPlayer];
  card.marked[idx] = !card.marked[idx];
  saveLocal();
  pushToFirebase();
  renderBoard();
  checkBingo();
});

// ── Card Generation ────────────────────────────────
function generateCard() {
  const shuffled = BINGO_ITEMS.slice().sort(() => Math.random() - 0.5);
  const items = shuffled.slice(0, 24);
  items.splice(12, 0, "FREE");
  const marked = new Array(25).fill(false);
  marked[12] = true; // free space
  return { items, marked };
}

// ── Rendering ──────────────────────────────────────
function renderBoard() {
  const card = boards[currentPlayer];
  if (!card) return;
  boardEl.innerHTML = card.items.map((item, i) => {
    const isFree = i === 12;
    const isMarked = card.marked[i];
    let cls = "bingo-cell";
    if (isFree) cls += " free marked";
    else if (isMarked) cls += " marked";
    return `<div class="${cls}" data-idx="${i}">${isFree ? "⭐ FREE" : item}</div>`;
  }).join("");
}

function renderScores() {
  scoresEl.innerHTML = PLAYERS.map(p => {
    const w = (wins[p.name] || 0);
    return `<div class="bingo-score-card">
      <div class="score-name">${p.avatar} ${p.name}</div>
      <div class="score-wins">${w}</div>
    </div>`;
  }).join("");
}

// ── Bingo Detection ────────────────────────────────
function checkBingo() {
  const card = boards[currentPlayer];
  if (!card) return;
  const m = card.marked;

  const lines = [
    // rows
    [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
    // columns
    [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
    // diagonals
    [0,6,12,18,24], [4,8,12,16,20],
  ];

  let hasBingo = false;
  const winningCells = new Set();
  lines.forEach(line => {
    if (line.every(i => m[i])) {
      hasBingo = true;
      line.forEach(i => winningCells.add(i));
    }
  });

  if (hasBingo) {
    bannerEl.classList.remove("hidden");
    document.querySelectorAll(".bingo-cell").forEach((cell, i) => {
      if (winningCells.has(i)) cell.classList.add("bingo-highlight");
    });
  } else {
    bannerEl.classList.add("hidden");
  }
}

// ── Local Storage ──────────────────────────────────
function saveLocal() {
  try {
    localStorage.setItem(BINGO_STORAGE, JSON.stringify(boards));
  } catch (e) {}
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(BINGO_STORAGE);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

// ── Firebase Sync ──────────────────────────────────
function pushToFirebase() {
  const data = { boards, wins };
  fetch(FIREBASE_URL + "/bingo.json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(() => { setSyncStatus("synced"); })
    .catch(() => { setSyncStatus("offline"); });
}

function fetchFromFirebase() {
  if (syncInProgress) return;
  syncInProgress = true;
  fetch(FIREBASE_URL + "/bingo.json")
    .then(r => r.json())
    .then(data => {
      syncInProgress = false;
      if (!data) return;
      if (data.boards) {
        // Merge remote boards — keep local current player board if it exists
        const localCard = boards[currentPlayer];
        boards = data.boards;
        if (localCard) boards[currentPlayer] = localCard;
      }
      if (data.wins) {
        wins = data.wins;
        renderScores();
      }
      setSyncStatus("synced");
    })
    .catch(() => {
      syncInProgress = false;
      setSyncStatus("offline");
    });
}

function setSyncStatus(status) {
  if (!syncIndicator) return;
  if (status === "synced") {
    syncIndicator.textContent = "Live";
    syncIndicator.className = "sync-badge synced";
  } else {
    syncIndicator.textContent = "Offline";
    syncIndicator.className = "sync-badge offline";
  }
}

// ── Bubbles ────────────────────────────────────────
function createBubbles() {
  for (let i = 0; i < 15; i++) {
    const b = document.createElement("div");
    b.className = "bubble";
    const s = Math.random() * 40 + 10;
    b.style.width = s + "px";
    b.style.height = s + "px";
    b.style.left = Math.random() * 100 + "%";
    b.style.top = Math.random() * 100 + "%";
    b.style.setProperty("--dur", (Math.random() * 6 + 4) + "s");
    b.style.animationDelay = Math.random() * 5 + "s";
    bubblesEl.appendChild(b);
  }
}
