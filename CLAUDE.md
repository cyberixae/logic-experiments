# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn build          # Compile TypeScript → lib/
yarn build:web      # Bundle web interface → dist/lk.js (via esbuild)
yarn lk             # Build + run LK sandbox demo
yarn la3            # Build + run LA3 sandbox demo
yarn main           # Build + run interactive REPL
yarn prettify       # Format all files with Prettier
yarn test           # Run Jest tests
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
- `theorem.ts` — Challenge/theorem configuration (`rules: RuleKey[], goal: Sequent`)

### Rules (`src/rules/`)

~30 individual rule files (e.g., `i.ts`, `ir.ts`, `il.ts`, `cut.ts`, `mp.ts`, `a1/a2/a3.ts`). Each exports a rule object with `apply()`, `tryReverse()`, and an `example` derivation.

### Interactive proof system (`src/interactive/`)

- `repl.ts` — Generator-based REPL; proofs are built backwards by applying rules to open goals
- `focus.ts` — Cursor/focus navigation through the proof tree (array of indices = path)
- `event.ts` — Events: `Reverse`, `Next`, `Prev`, `Undo`, `Reset`

### Challenges (`src/challenges/`)

80+ challenges in 8 categories (ch0–ch7: identity → completeness), each specifying allowed rules and a goal sequent. Registered in `challenges/index.ts`.

### Rendering (`src/render/`)

Template-based pretty-printer (`print.ts`) with customizable themes; block-based layout (`block.ts`).

### Entry points

- `src/main.ts` — CLI REPL
- `src/lk.ts` / `src/la3.ts` — Sandbox demos
- `src/web.ts` — Web interface (bundled by esbuild into `dist/lk.js`)

## Typing approach

The codebase has two layers of typing:

- **Static layer**: The `apply` functions on rules (`lk.z.*`, `lk.i.*`) carry precise generic types that encode the logical structure of each inference step. Challenge solutions are built using these functions so TypeScript verifies their correctness at compile time. `any` and `is` are avoided here.
- **Runtime layer**: The interactive proof system works backwards from the goal using `tryReverse`, operating on erased types (`AnySequent`, `AnyDerivation`). Runtime `is` refinements and `| null` returns are accepted here since the player's moves are not known statically.

The utilities in `src/utils/` exist to give standard TypeScript/JavaScript operations more precise types — positional tuple access, structural non-emptiness, composable refinements, typed `Object.entries` — in support of the static layer's goal of avoiding `any` and `is`.

## Conventions

- Strict TypeScript; all types use discriminated unions with type guards/refinements
- No semicolons, single quotes (Prettier config)
- Output goes to `lib/` (tsc) and `dist/` (esbuild)
