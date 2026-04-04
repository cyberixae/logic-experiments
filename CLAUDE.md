# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn build          # Compile TypeScript → lib/
yarn build:web      # Bundle web interface → dist/lk.js + dist/lk.w.js (via esbuild)
yarn dev            # Watch + serve web interface locally
yarn lk             # Build + run LK sandbox demo
yarn la3            # Build + run LA3 sandbox demo
yarn main           # Build + run interactive REPL
yarn prettify       # Format all files with Prettier
yarn test           # Run Jest tests
yarn typecheck      # Type-check without emitting
yarn brute          # Run brute-force solver script
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

### Rendering (`src/render/`)

Template-based pretty-printer (`print.ts`) with customizable themes; block-based layout (`block.ts`).

`code.ts` — serializes any `AnyDerivation` back to the TypeScript source code that a human would write to construct that proof (e.g. `z.swl(a('p'), i.i(a('q')))`). This is the API used in challenge solution files and sandbox demos.

### Entry points

- `src/main.ts` — CLI REPL
- `src/lk.ts` / `src/la3.ts` — Sandbox demos
- `src/web.ts` — Web interface (bundled by esbuild into `dist/lk.js`)
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
- Output goes to `lib/` (tsc) and `dist/` (esbuild)
