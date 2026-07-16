# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn build          # Compile TypeScript → lib/
yarn build:web      # Bundle web interface → dist/lk.js + dist/lk.w.js + dist/lk.npc.w.js (via esbuild)
yarn dev            # Watch + serve web interface locally
yarn lint           # Lint all files with ESLint
yarn prettify       # Format all files with Prettier
yarn test           # Run Jest tests
yarn typecheck      # Type-check without emitting
yarn brute          # Run brute-force solver script
yarn ci             # Run all checks (format, lint, typecheck, test, build:web)
```

Run a single test file: `yarn jest src/render/__tests__/print.ts`

## Architecture

This project implements **Bird Kalkulus**, a propositional-logic proof game built on the **RK** proof system and delivered as a web interface (no CLI).

### The logic system

- **RK** (`src/systems/rk.ts`, display name `RK`): a sequent calculus for classical propositional logic. Full language (¬, →, ∧, ∨) with 16 rules including structural rules (weakening, contraction, exchange, rotation). This is the only system the game surfaces.

### Core domain model (`src/model/`)

- `prop.ts` — Proposition types as discriminated unions: `Atom | Falsum | Verum | Negation | Implication | Conjunction | Disjunction`
- `sequent.ts` — Sequents `Γ ⊢ Δ` with active formula tracking
- `derivation.ts` — Proof trees as `Premise | Transformation`; includes path-based navigation into sub-goals
- `rule.ts` — Rule interface; rules are invertible via `tryReverse()` for backward proof construction
- `challenge.ts` — Challenge/configuration type (`rules: RuleId[], goal: Sequent, solution: Proof`)
- `formulas.ts` — Formula utilities
- `valuation.ts` — Truth valuations for semantic evaluation

### Rules (`src/rules/`)

16 individual rule files (e.g., `i.ts`, `ir.ts`, `il.ts`, `cut.ts`) — exactly RK's rule set; the `RuleId` union in `src/model/rule.ts` matches them one-to-one. Each exports a rule object with `apply()`, `tryReverse()`, and an `example` derivation. The primitives that served the removed systems (LA3, FK) — the axiom rules, modus ponens, and the `fcut` family — are deleted, recoverable in git history if those systems are ever revived.

### Interactive proof system (`src/interactive/`)

The proof engine is driven directly by the web UI via events (there is no command-line/REPL layer).

- `session.ts` — `Session`: the top-level mode plus active workspace (`enter` / `returnToMenu` / `replaceWorkspace`)
- `workspace.ts` — Workspace state combining focus and derivation; also home of the `WorkspaceFactory` type. Moves apply through `workspace.applyEvent`
- `focus.ts` — Cursor/focus navigation through the proof tree (array of indices = path)
- `event.ts` — `Event` union: `Reverse0`, `Reverse1`, `Undo`, `Reset`, `Level`, `NextBranch`, `PrevBranch`, with their constructors
- `action.ts` — Named player actions (e.g. `leftWeakening`, `leftConnective`)
- `ghost.ts` — Ghost/hint rule kinds used to preview applicable rules

### Challenges (`src/challenges/`)

~86 challenges across categories ch0–ch9 (identity → completeness), each specifying allowed rules and a goal sequent. Registered in `challenges/index.ts`.

### Game modes

The web app has two top-level `GameMode`s declared in `src/model/mode.ts` (`'random' | 'campaign'`), plus the Versus flow and auxiliary screens:

- **Campaign** (`src/web/campaign.ts`) — sequential progression through curated challenges; embeds the tutorial via the `Tutorial` type with `pinned` rules.
- **Random** (`src/web/random.ts`, `src/random/`) — endless randomly-generated challenges; the player-facing name is **Zen**, while code and URLs keep the `random` identifier. `src/random/challenge.ts` builds challenges; `src/random/config.ts` exposes config (rule selection, difficulty).
- **Versus** (`src/web/versus.ts`, `versus-config.ts`) — 5-minute head-to-head where two slots solve the same challenge pool side-by-side. P2 defaults to NPC; either slot can be `'human'` or `'npc'` via the input picker / URL params.
- **Secret menu** (`src/web/secret.ts`) — hidden screen (reached by repeatedly clicking the title) linking to the system docs, the design-system gallery, and the archived Campaign.
- **System docs** (`src/web/system.ts`) — per-system reference shown via `?mode=system`.
- **Design-system gallery** (`src/web/gallery.ts`) — living documentation of stable UI elements via `?mode=gallery`; specimens are built with the production constructors/classes so they track the real styles. Chapter prose stays English (system-docs precedent); only production labels go through `t()`.

### Random configuration (`src/random/`)

- `challenge.ts` — generates a random challenge given a config (selected rules, difficulty).
- `config.ts` — config type + URL-param plumbing for Random mode.

### NPC subsystem (`src/npc/`)

Computer-controlled players for Versus mode. Each NPC slot dispatches through `workspace.applyEvent` like a human — no AI-only fast path.

- `driver.ts` — tick-loop state machine (`idle → observing → planning → givingUp/executing`); consumes knobs; dispatches events. `createNpcDriver` is instantiated once per NPC slot in `src/web/versus.ts`. The NPC has no foreknowledge: it runs a depth-bounded brute search (`searchDepth`, reverse1 rules filtered out) in its worker, and when search exhausts it visibly hesitates then skips — never falling back to unbounded search or the precomputed solution.
- `knobs.ts` — knob defaults (`baseThinkMs`, `jitterMs`, `skipAfterMs`, `skipStuckMs`, `searchDepth`) + URL-param parsing (`npc1_*` / `npc2_*` per slot).
- `proof-walker.ts` — `linearize(proof, opts)` walks a `ProofUsing` tree depth-first-left, emitting `Event`s for paced playback. Branch-order shuffle lives here.
- `solver-runner.ts` — `createSolver()` lazily spawns one Web Worker per NPC slot for off-thread brute search. Cancel via request IDs.
- `npc-worker.ts` — worker entry point; runs `bruteSearch` and posts proofs back.
- `npc-protocol.ts` — message types for the worker channel.

### Rendering (`src/render/`)

Template-based pretty-printer (`print.ts`) with customizable themes; block-based layout (`block.ts`).

`code.ts` — serializes any `AnyDerivation` back to the TypeScript source code that a human would write to construct that proof (e.g. `z.swl(a('p'), i.i(a('q')))`). This is the API used in challenge solution files and sandbox demos.

### Entry points

- `src/web.ts` — Web interface (bundled by esbuild into `dist/lk.js`); system docs reachable via `?mode=system`
- `src/web/challenge-worker.ts` / `src/npc/npc-worker.ts` — Web Workers (bundled into `dist/lk.w.js` / `dist/lk.npc.w.js`)
- `src/help/` — Per-system documentation (`meta` + example proof), shown in the web system-docs screen
- `src/web/` — Web components (menus, challenge worker, game logic, etc.)
- `src/solver/` — Brute-force proof search (`brute.ts`, `bruteStructure0.ts`)

## Typing approach

The codebase has two layers of typing:

- **Static layer**: The `apply` functions on rules (`rk.z.*`, `rk.i.*`) carry precise generic types that encode the logical structure of each inference step. Challenge solutions are built using these functions so TypeScript verifies their correctness at compile time. `any` and `is` are avoided here.
- **Runtime layer**: The interactive proof system works backwards from the goal using `tryReverse`, operating on erased types (`AnySequent`, `AnyDerivation`). Runtime `is` refinements and `| null` returns are accepted here since the player's moves are not known statically.

The utilities in `src/utils/` exist to give standard TypeScript/JavaScript operations more precise types — positional tuple access, structural non-emptiness, composable refinements, typed `Object.entries` — in support of the static layer's goal of avoiding `any` and `is`.

## Conventions

- Strict TypeScript; all types use discriminated unions with type guards/refinements
- No semicolons, single quotes (Prettier config)
- Output goes to `lib/` (tsc) and `dist/lk.js` + `dist/lk.w.js` (challenge worker) + `dist/lk.npc.w.js` (NPC planner worker) (esbuild). **`dist/lk.html` and `dist/lk.css` are source files committed to git, not build outputs** — edit them directly when changing the web app's HTML structure or styles.
- ESLint enforces several non-obvious rules: no `++`/`--` (`no-plusplus`), no non-null assertions (`!`), no type assertions (`as`/`<T>`) outside tests and utils, strict boolean expressions (no implicit truthiness on non-booleans)
- Every user-facing string lives in `src/web/i18n.ts` and is retrieved via `t(key)`. For templated strings (embedded numbers, names), use `{placeholder}` tokens in the translation and substitute at the call site — do not define per-locale formatter functions that bypass the `Record<MessageKey, string>` contract.
