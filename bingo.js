/* ================================================================
   Michigan Summer Bingo
   Tap-to-mark bingo cards synced via Firebase Realtime DB.
   ================================================================ */

const FIREBASE_URL = "https://swear-jar-fca22-default-rtdb.firebaseio.com";
const BINGO_STORAGE = "michigan-bingo-v2";

const BINGO_ITEMS = [
  // Pontoon & jet ski
  "Pontoon ride before noon",
  "Someone hogs the jet ski",
  "Jet ski runs out of gas",
  "Pontoon captain gets lost",
  "Argument over who drives the pontoon",
  "Someone falls off the tube",
  "Pontoon anchored for a swim",
  "Jet ski splash war",
  "Someone tries to wakeboard and eats it",
  "Pontoon snack run",
  "Someone says \"one more lap\" on the jet ski",
  // Lake life
  "Someone says \"the water's fine!\" (it's freezing)",
  "Kid refuses to get out of the lake",
  "Someone skips a stone",
  "Sunburn spotted",
  "Someone floats on a pool noodle",
  "Fishing line gets tangled",
  "Someone catches a fish",
  "Someone catches nothing all day",
  "Kayak tips over",
  "Dock splinter",
  "Cannonball off the dock",
  // Geese & wildlife
  "Geese invade the yard",
  "Someone chased by a goose",
  "Goose poop on the lawn",
  "Deer spotted from the road",
  "Chipmunk steals a snack",
  "Mosquito bite complaint",
  "Someone swats at a horsefly",
  "Frog found near the lakehouse",
  "Turtle spotted in the lake",
  "Fish jumping out of the water",
  // Lakehouse life
  "Screen door slam",
  "Board game argument",
  "Someone falls asleep on the porch",
  "\"No WiFi\" complaint",
  "Someone burns a marshmallow",
  "Perfect s'more made",
  "Someone forgets the bug spray",
  "Citronella candle lit",
  "Puzzle started but not finished",
  "Someone hogs the Adirondack chair",
  "Wet swimsuit on a doorknob",
  "Someone tracks lake water through the house",
  "\"Whose turn is it to do dishes?\"",
  "Someone naps in the hammock",
  // Meijer & Lapeer
  "Meijer run",
  "Someone forgets something at Meijer",
  "Second Meijer run in one day",
  "Driving through Lapeer",
  "Someone says \"ope\"",
  "Michigan left turn",
  "Someone says \"Pure Michigan\"",
  "Vernors purchased",
  "Better Made chips spotted",
  "Faygo consumed",
  "Coney dog eaten",
  // Overheard
  "\"Five more minutes\" (at the lake)",
  "\"I'm not tired\" (clearly tired)",
  "\"Just one more cast\"",
  "\"The sunset is amazing\"",
  "\"Did you put on sunscreen?\"",
  "\"We should come here every summer\"",
  "\"I saw it first\" argument",
  "\"Can we take the pontoon out?\"",
  "\"It's my turn on the jet ski\"",
  "\"The geese are back\"",
  // Family specials
  "Kid scoots along on his butt",
  "Kid clips water bottle to something weird",
  "Towel left at the dock",
  "Someone goes to bed with lake hair",
];

const PLAYERS = [
  { name: "Meg", avatar: "🌊" },
  { name: "Lincoln", avatar: "🦎" },
  { name: "Kailer", avatar: "🏕️" },
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
