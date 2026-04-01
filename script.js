/* ================================================================
   Florida Vacation Swear Chart
   Interactive score tracker — swear words lose points, good deeds earn them back.
   Scores persist in localStorage.
   ================================================================ */

// ── Player Data ────────────────────────────────────────────────
const STORAGE_KEY = "florida-swear-chart";
const HISTORY_KEY = "florida-swear-history";

const DEFAULT_PLAYERS = [
  { name: "Meg",     avatar: "🌴", score: -2 },
  { name: "Lincoln", avatar: "🦩", score: -2 },
  { name: "Kailer",  avatar: "🐊", score: -3 },
];

const SWEAR_REACTIONS = [
  "Ooh, language!",
  "Soap, anyone?",
  "The seagulls heard that!",
  "Not in front of the dolphins!",
  "That cost ya!",
  "Grandma would NOT approve.",
  "The palm trees are blushing.",
  "Florida Man would be proud...",
  "Drop it in the swear jar!",
  "Watch your mouth, beach bum!",
];

const GOOD_DEED_REACTIONS = [
  "Aww, how sweet!",
  "Redemption arc!",
  "Faith in humanity restored.",
  "A true Florida angel.",
  "Gold star for you!",
  "That's the spirit!",
  "Making grandma proud!",
  "Wholesome beach vibes!",
  "You've earned some sunscreen karma.",
  "The manatees approve!",
];

const RANK_LABELS = ["Cleanest Mouth", "Middle of the Road", "Potty Mouth Champion"];

// ── State ──────────────────────────────────────────────────────
let players = loadPlayers();
let history = loadHistory();

// ── DOM References ─────────────────────────────────────────────
const playerCardsEl = document.getElementById("player-cards");
const playerSelect = document.getElementById("player-select");
const swearBtn = document.getElementById("swear-btn");
const goodDeedBtn = document.getElementById("good-deed-btn");
const historyLog = document.getElementById("history-log");
const bubblesEl = document.getElementById("bubbles");

// ── Initialize ─────────────────────────────────────────────────
createBubbles();
renderAll();

// ── Event Listeners ────────────────────────────────────────────
swearBtn.addEventListener("click", () => {
  const idx = parseInt(playerSelect.value, 10);
  players[idx].score -= 1;
  const reaction = pickRandom(SWEAR_REACTIONS);
  addHistory(players[idx].name, "swear", reaction);
  savePlayers();
  saveHistory();
  renderAll();
  animateCard(idx, "shake", "bad", "-1");
});

goodDeedBtn.addEventListener("click", () => {
  const idx = parseInt(playerSelect.value, 10);
  players[idx].score += 1;
  const reaction = pickRandom(GOOD_DEED_REACTIONS);
  addHistory(players[idx].name, "deed", reaction);
  savePlayers();
  saveHistory();
  renderAll();
  animateCard(idx, "glow", "good", "+1");
});

// ── Rendering ──────────────────────────────────────────────────
function renderAll() {
  renderScoreboard();
  renderSelect();
  renderHistory();
}

function renderScoreboard() {
  const sorted = players
    .map((p, i) => ({ ...p, idx: i }))
    .sort((a, b) => b.score - a.score);

  playerCardsEl.innerHTML = sorted.map((p, rank) => {
    const scoreClass = p.score < 0 ? "negative" : p.score > 0 ? "positive" : "zero";
    const rankLabel = RANK_LABELS[Math.min(rank, RANK_LABELS.length - 1)];
    const scoreDisplay = p.score > 0 ? `+${p.score}` : p.score;
    return `
      <div class="player-card" data-rank="${rank + 1}" data-idx="${p.idx}">
        <span class="player-avatar">${p.avatar}</span>
        <div class="player-name">${p.name}</div>
        <div class="player-score ${scoreClass}">${scoreDisplay}</div>
        <div class="player-rank">${rankLabel}</div>
      </div>`;
  }).join("");
}

function renderSelect() {
  const currentVal = playerSelect.value;
  playerSelect.innerHTML = players
    .map((p, i) => `<option value="${i}">${p.avatar} ${p.name}</option>`)
    .join("");
  if (currentVal !== "" && currentVal < players.length) {
    playerSelect.value = currentVal;
  }
}

function renderHistory() {
  const recent = history.slice(-15).reverse();
  historyLog.innerHTML = recent.map(entry => {
    const cls = entry.type === "swear" ? "swear-entry" : "deed-entry";
    const icon = entry.type === "swear" ? "🤬" : "😇";
    return `
      <li class="${cls}">
        <span class="log-text">${icon} <strong>${entry.name}</strong> — ${entry.reaction}</span>
        <span class="log-time">${entry.time}</span>
      </li>`;
  }).join("");
}

// ── Animations ─────────────────────────────────────────────────
function animateCard(playerIdx, animClass, changeType, changeText) {
  const card = playerCardsEl.querySelector(`[data-idx="${playerIdx}"]`);
  if (!card) return;

  card.classList.add(animClass);
  setTimeout(() => card.classList.remove(animClass), 600);

  const pop = document.createElement("div");
  pop.className = `score-change ${changeType}`;
  pop.textContent = changeText;
  card.appendChild(pop);
  setTimeout(() => pop.remove(), 800);
}

// ── History Management ─────────────────────────────────────────
function addHistory(name, type, reaction) {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  history.push({ name, type, reaction, time });
  if (history.length > 50) history = history.slice(-50);
}

// ── Persistence ────────────────────────────────────────────────
function loadPlayers() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { /* fall through */ }
  }
  return DEFAULT_PLAYERS.map(p => ({ ...p }));
}

function savePlayers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

function loadHistory() {
  const saved = localStorage.getItem(HISTORY_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { /* fall through */ }
  }
  return [];
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// ── Utilities ──────────────────────────────────────────────────
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createBubbles() {
  for (let i = 0; i < 20; i++) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const size = Math.random() * 40 + 10;
    bubble.style.width = size + "px";
    bubble.style.height = size + "px";
    bubble.style.left = Math.random() * 100 + "%";
    bubble.style.top = Math.random() * 100 + "%";
    bubble.style.setProperty("--dur", (Math.random() * 6 + 4) + "s");
    bubble.style.animationDelay = Math.random() * 5 + "s";
    bubblesEl.appendChild(bubble);
  }
}
