# ☕ Brew Book

> *A cinematic journal of 38 coffee recipes from around the world — for your moka pot and a quiet morning.*

**Live at:** `https://<your-username>.github.io/brew-book/` *(once you set up GitHub Pages — see below)*

---

## What it is

Brew Book is a personal coffee-recipe journal: **38 drinks from 22 countries**, each told as a short story with ingredients, titled steps, and buying picks for Blue Tokai and Third Wave. Features include:

- 🌍 Cinematic per-recipe scroll view with story, bean notes, ingredients, and steps
- ☕ **Brew Mode** — guided, one-step-at-a-time with a cup-fill progress bar
- ⭐ Ratings and "Made it" tracking (saved to your browser)
- 🔍 Search + filter by method / tried status + sort
- 💾 Backup / Restore your personal ratings as JSON
- 📱 Works on phones (when hosted — see below)

---

## File structure

```
brew-book/
├── index.html            ← markup only; links everything together
├── css/
│   ├── tokens.css        ← design tokens: colours, fonts, spacing (re-theme here)
│   ├── base.css          ← resets and typography
│   └── components.css    ← all component styles
├── js/
│   ├── data.js           ← the 38 recipes + roaster picks  ← ADD RECIPES HERE
│   ├── icons.js          ← glossy SVG icon library
│   ├── animations.js     ← splash, ambient beans, ripples (isolated / safe to edit)
│   └── app.js            ← rendering, search, Brew Mode, storage, init
├── assets/               ← add an og-image / favicon here
├── .nojekyll             ← tells GitHub Pages not to run Jekyll
└── README.md
```

**Golden rule — to change X, edit only:**
| Change | File |
|---|---|
| Add / edit a recipe | `js/data.js` |
| Colours, fonts | `css/tokens.css` |
| How a card or section looks | `css/components.css` |
| A scroll animation | `js/animations.js` |
| An icon | `js/icons.js` |

Editing one file **cannot break** the others.

---

## How to deploy on GitHub Pages (5 minutes)

1. **Create a free account** at [github.com](https://github.com) if you don't have one.
2. Click **New repository** → name it `brew-book` → **Public** → Create.
3. Click **Add file → Upload files** → drag in the entire `brew-book/` folder contents. Commit.
4. Go to **Settings → Pages** → Source = **Deploy from a branch**, Branch = **`main`**, folder = **`/ (root)`** → Save.
5. Wait ~1 min. Your link appears: `https://<your-username>.github.io/brew-book/`

> **To update later:** re-upload only the file you changed (e.g. just `js/data.js` after adding a recipe). The rest stays untouched.

> **Local testing:** open with a local server, not by double-clicking (`file://` won't load the JS modules). Run `python3 -m http.server 8000` in the folder and visit `http://localhost:8000`.

---

## How to add a new recipe

Open **`js/data.js`** and copy an existing `add({…})` block. Fill in:

```js
add({
  id: "seed-yourname",       // unique slug
  serial: 39,                // next number
  date: "2026-07-01",
  name: "Your Recipe Name",
  method: "moka pot",        // moka pot | instant | blended | cezve | other
  origin: "Country",
  ratio: "1:2", ratioLabel: "coffee : milk",
  strength: 3,               // 1–5
  tried: false,
  description: "One-line summary.",
  story: "Narrative paragraph — the soul of the recipe.",
  bean: "Which beans suit this drink.",
  ingredients: ["ingredient 1", "ingredient 2"],
  steps: [
    ["Step title", "Step instruction."],
    ["Next title", "Next instruction."]
  ],
  notes: "Tips and variations."
})
```

Also add a buying-picks entry to `PICKS` (same file), then re-upload `js/data.js` to GitHub. Done — no other file changes needed.

---

## About recipes being saved

- Recipes you add **in the browser** are saved to *that device's localStorage* — private to that browser.
- They are **not** written back to GitHub. GitHub Pages is read-only hosting.
- To make a recipe permanent (visible on every device / to everyone): add it to `js/data.js` and re-upload.
- Use **Backup → Restore** (in the app) to move your personal ratings between devices.

---

## Tech

Vanilla JS (no build step, no npm), CSS custom properties, Google Fonts via CDN. Works offline once loaded. Designed for GitHub Pages — no server needed.

GSAP + Lenis CDN placeholders are commented in `index.html` — uncomment for the Apple-tier scroll rebuild.

---

*Built with ☕ and Claude.*
