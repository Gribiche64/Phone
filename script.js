/* ================================================================
   Mystic Tarot — script.js
   Full 78-card deck, spreads, flip animations, and readings.
   ================================================================ */

// ── Tarot Deck Data ─────────────────────────────────────────────

const MAJOR_ARCANA = [
  { name: "The Fool",            numeral: "0",    art: "🃏", upright: "New beginnings, spontaneity, a free spirit", reversed: "Recklessness, holding back, fearfulness" },
  { name: "The Magician",        numeral: "I",    art: "🎩", upright: "Willpower, creation, manifestation", reversed: "Manipulation, trickery, untapped potential" },
  { name: "The High Priestess",  numeral: "II",   art: "🌙", upright: "Intuition, mystery, inner knowledge", reversed: "Secrets withheld, disconnection from intuition" },
  { name: "The Empress",         numeral: "III",  art: "👑", upright: "Abundance, nurturing, fertility", reversed: "Dependence, smothering, creative block" },
  { name: "The Emperor",         numeral: "IV",   art: "🏛️", upright: "Authority, structure, stability", reversed: "Tyranny, rigidity, loss of control" },
  { name: "The Hierophant",      numeral: "V",    art: "📿", upright: "Tradition, guidance, conformity", reversed: "Rebellion, subversiveness, new approaches" },
  { name: "The Lovers",          numeral: "VI",   art: "💕", upright: "Love, harmony, partnerships", reversed: "Disharmony, imbalance, misalignment" },
  { name: "The Chariot",         numeral: "VII",  art: "⚔️", upright: "Determination, willpower, triumph", reversed: "Lack of direction, aggression, defeat" },
  { name: "Strength",            numeral: "VIII", art: "🦁", upright: "Courage, patience, inner strength", reversed: "Self-doubt, weakness, insecurity" },
  { name: "The Hermit",          numeral: "IX",   art: "🏔️", upright: "Soul-searching, introspection, solitude", reversed: "Isolation, loneliness, withdrawal" },
  { name: "Wheel of Fortune",    numeral: "X",    art: "🎡", upright: "Change, cycles, destiny", reversed: "Bad luck, resistance to change, broken cycles" },
  { name: "Justice",             numeral: "XI",   art: "⚖️", upright: "Fairness, truth, accountability", reversed: "Unfairness, dishonesty, lack of accountability" },
  { name: "The Hanged Man",      numeral: "XII",  art: "🙃", upright: "Surrender, new perspective, letting go", reversed: "Stalling, resistance, indecision" },
  { name: "Death",               numeral: "XIII", art: "💀", upright: "Transformation, endings, transition", reversed: "Resistance to change, stagnation, fear" },
  { name: "Temperance",          numeral: "XIV",  art: "🏺", upright: "Balance, moderation, patience", reversed: "Excess, imbalance, lack of patience" },
  { name: "The Devil",           numeral: "XV",   art: "😈", upright: "Shadow self, attachment, bondage", reversed: "Release, breaking free, reclaiming power" },
  { name: "The Tower",           numeral: "XVI",  art: "🗼", upright: "Upheaval, revelation, sudden change", reversed: "Avoidance of disaster, fear of change" },
  { name: "The Star",            numeral: "XVII", art: "⭐", upright: "Hope, inspiration, serenity", reversed: "Despair, discouragement, disconnection" },
  { name: "The Moon",            numeral: "XVIII",art: "🌕", upright: "Illusion, intuition, the subconscious", reversed: "Confusion, fear, misinterpretation" },
  { name: "The Sun",             numeral: "XIX",  art: "☀️", upright: "Joy, success, vitality", reversed: "Sadness, temporary setbacks, lack of clarity" },
  { name: "Judgement",           numeral: "XX",   art: "📯", upright: "Reflection, reckoning, awakening", reversed: "Self-doubt, refusal of self-examination" },
  { name: "The World",           numeral: "XXI",  art: "🌍", upright: "Completion, accomplishment, wholeness", reversed: "Incompletion, shortcuts, emptiness" },
];

const SUITS = [
  {
    name: "Wands", symbol: "🪄", element: "Fire",
    keywords: { upright: "creativity, passion, action", reversed: "delays, lack of energy, hesitation" }
  },
  {
    name: "Cups", symbol: "🏆", element: "Water",
    keywords: { upright: "emotion, intuition, relationships", reversed: "emotional loss, blocked feelings, detachment" }
  },
  {
    name: "Swords", symbol: "🗡️", element: "Air",
    keywords: { upright: "intellect, truth, conflict", reversed: "confusion, harsh words, mental fog" }
  },
  {
    name: "Pentacles", symbol: "🪙", element: "Earth",
    keywords: { upright: "material, career, finances", reversed: "financial loss, insecurity, poor planning" }
  },
];

const COURT = ["Page", "Knight", "Queen", "King"];
const PIPS = [
  { rank: "Ace",   meaning_up: "new opportunity",   meaning_rev: "missed chance" },
  { rank: "Two",   meaning_up: "decisions",          meaning_rev: "indecision" },
  { rank: "Three", meaning_up: "growth",             meaning_rev: "setbacks" },
  { rank: "Four",  meaning_up: "stability",          meaning_rev: "restlessness" },
  { rank: "Five",  meaning_up: "challenge",          meaning_rev: "recovery" },
  { rank: "Six",   meaning_up: "harmony",            meaning_rev: "disharmony" },
  { rank: "Seven", meaning_up: "reflection",         meaning_rev: "confusion" },
  { rank: "Eight", meaning_up: "movement",           meaning_rev: "stagnation" },
  { rank: "Nine",  meaning_up: "fulfillment",        meaning_rev: "disappointment" },
  { rank: "Ten",   meaning_up: "completion",         meaning_rev: "burden" },
];

const COURT_MEANINGS = {
  Page:   { meaning_up: "curiosity and new messages",   meaning_rev: "immaturity and bad news" },
  Knight: { meaning_up: "action and adventure",         meaning_rev: "recklessness and haste" },
  Queen:  { meaning_up: "nurturing and mastery",        meaning_rev: "insecurity and smothering" },
  King:   { meaning_up: "leadership and authority",     meaning_rev: "domineering and rigidity" },
};

const SUIT_ART = {
  Wands:    ["🕯️","🕯️","🔥","🔥","🌋","🏕️","🌅","🎆","🧨","🎇"],
  Cups:     ["🍷","🥂","🍾","🫖","🌊","💧","🌈","🏖️","🧊","🎊"],
  Swords:   ["🔪","⚔️","🌩️","🛡️","💨","⛈️","🌪️","🕸️","🗡️","🏴"],
  Pentacles:["💎","🪙","🏗️","🏦","📉","🎁","🌾","⛏️","🏡","👑"],
};
const COURT_ART = {
  Wands:    { Page: "🧑‍🎨", Knight: "🏇", Queen: "👸", King: "🤴" },
  Cups:     { Page: "🧑‍🎤", Knight: "🏇", Queen: "👸", King: "🤴" },
  Swords:   { Page: "🧑‍✈️", Knight: "🏇", Queen: "👸", King: "🤴" },
  Pentacles:{ Page: "🧑‍🌾", Knight: "🏇", Queen: "👸", King: "🤴" },
};

function buildDeck() {
  const deck = MAJOR_ARCANA.map(c => ({
    ...c,
    type: "major",
    suit: null,
  }));

  for (const suit of SUITS) {
    for (let i = 0; i < PIPS.length; i++) {
      const pip = PIPS[i];
      deck.push({
        name: `${pip.rank} of ${suit.name}`,
        numeral: `${suit.name}`,
        art: SUIT_ART[suit.name][i],
        upright: `${pip.meaning_up} in ${suit.keywords.upright}`,
        reversed: `${pip.meaning_rev} in ${suit.keywords.reversed}`,
        type: "minor",
        suit: suit.name,
      });
    }
    for (const rank of COURT) {
      const cm = COURT_MEANINGS[rank];
      deck.push({
        name: `${rank} of ${suit.name}`,
        numeral: `${suit.name}`,
        art: COURT_ART[suit.name][rank],
        upright: `${cm.meaning_up} in ${suit.keywords.upright}`,
        reversed: `${cm.meaning_rev} in ${suit.keywords.reversed}`,
        type: "minor",
        suit: suit.name,
      });
    }
  }
  return deck;
}

const FULL_DECK = buildDeck();

// ── Spread Definitions ──────────────────────────────────────────

const SPREADS = {
  single: {
    count: 1,
    positions: ["Your Card"],
  },
  three: {
    count: 3,
    positions: ["Past", "Present", "Future"],
  },
  five: {
    count: 5,
    positions: ["Present", "Challenge", "Past", "Future", "Potential"],
  },
};

// ── State ───────────────────────────────────────────────────────

let currentSpread = "single";
let drawnCards = [];
let revealedCount = 0;

// ── DOM refs ────────────────────────────────────────────────────

const spreadBtns     = document.querySelectorAll(".spread-btn");
const drawBtn        = document.getElementById("draw-btn");
const resetBtn       = document.getElementById("reset-btn");
const readingArea    = document.getElementById("reading-area");
const cardSpread     = document.getElementById("card-spread");
const readingSummary = document.getElementById("reading-summary");
const summaryText    = document.getElementById("summary-text");
const spreadPicker   = document.getElementById("spread-picker");
const questionSection= document.getElementById("question-section");

// ── Stars background ────────────────────────────────────────────

(function generateStars() {
  const container = document.getElementById("stars");
  for (let i = 0; i < 90; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top  = Math.random() * 100 + "%";
    star.style.setProperty("--dur", (1.5 + Math.random() * 3) + "s");
    star.style.animationDelay = (Math.random() * 3) + "s";
    container.appendChild(star);
  }
})();

// ── Spread selection ────────────────────────────────────────────

spreadBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    spreadBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSpread = btn.dataset.spread;
  });
});

// ── Draw cards ──────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawReading() {
  const spread = SPREADS[currentSpread];
  const shuffled = shuffle(FULL_DECK);
  drawnCards = shuffled.slice(0, spread.count).map(card => ({
    ...card,
    isReversed: Math.random() < 0.3,
  }));
  revealedCount = 0;

  spreadPicker.classList.add("hidden");
  questionSection.classList.add("hidden");
  readingArea.classList.remove("hidden");
  readingSummary.classList.add("hidden");
  resetBtn.classList.add("hidden");

  cardSpread.innerHTML = "";

  drawnCards.forEach((card, i) => {
    const slot = document.createElement("div");
    slot.className = "card-slot";

    const posLabel = document.createElement("div");
    posLabel.className = "card-position-label";
    posLabel.textContent = spread.positions[i];
    slot.appendChild(posLabel);

    const cardEl = document.createElement("div");
    cardEl.className = "tarot-card" + (card.isReversed ? " reversed" : "");
    cardEl.dataset.index = i;
    cardEl.innerHTML = `
      <div class="card-face card-back">
        <div class="card-back-design"></div>
      </div>
      <div class="card-face card-front">
        <div class="card-numeral">${card.numeral}</div>
        <div class="card-art">${card.art}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-upright-reversed">${card.isReversed ? "Reversed" : "Upright"}</div>
      </div>
    `;

    cardEl.addEventListener("click", () => revealCard(cardEl, i));
    slot.appendChild(cardEl);

    const meaning = document.createElement("div");
    meaning.className = "card-meaning";
    meaning.id = "meaning-" + i;
    meaning.innerHTML = `
      <span class="meaning-label">${card.isReversed ? "Reversed" : "Upright"}</span>
      <p>${card.isReversed ? card.reversed : card.upright}</p>
    `;
    slot.appendChild(meaning);

    cardSpread.appendChild(slot);
  });
}

function revealCard(cardEl, index) {
  if (cardEl.classList.contains("flipped")) return;
  cardEl.classList.add("flipped");
  revealedCount++;

  setTimeout(() => {
    const meaningEl = document.getElementById("meaning-" + index);
    if (meaningEl) meaningEl.classList.add("show");
  }, 500);

  if (revealedCount === drawnCards.length) {
    setTimeout(showSummary, 900);
  }
}

// ── Summary ─────────────────────────────────────────────────────

function showSummary() {
  const spread = SPREADS[currentSpread];
  const lines = drawnCards.map((card, i) => {
    const orient = card.isReversed ? "reversed" : "upright";
    const meaning = card.isReversed ? card.reversed : card.upright;
    return `<strong>${spread.positions[i]}:</strong> ${card.name} (${orient}) &mdash; ${meaning}.`;
  });

  const overall = generateOverallMessage();
  summaryText.innerHTML = lines.join("<br><br>") + "<br><br><em>" + overall + "</em>";
  readingSummary.classList.remove("hidden");
  resetBtn.classList.remove("hidden");
}

function generateOverallMessage() {
  const majorCount = drawnCards.filter(c => c.type === "major").length;
  const reversedCount = drawnCards.filter(c => c.isReversed).length;
  const suits = drawnCards.filter(c => c.suit).map(c => c.suit);

  const messages = [];

  if (majorCount > drawnCards.length / 2) {
    messages.push("The prevalence of Major Arcana cards suggests powerful forces at work in your life — pay attention to the larger themes unfolding.");
  }
  if (reversedCount > drawnCards.length / 2) {
    messages.push("Many reversed cards indicate inner work is needed. Look inward before taking outward action.");
  } else if (reversedCount === 0) {
    messages.push("All cards appear upright, signaling clarity and forward momentum in your path.");
  }

  const suitSet = new Set(suits);
  if (suitSet.size === 1 && suits.length > 1) {
    const dominant = suits[0];
    const element = SUITS.find(s => s.name === dominant)?.element;
    messages.push(`The dominance of ${dominant} (${element}) points to themes of ${SUITS.find(s => s.name === dominant)?.keywords.upright}.`);
  }

  if (messages.length === 0) {
    messages.push("The cards reveal a balanced mixture of energies. Stay open to the guidance each card offers and trust your intuition.");
  }

  return messages.join(" ");
}

// ── Reset ───────────────────────────────────────────────────────

function resetReading() {
  readingArea.classList.add("hidden");
  spreadPicker.classList.remove("hidden");
  questionSection.classList.remove("hidden");
  readingSummary.classList.add("hidden");
  resetBtn.classList.add("hidden");
  cardSpread.innerHTML = "";
  drawnCards = [];
  revealedCount = 0;
}

// ── Event Listeners ─────────────────────────────────────────────

drawBtn.addEventListener("click", drawReading);
resetBtn.addEventListener("click", resetReading);
