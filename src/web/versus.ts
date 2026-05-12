import { undo } from '../interactive/event'
import { activePath } from '../interactive/focus'
import { Workspace } from '../interactive/workspace'
import { Action } from '../interactive/action'
import type { Prop } from '../model/prop'
import { ChallengeResult } from './challenge-protocol'
import { ChallengePool } from './challenge-pool'
import {
  AnyWorkspace,
  ApplyReverse1,
  BenchCtx,
  countRuleUsage,
  createBench,
  createBenchCtx,
  createButton,
  createDispatch,
  markKeyboardInput,
  qwertyKeyMap,
  setupGamepad,
  subscribeGamepad,
} from './game'
import { createFormulaEditor } from './formula-editor'
import { MountResult, Navigate } from './types'
import { t } from './i18n'
import { VersusConfig } from './versus-config'

const formatTime = (s: number): string => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const totalMoves = (ws: AnyWorkspace): number => {
  const counts = countRuleUsage(ws.currentConjecture().derivation)
  return Object.values(counts).reduce((a, b) => a + b, 0)
}

// Build a formula-editor shroud scoped to one half of the versus screen.
// The shroud is appended to document.body so it survives rerenders triggered
// by the other player solving. 'left' scopes it to the left half (right: 50%),
// 'right' to the right half (left: 50%).
const makeVersusFormulaEditor = (
  side: 'left' | 'right',
  onFormula: (formula: Prop) => void,
  onCancel: () => void,
): (() => void) => {
  let modal: HTMLElement | null = null
  const close = () => {
    modal?.remove()
    modal = null
    onCancel()
  }
  modal = createFormulaEditor(
    t('lemmaTitle'),
    t('lemmaConfirm'),
    onFormula,
    close,
  )
  if (side === 'left') {
    modal.style.right = 'calc(50% + 2.5em)'
  } else {
    modal.style.left = 'calc(50% + 2.5em)'
  }
  document.body.appendChild(modal)
  return close
}

export const mountVersus = (
  container: HTMLElement,
  navigate: Navigate,
  pool: ChallengePool,
  versusConfig: VersusConfig,
): MountResult => {
  // Shared challenge list — same challenges in same order for both players
  const sharedChallenges: ChallengeResult[] = []
  const ensureChallenge = (i: number) => {
    while (sharedChallenges.length <= i + 2) sharedChallenges.push(pool.take())
  }
  ensureChallenge(0)

  // ResolvedEntry: the settled outcome for a challenge a player has left behind.
  // 'current' is derived dynamically from which challenge the player is on now.
  type ResolvedEntry = number | 'skip'
  type DisplayEntry = ResolvedEntry | 'current'

  // Per-player state
  let index1 = 0 // next sequential challenge index for player 1
  let score1 = 0
  const resolved1 = new Map<number, ResolvedEntry>() // challenge idx → outcome
  const levelPoints1 = new Map<number, number>()
  const skipSynthetic1 = new Map<number, number>()
  let pending1: number[] = [] // challenge indices to re-face, front = next
  let scoreCommitted1 = false

  let index2 = 0
  let score2 = 0
  const resolved2 = new Map<number, ResolvedEntry>()
  const levelPoints2 = new Map<number, number>()
  const skipSynthetic2 = new Map<number, number>()
  let pending2: number[] = []
  let scoreCommitted2 = false

  const currentChallengeIdx1 = (): number => pending1[0] ?? index1
  const currentChallengeIdx2 = (): number => pending2[0] ?? index2

  const makeWorkspace = (i: number): AnyWorkspace => {
    ensureChallenge(i)
    const item = sharedChallenges[i]
    if (item === undefined)
      throw new Error('no challenge at index ' + String(i))
    return new Workspace({ challenge: item.challenge })
  }

  const advancePlayer1 = (): void => {
    scoreCommitted1 = false
    if (pending1.length > 0) {
      pending1 = pending1.slice(1)
    } else {
      index1 += 1
    }
    ws1 = makeWorkspace(currentChallengeIdx1())
  }
  const advancePlayer2 = (): void => {
    scoreCommitted2 = false
    if (pending2.length > 0) {
      pending2 = pending2.slice(1)
    } else {
      index2 += 1
    }
    ws2 = makeWorkspace(currentChallengeIdx2())
  }

  let ws1 = makeWorkspace(0)
  let ws2 = makeWorkspace(0)

  // Per-bench isolated contexts — input mode determines action hint style.
  // Auto-zoom disabled: at half-viewport width it overshoots downward; zoom=1 is the right default.
  // showPar disabled: revealing par while the other player is still solving gives an unfair hint.
  const makeCtx = (input: typeof versusConfig.p1Input): BenchCtx => {
    const base = createBenchCtx(input !== 'keyboard', false, false, false)
    if (input !== 'mouse') return base
    return { ...base, getActionHint: () => undefined, kbdHint: () => undefined }
  }
  const ctx1 = makeCtx(versusConfig.p1Input)
  const ctx2 = makeCtx(versusConfig.p2Input)

  // Timer
  let timeLeft = versusConfig.gameDurationSeconds
  let gameOver = false
  // Reference kept so the ticker can patch text without rebuilding the DOM.
  let timerEl: HTMLElement | null = null

  // Formula editor state — tracked separately per player so each half is independent.
  let closeEditor1: (() => void) | null = null
  let closeEditor2: (() => void) | null = null

  const makeUndoControls = (ws: AnyWorkspace, ctx: BenchCtx): HTMLElement => {
    const el = document.createElement('div')
    el.setAttribute('class', 'controls')
    const canUndo = activePath(ws.currentConjecture()).length > 0
    const enabled = canUndo || ctx.isGazeModeActive()
    el.appendChild(
      createButton(
        t('undo'),
        !enabled,
        () => {
          if (canUndo) {
            ws.applyEvent(undo())
          } else {
            ctx.setGazeModeActive(false)
          }
          rerender()
        },
        ctx.getActionHint('undo'),
      ),
    )
    return el
  }

  // rerender is defined before solvePlayer* so they can reference it
  const rerender = () => {
    if (ws1.isSolved()) commitScore1()
    if (ws2.isSolved()) commitScore2()
    container.innerHTML = ''
    timerEl = null

    const screen = document.createElement('div')
    screen.setAttribute('class', 'versus-screen')

    // Side-by-side benches
    const arena = document.createElement('div')
    arena.setAttribute('class', 'versus-arena')

    const half1 = document.createElement('div')
    half1.setAttribute('class', 'versus-half')
    half1.appendChild(
      createBench(
        ws1,
        makeCongratsP1,
        makeUndoControls(ws1, ctx1),
        rerender,
        undefined,
        onApplyReverse1,
        undefined,
        ctx1,
        skipPlayer1,
      ),
    )

    const half2 = document.createElement('div')
    half2.setAttribute('class', 'versus-half')
    half2.appendChild(
      createBench(
        ws2,
        makeCongratsP2,
        makeUndoControls(ws2, ctx2),
        rerender,
        undefined,
        onApplyReverse2,
        undefined,
        ctx2,
        skipPlayer2,
      ),
    )

    const thermo = document.createElement('div')
    thermo.setAttribute('class', 'versus-thermo')

    const clock = document.createElement('div')
    clock.setAttribute('class', 'versus-thermo-clock')
    clock.textContent = formatTime(timeLeft)
    timerEl = clock
    thermo.appendChild(clock)

    const thermoRows = document.createElement('div')
    thermoRows.setAttribute('class', 'versus-thermo-rows')

    const ci1 = currentChallengeIdx1()
    const ci2 = currentChallengeIdx2()
    const allKeys = [
      ci1,
      ci2,
      ...Array.from(resolved1.keys()),
      ...Array.from(resolved2.keys()),
    ]
    const maxIdx = Math.max(...allKeys)

    const currentMoves1 = totalMoves(ws1)
    const currentMoves2 = totalMoves(ws2)

    const displayEntry = (
      resolved: Map<number, ResolvedEntry>,
      ci: number,
      i: number,
    ): DisplayEntry | undefined =>
      i === ci ? (resolved.get(i) ?? 'current') : resolved.get(i)

    const entryMoves = (
      e: DisplayEntry | undefined,
      cur: number,
      synthetic: number | undefined,
    ): string => {
      if (e === undefined) return ''
      if (e === 'current') return String(cur)
      if (e === 'skip')
        return synthetic !== undefined ? `(${String(synthetic)})` : '–'
      return String(e)
    }
    const entryPts = (
      e: DisplayEntry | undefined,
      pts: number | undefined,
    ): string => {
      if (e === undefined || e === 'current') return ''
      if (e === 'skip') return '0'
      return `+${String(pts ?? 1)}`
    }
    const makeCell = (
      entry: DisplayEntry | undefined,
      cur: number,
      pts: number | undefined,
      synthetic: number | undefined,
      playerClass: 'p1' | 'p2',
    ): HTMLElement => {
      const cell = document.createElement('div')
      cell.setAttribute(
        'class',
        `versus-thermo-cell ${playerClass}${entry === 'current' ? ' current' : ''}`,
      )
      const movesEl = document.createElement('div')
      movesEl.setAttribute('class', 'versus-thermo-moves')
      movesEl.textContent = entryMoves(entry, cur, synthetic)
      const ptsEl = document.createElement('div')
      ptsEl.setAttribute('class', 'versus-thermo-points')
      ptsEl.textContent = entryPts(entry, pts)
      cell.appendChild(movesEl)
      cell.appendChild(ptsEl)
      return cell
    }

    // Newest row first: iterate in reverse so current challenge renders at top
    for (let i = maxIdx; i >= 0; i -= 1) {
      const row = document.createElement('div')
      row.setAttribute('class', 'versus-thermo-row')
      row.appendChild(
        makeCell(
          displayEntry(resolved1, ci1, i),
          currentMoves1,
          levelPoints1.get(i),
          skipSynthetic1.get(i),
          'p1',
        ),
      )
      row.appendChild(
        makeCell(
          displayEntry(resolved2, ci2, i),
          currentMoves2,
          levelPoints2.get(i),
          skipSynthetic2.get(i),
          'p2',
        ),
      )
      thermoRows.appendChild(row)
    }
    const thermoTotal = document.createElement('div')
    thermoTotal.setAttribute('class', 'versus-thermo-total')
    const totalCell1 = document.createElement('div')
    totalCell1.setAttribute('class', 'versus-thermo-cell p1 total')
    totalCell1.textContent = String(score1)
    const totalCell2 = document.createElement('div')
    totalCell2.setAttribute('class', 'versus-thermo-cell p2 total')
    totalCell2.textContent = String(score2)
    thermoTotal.appendChild(totalCell1)
    thermoTotal.appendChild(totalCell2)
    thermo.appendChild(thermoTotal)

    thermo.appendChild(thermoRows)

    arena.appendChild(half1)
    arena.appendChild(thermo)
    arena.appendChild(half2)

    screen.appendChild(arena)
    container.appendChild(screen)

    // Result overlay when time expires
    if (gameOver) {
      const resultMsg =
        score1 > score2
          ? t('winsTemplate').replace('{player}', t('player1'))
          : score2 > score1
            ? t('winsTemplate').replace('{player}', t('player2'))
            : t('tie')

      const overlay = document.createElement('div')
      overlay.setAttribute('class', 'versus-result')

      const msg = document.createElement('div')
      msg.setAttribute('class', 'versus-result-message')
      msg.textContent = resultMsg

      const scores = document.createElement('div')
      scores.setAttribute('class', 'versus-result-scores')
      scores.textContent = `${t('player1')}: ${String(score1)}  •  ${t('player2')}: ${String(score2)}`

      const backBtn = createButton(t('back'), false, () => navigate('menu'))
      overlay.appendChild(msg)
      overlay.appendChild(scores)
      overlay.appendChild(backBtn)
      container.appendChild(overlay)
    }
  }

  // Auto-advance on solve — replaces workspace before rerender so bench never shows congrats
  const commitScore1 = () => {
    if (scoreCommitted1) return
    scoreCommitted1 = true
    const challengeIdx = currentChallengeIdx1()
    const moves1 = totalMoves(ws1)
    const isRetry = resolved1.get(challengeIdx) === 'skip'
    resolved1.set(challengeIdx, moves1)
    score1 += 1
    levelPoints1.set(challengeIdx, 1)

    if (isRetry) {
      // Player 1 re-solves a previously skipped challenge after player 2 solved it.
      // Undo the synthetic bonus that was awarded to player 2 at re-queue time.
      const p2Moves = resolved2.get(challengeIdx)
      if (typeof p2Moves === 'number') {
        score2 -= p2Moves * p2Moves
        levelPoints2.set(challengeIdx, 1)
        skipSynthetic1.delete(challengeIdx)
        const diff = moves1 - p2Moves
        const bonus = diff * diff
        if (moves1 < p2Moves) {
          score1 += bonus
          levelPoints1.set(challengeIdx, 1 + bonus)
        } else if (p2Moves < moves1) {
          score2 += bonus
          levelPoints2.set(challengeIdx, 1 + bonus)
        }
      }
    } else {
      const p2Entry = resolved2.get(challengeIdx)
      if (typeof p2Entry === 'number') {
        const diff = moves1 - p2Entry
        const bonus = diff * diff
        if (moves1 < p2Entry) {
          score1 += bonus
          levelPoints1.set(challengeIdx, 1 + bonus)
        } else if (p2Entry < moves1) {
          score2 += bonus
          levelPoints2.set(
            challengeIdx,
            (levelPoints2.get(challengeIdx) ?? 1) + bonus,
          )
        }
      } else if (p2Entry === 'skip') {
        // Player 2 skipped this challenge; player 1 just solved it.
        // Award synthetic penalty to player 2 and re-queue the challenge for them.
        const synthetic = 2 * moves1
        skipSynthetic2.set(challengeIdx, synthetic)
        const bonus = moves1 * moves1
        score1 += bonus
        levelPoints1.set(challengeIdx, 1 + bonus)
        pending2 = [challengeIdx, ...pending2]
      }
    }
  }
  const solvePlayer1 = () => {
    commitScore1()
    advancePlayer1()
    rerender()
  }

  const commitScore2 = () => {
    if (scoreCommitted2) return
    scoreCommitted2 = true
    const challengeIdx = currentChallengeIdx2()
    const moves2 = totalMoves(ws2)
    const isRetry = resolved2.get(challengeIdx) === 'skip'
    resolved2.set(challengeIdx, moves2)
    score2 += 1
    levelPoints2.set(challengeIdx, 1)

    if (isRetry) {
      const p1Moves = resolved1.get(challengeIdx)
      if (typeof p1Moves === 'number') {
        score1 -= p1Moves * p1Moves
        levelPoints1.set(challengeIdx, 1)
        skipSynthetic2.delete(challengeIdx)
        const diff = moves2 - p1Moves
        const bonus = diff * diff
        if (moves2 < p1Moves) {
          score2 += bonus
          levelPoints2.set(challengeIdx, 1 + bonus)
        } else if (p1Moves < moves2) {
          score1 += bonus
          levelPoints1.set(challengeIdx, 1 + bonus)
        }
      }
    } else {
      const p1Entry = resolved1.get(challengeIdx)
      if (typeof p1Entry === 'number') {
        const diff = moves2 - p1Entry
        const bonus = diff * diff
        if (moves2 < p1Entry) {
          score2 += bonus
          levelPoints2.set(challengeIdx, 1 + bonus)
        } else if (p1Entry < moves2) {
          score1 += bonus
          levelPoints1.set(
            challengeIdx,
            (levelPoints1.get(challengeIdx) ?? 1) + bonus,
          )
        }
      } else if (p1Entry === 'skip') {
        const synthetic = 2 * moves2
        skipSynthetic1.set(challengeIdx, synthetic)
        const bonus = moves2 * moves2
        score2 += bonus
        levelPoints2.set(challengeIdx, 1 + bonus)
        pending1 = [challengeIdx, ...pending1]
      }
    }
  }
  const solvePlayer2 = () => {
    commitScore2()
    advancePlayer2()
    rerender()
  }

  const skipPlayer1 = () => {
    if (gameOver) return
    const challengeIdx = currentChallengeIdx1()
    const isRetry = resolved1.get(challengeIdx) === 'skip'
    resolved1.set(challengeIdx, 'skip')

    if (!isRetry) {
      // First-time skip: if opponent already solved, apply synthetic (no re-queue —
      // re-queue only triggers when opponent solves AFTER the skip).
      const p2Entry = resolved2.get(challengeIdx)
      if (typeof p2Entry === 'number') {
        const synthetic = 2 * p2Entry
        skipSynthetic1.set(challengeIdx, synthetic)
        const bonus = p2Entry * p2Entry
        score2 += bonus
        levelPoints2.set(
          challengeIdx,
          (levelPoints2.get(challengeIdx) ?? 1) + bonus,
        )
      }
    }
    // Re-skip of a pending challenge: synthetic was already applied at re-queue time; no change.

    advancePlayer1()
    rerender()
  }
  const skipPlayer2 = () => {
    if (gameOver) return
    const challengeIdx = currentChallengeIdx2()
    const isRetry = resolved2.get(challengeIdx) === 'skip'
    resolved2.set(challengeIdx, 'skip')

    if (!isRetry) {
      const p1Entry = resolved1.get(challengeIdx)
      if (typeof p1Entry === 'number') {
        const synthetic = 2 * p1Entry
        skipSynthetic2.set(challengeIdx, synthetic)
        const bonus = p1Entry * p1Entry
        score1 += bonus
        levelPoints1.set(
          challengeIdx,
          (levelPoints1.get(challengeIdx) ?? 1) + bonus,
        )
      }
    }

    advancePlayer2()
    rerender()
  }

  // Advance on any action except menu (menu should still navigate away).
  const onSolved1 = (action: Action) => {
    if (gameOver) return
    if (action === 'menu') {
      navigate('menu')
      return
    }
    solvePlayer1()
  }
  const onSolved2 = (action: Action) => {
    if (gameOver) return
    if (action === 'menu') {
      navigate('menu')
      return
    }
    solvePlayer2()
  }

  // Formula editors — appended to document.body so a rerender from the other
  // player solving doesn't remove them. The shroud is clamped to one half via
  // an inline left/right override on the fixed-position element.
  const onApplyReverse1: ApplyReverse1 = (_key, onFormula) => {
    if (closeEditor1 !== null) return
    closeEditor1 = makeVersusFormulaEditor(
      'left',
      (formula) => {
        closeEditor1 = null
        onFormula(formula)
      },
      () => {
        closeEditor1 = null
      },
    )
  }
  const onApplyReverse2: ApplyReverse1 = (_key, onFormula) => {
    if (closeEditor2 !== null) return
    closeEditor2 = makeVersusFormulaEditor(
      'right',
      (formula) => {
        closeEditor2 = null
        onFormula(formula)
      },
      () => {
        closeEditor2 = null
      },
    )
  }

  // Independent dispatch per player
  const dispatch1 = createDispatch(
    () => ws1,
    rerender,
    navigate,
    onSolved1,
    undefined,
    undefined,
    onApplyReverse1,
    ctx1,
  )
  const dispatch2 = createDispatch(
    () => ws2,
    rerender,
    navigate,
    onSolved2,
    undefined,
    undefined,
    onApplyReverse2,
    ctx2,
  )

  const makeCongratsP1 = () => {
    const hurray = document.createElement('div')
    const buttons = document.createElement('div')
    buttons.appendChild(
      createButton(
        t('continue'),
        false,
        () => dispatch1('axiom'),
        ctx1.getActionHint('axiom'),
      ),
    )
    return { hurray, buttons }
  }
  const makeCongratsP2 = () => {
    const hurray = document.createElement('div')
    const buttons = document.createElement('div')
    buttons.appendChild(
      createButton(
        t('continue'),
        false,
        () => dispatch2('axiom'),
        ctx2.getActionHint('axiom'),
      ),
    )
    return { hurray, buttons }
  }

  // Only patch the timer text each tick — a full rerender would destroy the DOM
  // mid-animation and prevent the solved zoom + proof-check sweep from completing.
  const ticker = setInterval(() => {
    if (gameOver) return
    timeLeft -= 1
    if (timeLeft <= 0) {
      timeLeft = 0
      gameOver = true
      clearInterval(ticker)
      closeEditor1?.()
      closeEditor2?.()
      rerender()
      return
    }
    if (timerEl !== null) {
      timerEl.textContent = formatTime(timeLeft)
    }
  }, 1000)

  const connectedGamepadIndices = (): number[] =>
    Array.from(navigator.getGamepads()).flatMap((gp, i) =>
      gp !== null ? [i] : [],
    )

  const gpIndex = (input: typeof versusConfig.p1Input): number => {
    const indices = connectedGamepadIndices()
    return input === 'gamepad2' ? (indices[1] ?? 1) : (indices[0] ?? 0)
  }

  // Block dispatch while the formula editor is open; 'menu'/'undo' still dismiss it.
  const handleKey = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || gameOver) return
    markKeyboardInput()
    const action = qwertyKeyMap[ev.code]
    if (action === undefined) return
    if (closeEditor1 !== null) {
      if (action === 'menu' || action === 'undo') closeEditor1()
      return
    }
    if (action === 'skip') {
      skipPlayer1()
      return
    }
    dispatch1(action)
  }

  const handleKey2 = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || gameOver) return
    markKeyboardInput()
    const action = qwertyKeyMap[ev.code]
    if (action === undefined) return
    if (closeEditor2 !== null) {
      if (action === 'menu' || action === 'undo') closeEditor2()
      return
    }
    if (action === 'skip') {
      skipPlayer2()
      return
    }
    dispatch2(action)
  }

  let cleanupP1: () => void
  if (versusConfig.p1Input === 'keyboard') {
    document.addEventListener('keydown', handleKey)
    cleanupP1 = () => document.removeEventListener('keydown', handleKey)
  } else if (versusConfig.p1Input === 'mouse') {
    cleanupP1 = () => {}
  } else {
    cleanupP1 = setupGamepad((action) => {
      if (gameOver) return
      if (closeEditor1 !== null) {
        if (action === 'menu' || action === 'undo') closeEditor1()
        return
      }
      if (action === 'skip') {
        skipPlayer1()
        return
      }
      dispatch1(action)
    }, gpIndex(versusConfig.p1Input))
  }

  let cleanupP2: () => void
  if (versusConfig.p2Input === 'keyboard') {
    document.addEventListener('keydown', handleKey2)
    cleanupP2 = () => document.removeEventListener('keydown', handleKey2)
  } else if (versusConfig.p2Input === 'mouse') {
    cleanupP2 = () => {}
  } else {
    cleanupP2 = setupGamepad((action) => {
      if (gameOver) return
      if (closeEditor2 !== null) {
        if (action === 'menu' || action === 'undo') closeEditor2()
        return
      }
      if (action === 'skip') {
        skipPlayer2()
        return
      }
      dispatch2(action)
    }, gpIndex(versusConfig.p2Input))
  }

  const unsubGamepad = subscribeGamepad(rerender)

  rerender()

  return {
    cleanup: () => {
      clearInterval(ticker)
      cleanupP1()
      cleanupP2()
      unsubGamepad()
      closeEditor1?.()
      closeEditor2?.()
    },
    rerender,
  }
}
