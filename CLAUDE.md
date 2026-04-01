# CLAUDE.md — Florida Vacation Swear Chart

## Project Overview

**Florida Vacation Swear Chart** is a web-based interactive score tracker for tracking swear word penalties and good deed redemptions during a Florida vacation. Players lose points for swearing and earn them back for good deeds. The repository is hosted on GitHub at `Gribiche64/Phone` and deployed via GitHub Pages.

## Repository Structure

```
Phone/
├── index.html       # Single-page app entry point
├── style.css        # All styles — ocean theme, animations, responsive layout
├── script.js        # App logic — player data, scoring, history, localStorage persistence
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
- Scoreboard section with ranked player cards
- Controls section with player selector, swear button, and good deed button
- Activity history log

### CSS (`style.css`)
- CSS custom properties (`:root` variables) for theming — ocean/sand/sunset palette
- Animated floating bubbles background
- Card animations: shake (swear), glow (good deed), score pop-ups
- Fully responsive at 600px breakpoint

### JavaScript (`script.js`)
- **Player data:** Default players (Meg, Lincoln, Kailer) with avatars and starting scores
- **Scoring:** -1 for swears, +1 for good deeds
- **Reactions:** Random fun messages for each action
- **History:** Timestamped activity log (last 50 entries)
- **Persistence:** localStorage for scores and history

## Key Files Quick Reference

| File | Purpose | Key functions |
|------|---------|---------------|
| `script.js` | All app logic | `renderAll()`, `renderScoreboard()`, `animateCard()`, `addHistory()`, `savePlayers()` |
| `style.css` | Styling | CSS custom properties in `:root`, `.player-card` animation system |
| `index.html` | DOM structure | Section IDs: `scoreboard`, `controls`, `history-section` |

## Build / Test / Lint Commands

This is a static site with no build tooling. To validate:

```bash
# Serve locally
python3 -m http.server 8000
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
- Player data is defined as constants at the top of `script.js`; keep data separate from DOM logic
- Use `const` / `let`; avoid `var`
- Keep functions small and descriptive

## Key Guidelines for AI Assistants

1. **Read before writing** — always read existing files before proposing changes
2. **Minimal changes** — only modify what is directly needed; avoid drive-by refactors
3. **No guessing** — if context is missing, ask rather than assume
4. **Security first** — never introduce credentials, secrets, or known vulnerabilities
5. **Keep it vanilla** — do not introduce npm, bundlers, or framework dependencies without explicit request
6. **Keep CLAUDE.md current** — update this file when the project structure or conventions change
