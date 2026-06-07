import { undo } from '../interactive/event'
import { activePath } from '../interactive/focus'
import { Workspace } from '../interactive/workspace'
import { Action } from '../interactive/action'
import type { Prop } from '../model/prop'
import { ChallengeResult } from './challenge-protocol'
import { ChallengePool } from './challenge-pool'
import { createNpcDriver } from '../npc/driver'
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
  undoHint?: string,
  activateHint?: string,
): {
  close: () => void
  tryUndo: () => boolean
  onAction: (action: Action) => void
} => {
  let modalEl: HTMLElement | null = null
  const close = () => {
    modalEl?.remove()
    modalEl = null
    onCancel()
  }
  const { el, tryUndo, onAction } = createFormulaEditor(
    t('lemmaTitle'),
    t('lemmaConfirm'),
    (formula) => {
      modalEl?.remove()
      modalEl = null
      onFormula(formula)
    },
    close,
    undoHint,
    activateHint,
  )
  modalEl = el
  if (side === 'left') {
    el.style.right = 'calc(50% + 2.5em)'
  } else {
    el.style.left = 'calc(50% + 2.5em)'
  }
  document.body.appendChild(el)
  return { close, tryUndo, onAction }
}

export const mountVersus = (
  container: HTMLElement,
  navigate: Navigate,
  pool: ChallengePool,
  versusConfig: VersusConfig,
): MountResult => {
  // container is document.body — clearing it on each rerender would remove the
  // formula-editor shroud (also appended to body). Use a dedicated child as
  // the rerender root so the editor survives opponent moves; the one-shot
  // container clear at mount drops any DOM left by the previous screen.
  container.innerHTML = ''
  const root = document.createElement('div')
  container.appendChild(root)

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
  let wsIdx1 = 0 // challenge index that ws1 is currently built for
  let index1 = 1 // next sequential challenge index (used when pending1 is empty)
  let score1 = 0
  const resolved1 = new Map<number, ResolvedEntry>() // challenge idx → outcome
  const levelPoints1 = new Map<number, number>()
  const skipSynthetic1 = new Map<number, number>()
  let pending1: number[] = [] // re-queued challenge indices, front = next
  let scoreCommitted1 = false

  let wsIdx2 = 0
  let index2 = 1
  let score2 = 0
  const resolved2 = new Map<number, ResolvedEntry>()
  const levelPoints2 = new Map<number, number>()
  const skipSynthetic2 = new Map<number, number>()
  let pending2: number[] = []
  let scoreCommitted2 = false

  const currentChallengeIdx1 = (): number => wsIdx1
  const currentChallengeIdx2 = (): number => wsIdx2

  const makeWorkspace = (i: number): AnyWorkspace => {
    ensureChallenge(i)
    const item = sharedChallenges[i]
    if (item === undefined)
      throw new Error('no challenge at index ' + String(i))
    return new Workspace({ challenge: item.challenge })
  }

  const advancePlayer1 = (): void => {
    scoreCommitted1 = false
    const [next1, ...rest1] = pending1
    if (next1 !== undefined) {
      wsIdx1 = next1
      pending1 = rest1
    } else {
      wsIdx1 = index1
      index1 += 1
    }
    ws1 = makeWorkspace(wsIdx1)
  }
  const advancePlayer2 = (): void => {
    scoreCommitted2 = false
    const [next2, ...rest2] = pending2
    if (next2 !== undefined) {
      wsIdx2 = next2
      pending2 = rest2
    } else {
      wsIdx2 = index2
      index2 += 1
    }
    ws2 = makeWorkspace(wsIdx2)
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
  let tryUndoEditor1: (() => boolean) | null = null
  let onActionEditor1: ((action: Action) => void) | null = null
  let closeEditor2: (() => void) | null = null
  let tryUndoEditor2: (() => boolean) | null = null
  let onActionEditor2: ((action: Action) => void) | null = null

  const isNpc1 = versusConfig.p1Input === 'npc'
  const isNpc2 = versusConfig.p2Input === 'npc'

  // Refs to the current arena regions, refreshed every full rerender. Surgical
  // updates swap just one of these so the opposite player's in-flight animation
  // is never disturbed by their opponent's moves.
  let half1El: HTMLElement | null = null
  let half2El: HTMLElement | null = null
  let thermoEl: HTMLElement | null = null

  const makeUndoControls = (
    ws: AnyWorkspace,
    ctx: BenchCtx,
    refresh: () => void,
  ): HTMLElement => {
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
          refresh()
        },
        ctx.getActionHint('undo'),
      ),
    )
    return el
  }

  const buildHalf1 = (): HTMLElement => {
    const half = document.createElement('div')
    half.setAttribute(
      'class',
      'versus-half' + (isNpc1 ? ' versus-half-npc' : ''),
    )
    half.appendChild(
      createBench(
        ws1,
        makeCongratsP1,
        isNpc1
          ? document.createElement('div')
          : makeUndoControls(ws1, ctx1, refreshP1),
        refreshP1,
        undefined,
        onApplyReverse1,
        undefined,
        ctx1,
        isNpc1 ? undefined : skipPlayer1,
      ),
    )
    return half
  }

  const buildHalf2 = (): HTMLElement => {
    const half = document.createElement('div')
    half.setAttribute(
      'class',
      'versus-half' + (isNpc2 ? ' versus-half-npc' : ''),
    )
    half.appendChild(
      createBench(
        ws2,
        makeCongratsP2,
        isNpc2
          ? document.createElement('div')
          : makeUndoControls(ws2, ctx2, refreshP2),
        refreshP2,
        undefined,
        onApplyReverse2,
        undefined,
        ctx2,
        isNpc2 ? undefined : skipPlayer2,
      ),
    )
    return half
  }

  const buildThermo = (): HTMLElement => {
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
    ): DisplayEntry | undefined => {
      if (i !== ci) return resolved.get(i)
      const entry = resolved.get(ci)
      return typeof entry === 'number' ? entry : 'current'
    }

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
      if (e === undefined || e === 'current' || e === 'skip') return ''
      const bonus = (pts ?? 1) - 1
      return bonus > 0 ? `+${String(bonus)}` : ''
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

    return thermo
  }

  // rerender is defined before solvePlayer* so they can reference it
  const rerender = () => {
    if (ws1.isSolved()) commitScore1()
    if (ws2.isSolved()) commitScore2()
    root.innerHTML = ''
    timerEl = null

    const screen = document.createElement('div')
    screen.setAttribute('class', 'versus-screen')

    // Side-by-side benches
    const arena = document.createElement('div')
    arena.setAttribute('class', 'versus-arena')

    half1El = buildHalf1()
    half2El = buildHalf2()
    thermoEl = buildThermo()

    arena.appendChild(half1El)
    arena.appendChild(thermoEl)
    arena.appendChild(half2El)

    screen.appendChild(arena)
    root.appendChild(screen)

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
      root.appendChild(overlay)
    }
  }

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
      // Player 1 re-solves a previously skipped challenge; compare move counts normally.
      // No bonus was awarded upfront — penalty only triggers if P1 had re-skipped.
      const p2Moves = resolved2.get(challengeIdx)
      if (typeof p2Moves === 'number') {
        skipSynthetic1.delete(challengeIdx)
        const diff = moves1 - p2Moves
        const bonus = Math.abs(diff)
        if (moves1 < p2Moves) {
          score1 += bonus
          levelPoints1.set(challengeIdx, 1 + bonus)
        } else if (p2Moves < moves1) {
          score2 += bonus
          levelPoints2.set(
            challengeIdx,
            (levelPoints2.get(challengeIdx) ?? 1) + bonus,
          )
        }
      }
    } else {
      const p2Entry = resolved2.get(challengeIdx)
      if (typeof p2Entry === 'number') {
        const diff = moves1 - p2Entry
        const bonus = Math.abs(diff)
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
        // Player 2 skipped; re-queue the challenge for them (oldest pending first).
        // Penalty is deferred — only applied if P2 skips again (making it permanent).
        pending2 = [...pending2, challengeIdx]
      }
    }
  }
  const solvePlayer1 = () => {
    commitScore1()
    advancePlayer1()
    rerenderHalf1()
    rebuildThermo()
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
      // Player 2 re-solves a previously skipped challenge; compare move counts normally.
      const p1Moves = resolved1.get(challengeIdx)
      if (typeof p1Moves === 'number') {
        skipSynthetic2.delete(challengeIdx)
        const diff = moves2 - p1Moves
        const bonus = Math.abs(diff)
        if (moves2 < p1Moves) {
          score2 += bonus
          levelPoints2.set(challengeIdx, 1 + bonus)
        } else if (p1Moves < moves2) {
          score1 += bonus
          levelPoints1.set(
            challengeIdx,
            (levelPoints1.get(challengeIdx) ?? 1) + bonus,
          )
        }
      }
    } else {
      const p1Entry = resolved1.get(challengeIdx)
      if (typeof p1Entry === 'number') {
        const diff = moves2 - p1Entry
        const bonus = Math.abs(diff)
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
        // Player 1 skipped; re-queue the challenge for them (oldest pending first).
        // Penalty is deferred — only applied if P1 skips again (making it permanent).
        pending1 = [...pending1, challengeIdx]
      }
    }
  }
  const solvePlayer2 = () => {
    commitScore2()
    advancePlayer2()
    rerenderHalf2()
    rebuildThermo()
  }

  const skipPlayer1 = () => {
    if (gameOver) return
    const challengeIdx = wsIdx1
    resolved1.set(challengeIdx, 'skip')

    const p2Entry = resolved2.get(challengeIdx)
    if (typeof p2Entry === 'number') {
      // Opponent already solved this level; skip is now permanent — apply penalty.
      // Covers both first-time skip (opponent solved first) and re-skip after re-queue.
      const synthetic = 2 * p2Entry
      skipSynthetic1.set(challengeIdx, synthetic)
      const bonus = p2Entry
      score2 += bonus
      levelPoints2.set(
        challengeIdx,
        (levelPoints2.get(challengeIdx) ?? 1) + bonus,
      )
    }
    // If opponent hasn't solved yet, penalty is deferred until they solve and P1 re-skips.

    advancePlayer1()
    rerenderHalf1()
    rebuildThermo()
  }
  const skipPlayer2 = () => {
    if (gameOver) return
    const challengeIdx = wsIdx2
    resolved2.set(challengeIdx, 'skip')

    const p1Entry = resolved1.get(challengeIdx)
    if (typeof p1Entry === 'number') {
      // Opponent already solved this level; skip is now permanent — apply penalty.
      const synthetic = 2 * p1Entry
      skipSynthetic2.set(challengeIdx, synthetic)
      const bonus = p1Entry
      score1 += bonus
      levelPoints1.set(
        challengeIdx,
        (levelPoints1.get(challengeIdx) ?? 1) + bonus,
      )
    }

    advancePlayer2()
    rerenderHalf2()
    rebuildThermo()
  }

  // Surgical updates: each player's actions only touch their own half (and
  // the shared thermometer). This guarantees an opponent's moves can never
  // restart a player's in-flight zoom + proof-check sweep — the only path
  // that rebuilds the entire arena is `rerender`, used for initial mount,
  // gameOver overlay, and gamepad-connection events.
  const rerenderHalf1 = () => {
    if (half1El === null) return
    const fresh = buildHalf1()
    half1El.replaceWith(fresh)
    half1El = fresh
  }
  const rerenderHalf2 = () => {
    if (half2El === null) return
    const fresh = buildHalf2()
    half2El.replaceWith(fresh)
    half2El = fresh
  }
  const rebuildThermo = () => {
    if (thermoEl === null) return
    const fresh = buildThermo()
    thermoEl.replaceWith(fresh)
    thermoEl = fresh
  }
  // refreshP{1,2}: the dispatch callback for that player's regular moves.
  // Commits score on the move that solves the level (so the scoreboard reflects
  // the win), refreshes that player's bench, and rebuilds the thermometer.
  // Never touches the opponent's half.
  const refreshP1 = () => {
    if (ws1.isSolved()) commitScore1()
    rerenderHalf1()
    rebuildThermo()
  }
  const refreshP2 = () => {
    if (ws2.isSolved()) commitScore2()
    rerenderHalf2()
    rebuildThermo()
  }

  // Post-solve: only the Continue action (axiom) advances; menu navigates away;
  // every other mapped key replays this player's animation on their own half.
  const onSolved1 = (action: Action) => {
    if (gameOver) return
    if (action === 'menu') {
      navigate('menu')
      return
    }
    if (action === 'axiom') {
      solvePlayer1()
      return
    }
    rerenderHalf1()
  }
  const onSolved2 = (action: Action) => {
    if (gameOver) return
    if (action === 'menu') {
      navigate('menu')
      return
    }
    if (action === 'axiom') {
      solvePlayer2()
      return
    }
    rerenderHalf2()
  }

  // Formula editors — appended to document.body so a rerender from the other
  // player solving doesn't remove them. The shroud is clamped to one half via
  // an inline left/right override on the fixed-position element.
  const onApplyReverse1: ApplyReverse1 = (_key, onFormula) => {
    if (closeEditor1 !== null) return
    const ed1 = makeVersusFormulaEditor(
      'left',
      (formula) => {
        closeEditor1 = null
        tryUndoEditor1 = null
        onActionEditor1 = null
        onFormula(formula)
      },
      () => {
        closeEditor1 = null
        tryUndoEditor1 = null
        onActionEditor1 = null
      },
      versusConfig.p1Input === 'keyboard'
        ? '⌫'
        : versusConfig.p1Input === 'mouse'
          ? undefined
          : '○',
      ctx1.getActionHint('axiom'),
    )
    closeEditor1 = ed1.close
    tryUndoEditor1 = ed1.tryUndo
    onActionEditor1 = ed1.onAction
  }
  const onApplyReverse2: ApplyReverse1 = (_key, onFormula) => {
    if (closeEditor2 !== null) return
    const ed2 = makeVersusFormulaEditor(
      'right',
      (formula) => {
        closeEditor2 = null
        tryUndoEditor2 = null
        onActionEditor2 = null
        onFormula(formula)
      },
      () => {
        closeEditor2 = null
        tryUndoEditor2 = null
        onActionEditor2 = null
      },
      versusConfig.p2Input === 'keyboard'
        ? '⌫'
        : versusConfig.p2Input === 'mouse'
          ? undefined
          : '○',
      ctx2.getActionHint('axiom'),
    )
    closeEditor2 = ed2.close
    tryUndoEditor2 = ed2.tryUndo
    onActionEditor2 = ed2.onAction
  }

  // Independent dispatch per player. Each player's regular-move rerender
  // callback is scoped to their own half + the thermometer, so an opponent's
  // moves can never disturb this player's in-flight animation.
  const dispatch1 = createDispatch(
    () => ws1,
    refreshP1,
    navigate,
    onSolved1,
    undefined,
    undefined,
    onApplyReverse1,
    ctx1,
  )
  const dispatch2 = createDispatch(
    () => ws2,
    refreshP2,
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

  const handleEditorInput1 = (action: Action): boolean => {
    if (closeEditor1 === null) return false
    if (action === 'undo') {
      if (!(tryUndoEditor1?.() ?? false)) closeEditor1()
    } else if (action === 'menu') {
      closeEditor1()
    } else {
      onActionEditor1?.(action)
    }
    return true
  }
  const handleEditorInput2 = (action: Action): boolean => {
    if (closeEditor2 === null) return false
    if (action === 'undo') {
      if (!(tryUndoEditor2?.() ?? false)) closeEditor2()
    } else if (action === 'menu') {
      closeEditor2()
    } else {
      onActionEditor2?.(action)
    }
    return true
  }

  const handleKey = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || gameOver) return
    markKeyboardInput()
    const action = qwertyKeyMap[ev.code]
    if (action === undefined) return
    if (handleEditorInput1(action)) return
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
    if (handleEditorInput2(action)) return
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
  } else if (versusConfig.p1Input === 'npc') {
    const driver = createNpcDriver({
      getWorkspace: () => ws1,
      getChallengeIdx: () => wsIdx1,
      getChallengeSolution: () => sharedChallenges[wsIdx1]?.challenge.solution,
      getTotalMoves: () => totalMoves(ws1),
      applyEvent: (ev) => {
        ws1.applyEvent(ev)
        if (ws1.isSolved()) {
          solvePlayer1()
        } else {
          refreshP1()
        }
      },
      skip: skipPlayer1,
      knobs: versusConfig.npc1Knobs,
      isGameOver: () => gameOver,
    })
    cleanupP1 = driver.cleanup
  } else {
    cleanupP1 = setupGamepad((action) => {
      if (gameOver) return
      if (handleEditorInput1(action)) return
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
  } else if (versusConfig.p2Input === 'npc') {
    const driver = createNpcDriver({
      getWorkspace: () => ws2,
      getChallengeIdx: () => wsIdx2,
      getChallengeSolution: () => sharedChallenges[wsIdx2]?.challenge.solution,
      getTotalMoves: () => totalMoves(ws2),
      applyEvent: (ev) => {
        ws2.applyEvent(ev)
        if (ws2.isSolved()) {
          solvePlayer2()
        } else {
          refreshP2()
        }
      },
      skip: skipPlayer2,
      knobs: versusConfig.npc2Knobs,
      isGameOver: () => gameOver,
    })
    cleanupP2 = driver.cleanup
  } else {
    cleanupP2 = setupGamepad((action) => {
      if (gameOver) return
      if (handleEditorInput2(action)) return
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
