/* ================================================================
   Ride Compare — Meg's business idea
   Pulls (simulated) prices from every rideshare service in one go.
   Real version would call each provider's price-estimate API.
   ================================================================ */

// ── Florida vacation preset locations (with rough lat/lon) ────────
const PRESETS = [
  { name: "Universal Epic Universe",        lat: 28.4744, lon: -81.4621 },
  { name: "Universal Studios Florida",      lat: 28.4743, lon: -81.4677 },
  { name: "Islands of Adventure",           lat: 28.4716, lon: -81.4711 },
  { name: "Volcano Bay",                    lat: 28.4677, lon: -81.4729 },
  { name: "Magic Kingdom",                  lat: 28.4177, lon: -81.5812 },
  { name: "EPCOT",                          lat: 28.3747, lon: -81.5494 },
  { name: "Hollywood Studios",              lat: 28.3576, lon: -81.5582 },
  { name: "Animal Kingdom",                 lat: 28.3553, lon: -81.5901 },
  { name: "Disney Springs",                 lat: 28.3702, lon: -81.5191 },
  { name: "MCO — Orlando Airport",          lat: 28.4312, lon: -81.3081 },
  { name: "ICON Park / Drive",              lat: 28.4434, lon: -81.4684 },
  { name: "SeaWorld Orlando",               lat: 28.4111, lon: -81.4609 },
  { name: "Outlets at Vineland",            lat: 28.3651, lon: -81.4946 },
  { name: "Hotel — Cabana Bay",             lat: 28.4623, lon: -81.4660 },
  { name: "Hotel — Hard Rock",              lat: 28.4709, lon: -81.4628 },
];

// ── Rideshare services with realistic-ish pricing models ─────────
// base + perMile + perMin + bookingFee, plus a brand "personality"
// modifier so prices feel varied between services.
const SERVICES = [
  { id: "uber",  name: "Uber",        logo: "U",  cls: "logo-uber",
    base: 2.55, perMile: 1.10, perMin: 0.28, bookingFee: 3.10, etaRange: [3, 9],  available: () => true },
  { id: "lyft",  name: "Lyft",        logo: "L",  cls: "logo-lyft",
    base: 2.30, perMile: 1.05, perMin: 0.32, bookingFee: 3.25, etaRange: [4, 10], available: () => true },
  { id: "bolt",  name: "Bolt",        logo: "B",  cls: "logo-bolt",
    base: 2.10, perMile: 0.95, perMin: 0.24, bookingFee: 2.60, etaRange: [5, 14], available: () => Math.random() > 0.4 },
  { id: "curb",  name: "Curb (Taxi)", logo: "C",  cls: "logo-curb",
    base: 3.50, perMile: 2.40, perMin: 0.45, bookingFee: 2.00, etaRange: [6, 18], available: () => true },
  { id: "via",   name: "Via Shared",  logo: "V",  cls: "logo-via",
    base: 1.75, perMile: 0.80, perMin: 0.18, bookingFee: 1.50, etaRange: [7, 16], available: () => Math.random() > 0.55, note: "shared route" },
  { id: "taxi",  name: "Mears Taxi",  logo: "T",  cls: "logo-taxi",
    base: 3.25, perMile: 2.65, perMin: 0.40, bookingFee: 0.00, etaRange: [8, 22], available: () => true },
];

// Class multipliers
const CLASS_MULT = {
  standard: 1.0,
  xl:       1.55,
  premium:  1.85,
};

// ── DOM refs ────────────────────────────────────────────────────
const pickupEl       = document.getElementById("pickup");
const dropoffEl      = document.getElementById("dropoff");
const pickupPreset   = document.getElementById("pickup-preset");
const dropoffPreset  = document.getElementById("dropoff-preset");
const rideClassEl    = document.getElementById("ride-class");
const ridersEl       = document.getElementById("riders");
const compareBtn     = document.getElementById("compare-btn");
const tripSummary    = document.getElementById("trip-summary");
const summaryRoute   = document.getElementById("summary-route");
const summaryDist    = document.getElementById("summary-distance");
const summaryTime    = document.getElementById("summary-time");
const summarySurge   = document.getElementById("summary-surge");
const resultsEl      = document.getElementById("results");
const disclaimerEl   = document.getElementById("disclaimer");
const bubblesEl      = document.getElementById("bubbles");

// ── Populate preset dropdowns ───────────────────────────────────
function fillPresets() {
  for (const sel of [pickupPreset, dropoffPreset]) {
    for (const p of PRESETS) {
      const opt = document.createElement("option");
      opt.value = p.name;
      opt.textContent = p.name;
      sel.appendChild(opt);
    }
  }
  pickupPreset.addEventListener("change", () => {
    if (pickupPreset.value) pickupEl.value = pickupPreset.value;
  });
  dropoffPreset.addEventListener("change", () => {
    if (dropoffPreset.value) dropoffEl.value = dropoffPreset.value;
  });
}

// ── Find preset by name (case-insensitive contains) ─────────────
function findPreset(name) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return PRESETS.find(p => p.name.toLowerCase() === n)
      || PRESETS.find(p => p.name.toLowerCase().includes(n))
      || PRESETS.find(p => n.includes(p.name.toLowerCase().split(" ")[0]));
}

// ── Distance between two coords (haversine, miles) ──────────────
function haversineMiles(a, b) {
  const toRad = d => d * Math.PI / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ── Deterministic hash → 0..1 (for repeatable free-text trips) ──
function hash01(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 10000) / 10000;
}

// ── Estimate trip distance + time ───────────────────────────────
function estimateTrip(pickupName, dropoffName) {
  const a = findPreset(pickupName);
  const b = findPreset(dropoffName);
  let miles;
  if (a && b) {
    miles = haversineMiles(a, b);
    // bump for road routing vs straight-line
    miles = miles * 1.25 + 0.3;
  } else {
    // Free-text: pseudo-random but stable distance 1.5 – 14 mi
    const seed = hash01((pickupName || "x") + "|" + (dropoffName || "y"));
    miles = 1.5 + seed * 12.5;
  }
  miles = Math.max(0.6, Math.min(miles, 35));
  // Orlando avg ~26 mph door-to-door with traffic
  const minutes = (miles / 26) * 60 + 4 + Math.random() * 3;
  return { miles, minutes };
}

// ── Compute surge multiplier (shared by all services) ───────────
function pickSurge() {
  // 60% no surge, 25% light (1.2x), 12% medium (1.5x), 3% high (2.0x)
  const r = Math.random();
  if (r < 0.60) return { mult: 1.0,  label: "Normal"  };
  if (r < 0.85) return { mult: 1.2,  label: "Busy"    };
  if (r < 0.97) return { mult: 1.5,  label: "High"    };
  return                  { mult: 2.0,  label: "Surge!"  };
}

// ── Compute price for one service ───────────────────────────────
function priceFor(svc, miles, minutes, rideClass, riders, surgeMult) {
  if (!svc.available()) return { unavailable: true };
  // Some services don't offer premium / XL
  if (rideClass === "premium" && (svc.id === "via" || svc.id === "taxi")) {
    return { unavailable: true };
  }
  if (rideClass === "xl" && svc.id === "via") {
    return { unavailable: true };
  }
  if (rideClass === "xl" && riders > 6) {
    return { unavailable: true };
  }
  const classMult = CLASS_MULT[rideClass] || 1.0;
  let fare = svc.base + (svc.perMile * miles) + (svc.perMin * minutes) + svc.bookingFee;
  fare = fare * classMult * surgeMult;
  // tiny per-service jitter so prices don't tie
  fare *= 0.96 + Math.random() * 0.08;

  const [minEta, maxEta] = svc.etaRange;
  const eta = Math.round(minEta + Math.random() * (maxEta - minEta));

  return {
    unavailable: false,
    price: Math.round(fare * 100) / 100,
    eta,
  };
}

// ── Format helpers ──────────────────────────────────────────────
const fmt$   = n => "$" + n.toFixed(2);
const fmtMi  = n => n.toFixed(1) + " mi";
const fmtMin = n => Math.round(n) + " min";

// ── Render results ──────────────────────────────────────────────
function render(pickupName, dropoffName) {
  const rideClass = rideClassEl.value;
  const riders    = Math.max(1, Math.min(6, parseInt(ridersEl.value, 10) || 1));
  const { miles, minutes } = estimateTrip(pickupName, dropoffName);
  const surge = pickSurge();

  // Trip summary
  summaryRoute.textContent = `${pickupName} → ${dropoffName}`;
  summaryDist.textContent  = fmtMi(miles);
  summaryTime.textContent  = fmtMin(minutes);
  summarySurge.textContent = surge.label + (surge.mult > 1 ? ` (${surge.mult}x)` : "");
  tripSummary.classList.remove("hidden");

  // Quote each service
  const quotes = SERVICES.map(svc => ({
    svc,
    ...priceFor(svc, miles, minutes, rideClass, riders, surge.mult),
  }));

  // Sort: available cheapest first, unavailable at bottom
  quotes.sort((a, b) => {
    if (a.unavailable && !b.unavailable) return 1;
    if (!a.unavailable && b.unavailable) return -1;
    if (a.unavailable && b.unavailable) return 0;
    return a.price - b.price;
  });

  // Find cheapest among available for "best deal" highlight
  let bestId = null;
  for (const q of quotes) {
    if (!q.unavailable) { bestId = q.svc.id; break; }
  }

  resultsEl.innerHTML = "";
  quotes.forEach((q, i) => {
    const card = document.createElement("div");
    card.className = "ride-card" + (q.unavailable ? " unavailable" : "") + (q.svc.id === bestId ? " best" : "");
    card.style.animationDelay = (i * 60) + "ms";

    const logo = document.createElement("div");
    logo.className = "ride-logo " + q.svc.cls;
    logo.textContent = q.svc.logo;

    const info = document.createElement("div");
    info.className = "ride-info";
    const name = document.createElement("div");
    name.className = "ride-name";
    name.textContent = q.svc.name;
    if (surge.mult > 1 && !q.unavailable) {
      const pill = document.createElement("span");
      pill.className = "surge-pill";
      pill.textContent = surge.mult + "x";
      name.appendChild(pill);
    }
    const meta = document.createElement("div");
    meta.className = "ride-meta";
    if (q.unavailable) {
      meta.textContent = "Not available for this trip";
    } else {
      const noteBits = [`${q.eta} min away`];
      if (q.svc.note) noteBits.push(q.svc.note);
      meta.textContent = noteBits.join(" · ");
    }
    info.appendChild(name);
    info.appendChild(meta);

    const price = document.createElement("div");
    price.className = "ride-price";
    if (q.unavailable) {
      price.textContent = "—";
    } else {
      price.innerHTML = `${fmt$(q.price)}<small>est. total</small>`;
    }

    card.appendChild(logo);
    card.appendChild(info);
    card.appendChild(price);
    resultsEl.appendChild(card);
  });

  disclaimerEl.classList.remove("hidden");
}

// ── Compare button handler ──────────────────────────────────────
function onCompare() {
  const pickup  = (pickupEl.value || pickupPreset.value || "").trim();
  const dropoff = (dropoffEl.value || dropoffPreset.value || "").trim();
  if (!pickup || !dropoff) {
    pickupEl.style.borderColor = pickup ? "" : "var(--sunset-orange)";
    dropoffEl.style.borderColor = dropoff ? "" : "var(--sunset-orange)";
    return;
  }
  pickupEl.style.borderColor = "";
  dropoffEl.style.borderColor = "";
  compareBtn.disabled = true;
  compareBtn.textContent = "🔄 Checking apps…";
  setTimeout(() => {
    render(pickup, dropoff);
    compareBtn.disabled = false;
    compareBtn.innerHTML = "🔍 Compare prices";
  }, 550);
}

// ── Bubbles (shared background animation) ───────────────────────
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

// ── Init ────────────────────────────────────────────────────────
fillPresets();
createBubbles();
compareBtn.addEventListener("click", onCompare);
// Enter key submits
[pickupEl, dropoffEl, ridersEl].forEach(el => {
  el.addEventListener("keydown", e => {
    if (e.key === "Enter") onCompare();
  });
});
