---
name: verify
description: Build, serve, and drive the Bird Kalkulus web app headlessly to verify changes at the real surface (Zen/Campaign/Versus in a browser).
---

# Verifying Bird Kalkulus changes

The only surface is the web app (no CLI). Verify by driving it in a
headless browser and screenshotting.

## Build and serve

```bash
yarn build:web                 # bundles dist/lk.js + workers
cd dist && python3 -m http.server 8931 &   # dist/lk.html + lk.css are committed sources
```

If `yarn dev` is already running (user session), skip both — it serves
on :8000 and rebuilds on save.

## Drive

`playwright-core` (install in scratchpad, not the repo) + system Chrome:

```js
const { chromium } = require('playwright-core')
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
})
```

- Zen mode directly: `http://localhost:8931/lk.html?mode=random`
- Wait for `.tree-sequent` before interacting.
- Buttons are `pre.button` inside `.controls`; match by text
  (atoms are bird emoji: p=🐧 q=🦜 r=🦃 s=🦆 u=🐓 v=🦚).
- Keyboard actions per game-reference §7 (C=lemma, Backspace=undo,
  S/F/G/H/J/L=proof moves, Esc=menu).

## Gotchas

- **Keyboard input hides on-screen controls** in single-player:
  `html.mode-single:not(.input-pointer) .controls` is
  `visibility: hidden` (lk.css). If a button "exists but isn't
  visible" after keyboard presses, that's the input-mode feature, not
  a bug. Click something first (pointer marks input-pointer) or test
  the keyboard path via `page.keyboard`.
- Each page load generates a fresh random challenge — assertions must
  not depend on the goal formula.
- A stray 404 (favicon) appears in the console on load; pre-existing.
- Random challenges can be huge; the tree scrolls horizontally, so
  screenshot assertions should target elements, not fixed coordinates.
