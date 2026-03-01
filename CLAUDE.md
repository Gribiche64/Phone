# CLAUDE.md — Mystic Tarot

## Project Overview

**Mystic Tarot** is a web-based tarot card reading application. It features the full 78-card tarot deck (22 Major Arcana + 56 Minor Arcana), card flip animations, multiple spread types, and generated reading summaries. The repository is hosted on GitHub at `Gribiche64/Phone`.

## Repository Structure

```
Phone/
├── index.html       # Single-page app entry point
├── style.css        # All styles — dark mystical theme, card animations, responsive layout
├── script.js        # App logic — deck data, spreads, drawing, and reading generation
├── README.md        # Project readme
└── CLAUDE.md        # This file — guidance for AI assistants
```

This is a **zero-dependency, static web app** — no build step, no framework, no package manager. All code is vanilla HTML, CSS, and JavaScript.

## Development Setup

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local HTTP server for development (e.g., `python3 -m http.server`, VS Code Live Server)

### Getting Started

```bash
git clone <repo-url>
cd Phone
# Open index.html in a browser, or serve locally:
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Architecture

### HTML (`index.html`)
- Spread picker section (single / three-card / five-card)
- Question input field
- Reading area where cards are rendered dynamically via JS

### CSS (`style.css`)
- CSS custom properties (`:root` variables) for theming — gold/purple palette
- Animated starfield background using CSS animations
- 3D card flip via `transform: rotateY(180deg)` with `perspective`
- Reversed cards rotate an additional 180deg
- Fully responsive at 600px breakpoint

### JavaScript (`script.js`)
- **Deck construction:** `buildDeck()` generates 78 cards from `MAJOR_ARCANA`, `SUITS`, `PIPS`, and `COURT` data
- **Spreads:** Defined in `SPREADS` object — each spread has a card count and position labels
- **Drawing:** Fisher-Yates shuffle, ~30% chance for reversed cards
- **Reveal:** Click-to-flip with staggered meaning display
- **Summary:** `generateOverallMessage()` analyzes Major Arcana density, reversed ratio, and suit dominance

## Key Files Quick Reference

| File | Purpose | Key exports/functions |
|------|---------|----------------------|
| `script.js` | All app logic | `buildDeck()`, `drawReading()`, `revealCard()`, `showSummary()`, `resetReading()` |
| `style.css` | Styling | CSS custom properties in `:root`, `.tarot-card` flip system |
| `index.html` | DOM structure | Section IDs: `spread-picker`, `question-section`, `reading-area` |

## Build / Test / Lint Commands

This is a static site with no build tooling. To validate:

```bash
# Serve locally
python3 -m http.server 8000

# Optional: lint JS (if a linter is added later)
# npx eslint script.js
```

## Git Workflow

- **Default branch:** `main`
- Feature branches: `<scope>/<description>`
- Write clear commit messages focused on the "why"
- One logical change per commit

## Code Conventions

- **Vanilla only** — no frameworks or libraries; keep the zero-dependency approach
- **Single-file concerns** — HTML for structure, CSS for presentation, JS for behavior
- CSS variables in `:root` for all theme colors; never hard-code colors elsewhere
- Card data is defined as constants at the top of `script.js`; keep deck data separate from DOM logic
- Use `const` / `let`; avoid `var`
- Keep functions small and descriptive

## Key Guidelines for AI Assistants

1. **Read before writing** — always read existing files before proposing changes
2. **Minimal changes** — only modify what is directly needed; avoid drive-by refactors
3. **No guessing** — if context is missing, ask rather than assume
4. **Security first** — never introduce credentials, secrets, or known vulnerabilities
5. **Keep it vanilla** — do not introduce npm, bundlers, or framework dependencies without explicit request
6. **Keep CLAUDE.md current** — update this file when the project structure or conventions change
