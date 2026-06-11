# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn build          # Compile TypeScript → lib/
yarn build:web      # Bundle web interface → dist/lk.js + dist/lk.w.js + dist/lk.npc.w.js (via esbuild)
yarn dev            # Watch + serve web interface locally
yarn main           # Build + run interactive REPL
yarn lint           # Lint all files with ESLint
yarn prettify       # Format all files with Prettier
yarn test           # Run Jest tests
yarn typecheck      # Type-check without emitting
yarn brute          # Run brute-force solver script
yarn ci             # Run all checks (format, lint, typecheck, test, build:web)
```

Run a single test file: `yarn jest src/render/__tests__/print.test.ts`

## Architecture

This project implements propositional logic proof systems with an interactive REPL and web interface.

### Two logic systems

- **Gentzen LK** (`src/systems/lk.ts`): Sequent calculus for classical propositional logic. Full language (¬, →, ∧, ∨) with ~20 rules including structural rules (weakening, contraction, exchange, rotation).
- **Łukasiewicz Axioms 3** (`src/systems/la3.ts`): Axiom-based system with 3 axioms + modus ponens. Only ¬ and → are primitive; ∧ and ∨ are abbreviations.

### Core domain model (`src/model/`)

- `prop.ts` — Proposition types as discriminated unions: `Atom | Falsum | Verum | Negation | Implication | Conjunction | Disjunction`
- `sequent.ts` — Sequents `Γ ⊢ Δ` with active formula tracking
- `derivation.ts` — Proof trees as `Premise | Transformation`; includes path-based navigation into sub-goals
- `rule.ts` — Rule interface; rules are invertible via `tryReverse()` for backward proof construction
- `challenge.ts` — Challenge/configuration type (`rules: RuleId[], goal: Sequent, solution: Proof`)
- `formulas.ts` — Formula utilities
- `valuation.ts` — Truth valuations for semantic evaluation

### Rules (`src/rules/`)

~30 individual rule files (e.g., `i.ts`, `ir.ts`, `il.ts`, `cut.ts`, `mp.ts`, `a1/a2/a3.ts`). Each exports a rule object with `apply()`, `tryReverse()`, and an `example` derivation.

### Interactive proof system (`src/interactive/`)

- `repl.ts` — Generator-based REPL; proofs are built backwards by applying rules to open goals
- `focus.ts` — Cursor/focus navigation through the proof tree (array of indices = path)
- `event.ts` — Events: `Reverse`, `Next`, `Prev`, `Undo`, `Reset`
- `action.ts` — Named player actions (e.g. `leftWeakening`, `leftConnective`)
- `workspace.ts` — Workspace state combining focus and derivation

### Challenges (`src/challenges/`)

~88 challenges in 10 categories (ch0–ch9: identity → completeness), each specifying allowed rules and a goal sequent. Registered in `challenges/index.ts`.

### Game modes

The web app has three top-level user-facing modes declared in `src/model/mode.ts` (`'random' | 'campaign' | 'match'`), plus auxiliary screens:

- **Campaign** (`src/web/campaign.ts`) — sequential progression through curated challenges; embeds the tutorial via the `Tutorial` type with `pinned` rules.
- **Random** (`src/web/random.ts`, `src/random/`) — endless randomly-generated challenges. `src/random/challenge.ts` builds challenges; `src/random/config.ts` exposes config (rule selection, difficulty).
- **Match / Versus** (`src/web/match-intro.ts`, `match-curated.ts`, `versus.ts`, `versus-config.ts`) — 5-minute head-to-head where two slots solve the same challenge pool side-by-side. P2 defaults to NPC; either slot can be `'human'` or `'npc'` via the input picker / URL params.
- **Quiz** (`src/web/quiz.ts`, `quiz-config.ts`, `src/quiz/`) — secret-menu rule-recognition mode that uses the `RuleSchema` type to generate rule cards with random formula/sequence variable bindings. `src/quiz/schema.ts` is the shared schema infrastructure also relevant to future Nightmare / player-defined-systems work.
- **Sandbox / System docs** (`src/web/system.ts`) — per-system reference shown via `?mode=system`.

### Random configuration (`src/random/`)

- `challenge.ts` — generates a random challenge given a config (selected rules, difficulty).
- `config.ts` — config type + URL-param plumbing for Random mode.

### Quiz subsystem (`src/quiz/`)

- `schema.ts` — `RuleSchema`: rules-as-data with formula and sequence variables. Shared with future Nightmare / player-defined-systems epics; keep generic.
- `generate.ts` — instantiates a `RuleSchema` into a concrete rule card by binding variables.
- `render.ts` — renders a quiz card.
- `config.ts` — Quiz config type.

### NPC subsystem (`src/npc/`)

Computer-controlled players for Versus mode. Each NPC slot dispatches through `workspace.applyEvent` like a human — no AI-only fast path.

- `driver.ts` — tick-loop state machine (`idle → observing → planning → executing`); consumes knobs; dispatches events. `createNpcDriver` is instantiated once per NPC slot in `src/web/versus.ts`.
- `knobs.ts` — knob defaults (`baseThinkMs`, `jitterMs`, `skipAfterMs`, `skipStuckMs`) + URL-param parsing (`npc1_*` / `npc2_*` per slot).
- `proof-walker.ts` — `linearize(proof, opts)` walks a `ProofUsing` tree depth-first-left, emitting `Event`s for paced playback. Branch-order shuffle lives here.
- `solver-runner.ts` — `createSolver()` lazily spawns one Web Worker per NPC slot for off-thread brute search. Cancel via request IDs.
- `npc-worker.ts` — worker entry point; runs `bruteSearch` and posts proofs back.
- `npc-protocol.ts` — message types for the worker channel.

### Rendering (`src/render/`)

Template-based pretty-printer (`print.ts`) with customizable themes; block-based layout (`block.ts`).

`code.ts` — serializes any `AnyDerivation` back to the TypeScript source code that a human would write to construct that proof (e.g. `z.swl(a('p'), i.i(a('q')))`). This is the API used in challenge solution files and sandbox demos.

### Entry points

- `src/main.ts` — CLI REPL (commands include `systems` / `system <id>` to view system docs)
- `src/web.ts` — Web interface (bundled by esbuild into `dist/lk.js`); system docs reachable via `?mode=system`
- `src/help/` — Per-system documentation (`meta` + example proof) shared by REPL and web
- `src/web/` — Web components (menus, challenge worker, game logic, etc.)
- `src/solver/` — Brute-force proof search (`brute.ts`, `bruteStructure0.ts`)

## Typing approach

The codebase has two layers of typing:

- **Static layer**: The `apply` functions on rules (`lk.z.*`, `lk.i.*`) carry precise generic types that encode the logical structure of each inference step. Challenge solutions are built using these functions so TypeScript verifies their correctness at compile time. `any` and `is` are avoided here.
- **Runtime layer**: The interactive proof system works backwards from the goal using `tryReverse`, operating on erased types (`AnySequent`, `AnyDerivation`). Runtime `is` refinements and `| null` returns are accepted here since the player's moves are not known statically.

The utilities in `src/utils/` exist to give standard TypeScript/JavaScript operations more precise types — positional tuple access, structural non-emptiness, composable refinements, typed `Object.entries` — in support of the static layer's goal of avoiding `any` and `is`.

## Conventions

- Strict TypeScript; all types use discriminated unions with type guards/refinements
- No semicolons, single quotes (Prettier config)
- Output goes to `lib/` (tsc) and `dist/lk.js` + `dist/lk.w.js` (challenge worker) + `dist/lk.npc.w.js` (NPC planner worker) (esbuild). **`dist/lk.html` and `dist/lk.css` are source files committed to git, not build outputs** — edit them directly when changing the web app's HTML structure or styles.
- ESLint enforces several non-obvious rules: no `++`/`--` (`no-plusplus`), no non-null assertions (`!`), no type assertions (`as`/`<T>`) outside tests and utils, strict boolean expressions (no implicit truthiness on non-booleans)
- Every user-facing string lives in `src/web/i18n.ts` and is retrieved via `t(key)`. For templated strings (embedded numbers, names), use `{placeholder}` tokens in the translation and substitute at the call site — do not define per-locale formatter functions that bypass the `Record<MessageKey, string>` contract.
