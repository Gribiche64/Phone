/* ================================================================
   Florida Vacation Swear Chart
   Scores persist in localStorage and sync via Firebase Realtime DB.
   ================================================================ */

// ── Config ─────────────────────────────────────────────────────
const DISQUALIFY_AT = 10;
const STORAGE_KEY = "florida-swear-v2";
const HISTORY_KEY = "florida-swear-history-v2";
const FIREBASE_URL = "https://swear-jar-fca22-default-rtdb.firebaseio.com";

const DEFAULT_PLAYERS = [
  { name: "Meg",     avatar: "🌴", score: 2 },
  { name: "Lincoln", avatar: "🦎", score: 2 },
  { name: "Kailer",  avatar: "🐊", score: 3 },
];

const SWEAR_REACTIONS = [
  "Voldemort heard that one!",
  "Even Hagrid would blush!",
  "That's a Howler-level offense!",
  "The Minions are SHOCKED.",
  "Shrek just covered Donkey's ears.",
  "Butterbeer can't wash that mouth out!",
  "You kiss your Patronus with that mouth?",
  "That word is banned in Hogsmeade!",
  "Velociraptor-level foul language!",
  "The Grinch just clutched his pearls.",
];

const GOOD_DEED_REACTIONS = [
  "Dumbledore awards 10 points!",
  "You've unlocked a golden ticket!",
  "Even Scooby-Doo is impressed!",
  "That's some superhero energy!",
  "The Sorting Hat says... SAINT!",
  "Ollivander would craft you a wand!",
  "Universal would give you a fast pass for that!",
  "Dobby is a free elf thanks to you!",
  "You just earned a dragon egg!",
  "Standing ovation from the Minions!",
];

const RANK_LABELS = ["Potty Mouth Champion", "Middle of the Road", "Cleanest Mouth"];

// ── State ──────────────────────────────────────────────────────
let players = loadLocal("players") || DEFAULT_PLAYERS.map(p => ({ ...p }));
// Always sync avatars from defaults in case they changed
function applyDefaultAvatars() {
  players.forEach((p, i) => { if (DEFAULT_PLAYERS[i]) p.avatar = DEFAULT_PLAYERS[i].avatar; });
}
applyDefaultAvatars();
let history = loadLocal("history") || [];
let syncInProgress = false;

// ── DOM References ─────────────────────────────────────────────
const playerCardsEl = document.getElementById("player-cards");
const playerSelect = document.getElementById("player-select");
const swearBtn = document.getElementById("swear-btn");
const goodDeedBtn = document.getElementById("good-deed-btn");
const historyLog = document.getElementById("history-log");
const bubblesEl = document.getElementById("bubbles");
const reactionEl = document.getElementById("reaction-toast");
const syncIndicator = document.getElementById("sync-status");

// ── Initialize ─────────────────────────────────────────────────
createBubbles();
saveLocal();
pushToFirebase();
renderAll();
fetchFromFirebase();
setInterval(fetchFromFirebase, 3000);

// ── Event Listeners ────────────────────────────────────────────
swearBtn.addEventListener("click", () => {
  const idx = parseInt(playerSelect.value, 10);
  if (players[idx].score >= DISQUALIFY_AT) return;
  players[idx].score += 1;
  const reaction = players[idx].score >= DISQUALIFY_AT
    ? "DISQUALIFIED! 10 strikes and you're OUT!"
    : pickRandom(SWEAR_REACTIONS);
  addHistory(players[idx].name, "swear", reaction);
  saveLocal();
  pushToFirebase();
  renderAll();
  animateCard(idx, "shake", "bad", "+1");
  showReaction(reaction);
});

goodDeedBtn.addEventListener("click", () => {
  const idx = parseInt(playerSelect.value, 10);
  if (players[idx].score <= 0) return;
  players[idx].score -= 1;
  const reaction = pickRandom(GOOD_DEED_REACTIONS);
  addHistory(players[idx].name, "deed", reaction);
  saveLocal();
  pushToFirebase();
  renderAll();
  animateCard(idx, "glow", "good", "-1");
  showReaction(reaction);
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
    const disqualified = p.score >= DISQUALIFY_AT;
    const danger = p.score >= 7;
    const scoreClass = disqualified ? "disqualified" : danger ? "danger" : p.score > 0 ? "warning" : "clean";
    const rankLabel = disqualified ? "DISQUALIFIED" : RANK_LABELS[Math.min(rank, RANK_LABELS.length - 1)];
    const cardClass = "player-card" + (disqualified ? " disqualified-card" : "");
    return `<div class="${cardClass}" data-rank="${rank + 1}" data-idx="${p.idx}">
      <span class="player-avatar">${p.avatar}</span>
      <div class="player-name">${p.name}</div>
      <div class="player-score ${scoreClass}">${p.score} / ${DISQUALIFY_AT}</div>
      <div class="score-bar"><div class="score-fill" style="width:${p.score / DISQUALIFY_AT * 100}%"></div></div>
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
    return `<li class="${cls}">
      <span class="log-text">${icon} <strong>${entry.name}</strong> — ${entry.reaction}</span>
      <span class="log-time">${entry.time}</span>
    </li>`;
  }).join("");
}

// ── Reaction Toast ─────────────────────────────────────────────
function showReaction(text) {
  if (!reactionEl) return;
  reactionEl.textContent = text;
  reactionEl.classList.remove("hidden");
  reactionEl.classList.remove("fade-out");
  setTimeout(() => { reactionEl.classList.add("fade-out"); }, 1500);
  setTimeout(() => { reactionEl.classList.add("hidden"); }, 2200);
}

// ── Animations ─────────────────────────────────────────────────
function animateCard(playerIdx, animClass, changeType, changeText) {
  const card = playerCardsEl.querySelector(`[data-idx="${playerIdx}"]`);
  if (!card) return;

  card.classList.add(animClass);
  setTimeout(() => { card.classList.remove(animClass); }, 600);

  const pop = document.createElement("div");
  pop.className = "score-change " + changeType;
  pop.textContent = changeText;
  card.appendChild(pop);
  setTimeout(() => { pop.remove(); }, 800);
}

// ── History Management ─────────────────────────────────────────
function addHistory(name, type, reaction) {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  history.push({ name, type, reaction, time });
  if (history.length > 50) history = history.slice(-50);
}

// ── Local Storage ──────────────────────────────────────────────
function saveLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {}
}

function loadLocal(key) {
  try {
    const k = key === "players" ? STORAGE_KEY : HISTORY_KEY;
    const raw = localStorage.getItem(k);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

// ── Firebase Sync ─────────────────────────────────────────────
function pushToFirebase() {
  const data = { players, history };
  fetch(FIREBASE_URL + "/swearChart.json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(() => { setSyncStatus("synced"); })
    .catch(() => { setSyncStatus("offline"); });
}

function fetchFromFirebase() {
  if (syncInProgress) return;
  syncInProgress = true;
  fetch(FIREBASE_URL + "/swearChart.json")
    .then(r => r.json())
    .then(data => {
      syncInProgress = false;
      if (!data || !data.players) return;
      let changed = false;
      for (let i = 0; i < data.players.length; i++) {
        if (players[i] && players[i].score !== data.players[i].score) {
          changed = true;
          break;
        }
      }
      let histChanged = data.history && data.history.length !== history.length;
      if (changed || histChanged) {
        players = data.players;
        if (data.history) history = data.history;
        applyDefaultAvatars();
        saveLocal();
        renderAll();
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
