/* ================================================================
   Florida Vacation Swear Chart
   Interactive score tracker with shared cloud sync via jsonblob.com.
   Everyone with the same link sees the same scores in real time.
   ================================================================ */

// ── Cloud Sync ─────────────────────────────────────────────────
const BLOB_API = "https://jsonblob.com/api/jsonBlob";
let blobId = null;
let syncInterval = null;
const SYNC_MS = 5000;

// ── Player Data ────────────────────────────────────────────────
const DEFAULT_PLAYERS = [
  { name: "Meg",     avatar: "\u{1F334}", score: -2 },
  { name: "Lincoln", avatar: "\u{1F9A9}", score: -2 },
  { name: "Kailer",  avatar: "\u{1F40A}", score: -3 },
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
let players = DEFAULT_PLAYERS.map(p => ({ ...p }));
let history = [];

// ── DOM References ─────────────────────────────────────────────
const playerCardsEl = document.getElementById("player-cards");
const playerSelect = document.getElementById("player-select");
const swearBtn = document.getElementById("swear-btn");
const goodDeedBtn = document.getElementById("good-deed-btn");
const historyLog = document.getElementById("history-log");
const bubblesEl = document.getElementById("bubbles");
const shareBar = document.getElementById("share-bar");
const shareLink = document.getElementById("share-link");
const copyBtn = document.getElementById("copy-btn");
const syncStatus = document.getElementById("sync-status");

// ── Initialize ─────────────────────────────────────────────────
createBubbles();
renderAll();
initSync();

// ── Event Listeners ────────────────────────────────────────────
swearBtn.addEventListener("click", () => {
  const idx = parseInt(playerSelect.value, 10);
  players[idx].score -= 1;
  const reaction = pickRandom(SWEAR_REACTIONS);
  addHistory(players[idx].name, "swear", reaction);
  renderAll();
  animateCard(idx, "shake", "bad", "-1");
  saveToCloud();
});

goodDeedBtn.addEventListener("click", () => {
  const idx = parseInt(playerSelect.value, 10);
  players[idx].score += 1;
  const reaction = pickRandom(GOOD_DEED_REACTIONS);
  addHistory(players[idx].name, "deed", reaction);
  renderAll();
  animateCard(idx, "glow", "good", "+1");
  saveToCloud();
});

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(shareLink.value).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
  });
});

// ── Cloud Sync ─────────────────────────────────────────────────
async function initSync() {
  setSyncStatus("connecting");

  const params = new URLSearchParams(window.location.search);
  blobId = params.get("id");

  if (blobId) {
    const loaded = await loadFromCloud();
    if (loaded) {
      renderAll();
      showShareLink();
      startPolling();
      setSyncStatus("synced");
      return;
    }
  }

  await createBlob();
  showShareLink();
  startPolling();
  setSyncStatus("synced");
}

async function createBlob() {
  try {
    const data = { players, history };
    const res = await fetch(BLOB_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const location = res.headers.get("Location") || res.headers.get("location");
    if (location) {
      blobId = location.split("/").pop();
    } else {
      const url = res.url || "";
      blobId = url.split("/").pop();
    }
    if (blobId) {
      window.history.replaceState(null, "", `?id=${blobId}`);
    }
  } catch (e) {
    setSyncStatus("offline");
  }
}

async function loadFromCloud() {
  try {
    const res = await fetch(`${BLOB_API}/${blobId}`);
    if (!res.ok) return false;
    const data = await res.json();
    if (data.players) players = data.players;
    if (data.history) history = data.history;
    return true;
  } catch (e) {
    setSyncStatus("offline");
    return false;
  }
}

async function saveToCloud() {
  if (!blobId) return;
  setSyncStatus("saving");
  try {
    await fetch(`${BLOB_API}/${blobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players, history }),
    });
    setSyncStatus("synced");
  } catch (e) {
    setSyncStatus("offline");
  }
}

function startPolling() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(async () => {
    if (!blobId) return;
    const loaded = await loadFromCloud();
    if (loaded) {
      renderAll();
      setSyncStatus("synced");
    }
  }, SYNC_MS);
}

function showShareLink() {
  if (!blobId) return;
  const url = `${window.location.origin}${window.location.pathname}?id=${blobId}`;
  shareLink.value = url;
  shareBar.classList.remove("hidden");
}

function setSyncStatus(state) {
  if (!syncStatus) return;
  const labels = {
    connecting: "\u{1F504} Connecting...",
    synced:     "\u{2601}\uFE0F Synced",
    saving:     "\u{1F4BE} Saving...",
    offline:    "\u{1F4F4} Offline (local only)",
  };
  syncStatus.textContent = labels[state] || "";
  syncStatus.className = `sync-status ${state}`;
}

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
    const icon = entry.type === "swear" ? "\u{1F92C}" : "\u{1F607}";
    return `
      <li class="${cls}">
        <span class="log-text">${icon} <strong>${entry.name}</strong> \u2014 ${entry.reaction}</span>
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
