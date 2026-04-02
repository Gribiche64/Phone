/* ================================================================
   Florida Vacation Swear Chart
   Scores persist in localStorage on the scorekeeper's phone.
   ================================================================ */

// ── Config ─────────────────────────────────────────────────────
const DISQUALIFY_AT = 10;
const STORAGE_KEY = "florida-swear-chart";
const HISTORY_KEY = "florida-swear-history";

const DEFAULT_PLAYERS = [
  { name: "Meg",     avatar: "🌴", score: 2 },
  { name: "Lincoln", avatar: "🦩", score: 2 },
  { name: "Kailer",  avatar: "🐊", score: 3 },
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

const RANK_LABELS = ["Potty Mouth Champion", "Middle of the Road", "Cleanest Mouth"];

// ── State ──────────────────────────────────────────────────────
var players = loadLocal("players") || DEFAULT_PLAYERS.map(function(p) { return { name: p.name, avatar: p.avatar, score: p.score }; });
var history = loadLocal("history") || [];

// ── DOM References ─────────────────────────────────────────────
var playerCardsEl = document.getElementById("player-cards");
var playerSelect = document.getElementById("player-select");
var swearBtn = document.getElementById("swear-btn");
var goodDeedBtn = document.getElementById("good-deed-btn");
var historyLog = document.getElementById("history-log");
var bubblesEl = document.getElementById("bubbles");
var reactionEl = document.getElementById("reaction-toast");

// ── Initialize ─────────────────────────────────────────────────
try { createBubbles(); } catch (e) {}
renderAll();

// ── Event Listeners ────────────────────────────────────────────
swearBtn.addEventListener("click", function() {
  var idx = parseInt(playerSelect.value, 10);
  if (players[idx].score >= DISQUALIFY_AT) return;
  players[idx].score += 1;
  var reaction = players[idx].score >= DISQUALIFY_AT
    ? "DISQUALIFIED! 10 strikes and you're OUT!"
    : pickRandom(SWEAR_REACTIONS);
  addHistory(players[idx].name, "swear", reaction);
  saveLocal();
  renderAll();
  animateCard(idx, "shake", "bad", "+1");
  showReaction(reaction);
});

goodDeedBtn.addEventListener("click", function() {
  var idx = parseInt(playerSelect.value, 10);
  if (players[idx].score <= 0) return;
  players[idx].score -= 1;
  var reaction = pickRandom(GOOD_DEED_REACTIONS);
  addHistory(players[idx].name, "deed", reaction);
  saveLocal();
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
  var sorted = players
    .map(function(p, i) { return { name: p.name, avatar: p.avatar, score: p.score, idx: i }; })
    .sort(function(a, b) { return b.score - a.score; });

  playerCardsEl.innerHTML = sorted.map(function(p, rank) {
    var disqualified = p.score >= DISQUALIFY_AT;
    var danger = p.score >= 7;
    var scoreClass = disqualified ? "disqualified" : danger ? "danger" : p.score > 0 ? "warning" : "clean";
    var rankLabel = disqualified ? "DISQUALIFIED" : RANK_LABELS[Math.min(rank, RANK_LABELS.length - 1)];
    var cardClass = "player-card" + (disqualified ? " disqualified-card" : "");
    return '<div class="' + cardClass + '" data-rank="' + (rank + 1) + '" data-idx="' + p.idx + '">'
      + '<span class="player-avatar">' + p.avatar + '</span>'
      + '<div class="player-name">' + p.name + '</div>'
      + '<div class="player-score ' + scoreClass + '">' + p.score + ' / ' + DISQUALIFY_AT + '</div>'
      + '<div class="score-bar"><div class="score-fill" style="width:' + (p.score / DISQUALIFY_AT * 100) + '%"></div></div>'
      + '<div class="player-rank">' + rankLabel + '</div>'
      + '</div>';
  }).join("");
}

function renderSelect() {
  var currentVal = playerSelect.value;
  playerSelect.innerHTML = players
    .map(function(p, i) { return '<option value="' + i + '">' + p.avatar + ' ' + p.name + '</option>'; })
    .join("");
  if (currentVal !== "" && currentVal < players.length) {
    playerSelect.value = currentVal;
  }
}

function renderHistory() {
  var recent = history.slice(-15).reverse();
  historyLog.innerHTML = recent.map(function(entry) {
    var cls = entry.type === "swear" ? "swear-entry" : "deed-entry";
    var icon = entry.type === "swear" ? "🤬" : "😇";
    return '<li class="' + cls + '">'
      + '<span class="log-text">' + icon + ' <strong>' + entry.name + '</strong> — ' + entry.reaction + '</span>'
      + '<span class="log-time">' + entry.time + '</span>'
      + '</li>';
  }).join("");
}

// ── Reaction Toast ─────────────────────────────────────────────
function showReaction(text) {
  if (!reactionEl) return;
  reactionEl.textContent = text;
  reactionEl.classList.remove("hidden");
  reactionEl.classList.remove("fade-out");
  setTimeout(function() { reactionEl.classList.add("fade-out"); }, 1500);
  setTimeout(function() { reactionEl.classList.add("hidden"); }, 2200);
}

// ── Animations ─────────────────────────────────────────────────
function animateCard(playerIdx, animClass, changeType, changeText) {
  var card = playerCardsEl.querySelector('[data-idx="' + playerIdx + '"]');
  if (!card) return;

  card.classList.add(animClass);
  setTimeout(function() { card.classList.remove(animClass); }, 600);

  var pop = document.createElement("div");
  pop.className = "score-change " + changeType;
  pop.textContent = changeText;
  card.appendChild(pop);
  setTimeout(function() { pop.remove(); }, 800);
}

// ── History Management ─────────────────────────────────────────
function addHistory(name, type, reaction) {
  var now = new Date();
  var time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  history.push({ name: name, type: type, reaction: reaction, time: time });
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
    var k = key === "players" ? STORAGE_KEY : HISTORY_KEY;
    var raw = localStorage.getItem(k);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

// ── Utilities ──────────────────────────────────────────────────
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createBubbles() {
  for (var i = 0; i < 20; i++) {
    var bubble = document.createElement("div");
    bubble.className = "bubble";
    var size = Math.random() * 40 + 10;
    bubble.style.width = size + "px";
    bubble.style.height = size + "px";
    bubble.style.left = Math.random() * 100 + "%";
    bubble.style.top = Math.random() * 100 + "%";
    bubble.style.setProperty("--dur", (Math.random() * 6 + 4) + "s");
    bubble.style.animationDelay = Math.random() * 5 + "s";
    bubblesEl.appendChild(bubble);
  }
}
