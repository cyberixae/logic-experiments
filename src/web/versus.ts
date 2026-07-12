import { undo } from '../interactive/event'
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
import { createLangSwitcher } from './lang-switcher'
import { createButtonCursor, cursorNavActions } from './button-cursor'
import type { CursorCell } from './button-cursor'
import { createFormulaEditor } from './formula-editor'
import { basic, fromSequent } from '../render/print'
import { html } from '../render/segment'
import { MountResult, Navigate } from './types'
import { MessageKey, t } from './i18n'
import { getActionHint, getActionHintPure } from './input-mode'
import {
  inputLabel,
  isInputAvailable,
  PlayerInput,
  TutorInput,
  VersusConfig,
} from './versus-config'
import { beatAt, tutorialCurriculum, TutorialBeat } from '../random/tutorial'

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

  // Tutorial flavor: when present, the arena runs untimed and sources clamped
  // practice challenges from the current curriculum beat (generated on the
  // spot) instead of the pool. The clamp is purely generative — untaught rules
  // are never applicable because goals only contain taught connectives and
  // backward play only decomposes (Cut, the exception, is hidden until the
  // Input chapter). Non-tutorial Versus is unchanged.
  const isTutorial = versusConfig.tutorial !== undefined
  const untimed = isTutorial
  let beatIdx = versusConfig.tutorial?.startBeat ?? 0
  // Tutorial input model: the learner (P1) gets every connected human input
  // device; the tutor (P2) is the opt-in Wizard-of-Oz rig, claiming at most
  // one device. p1Input / p2Input are Versus-only. Mutable because the
  // tutor is switched LIVE from the pause menu: a tutor is typically
  // summoned mid-challenge, in response to a learner's question about the
  // exact position on the board — a remount would destroy the question.
  let tutorInput: TutorInput = versusConfig.tutorial?.tutorInput ?? 'off'
  const takeChallenge = (): ChallengeResult =>
    isTutorial ? beatAt(beatIdx).generate() : pool.take()

  // Shared challenge list — same challenges in same order for both players
  const sharedChallenges: ChallengeResult[] = []
  const ensureChallenge = (i: number) => {
    while (sharedChallenges.length <= i + 2)
      sharedChallenges.push(takeChallenge())
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
  // Auto-zoom capped at 1.0: in the half-viewport split it only ever shrinks long
  // sequents to fit; zooming in past 1.0 overshoots downward, so 1.0 is the ceiling.
  // showPar disabled: revealing par while the other player is still solving gives an unfair hint.
  const makeCtx = (input: PlayerInput | TutorInput): BenchCtx => {
    const base = createBenchCtx(input !== 'keyboard', true, false, false, 1)
    if (input !== 'mouse') return base
    return { ...base, getActionHint: () => undefined }
  }
  // The learner half accepts every input device, so its hints follow the
  // device last touched (the global input mode) instead of a fixed one.
  const learnerCtx = (): BenchCtx => ({
    ...createBenchCtx(false, true, false, false, 1),
    getActionHint,
  })
  // The tutor's hints track the live tutor device (switchable mid-session).
  const tutorCtx = (): BenchCtx => ({
    ...createBenchCtx(false, true, false, false, 1),
    getActionHint: (action) =>
      tutorInput === 'off' || tutorInput === 'mouse'
        ? undefined
        : getActionHintPure(action, tutorInput !== 'keyboard'),
  })
  const ctx1 = isTutorial ? learnerCtx() : makeCtx(versusConfig.p1Input)
  const ctx2 = isTutorial ? tutorCtx() : makeCtx(versusConfig.p2Input)

  // Timer
  let timeLeft = versusConfig.gameDurationSeconds
  let gameOver = false
  let paused = false
  let pauseMenu: {
    el: HTMLElement
    onAction: (action: Action) => void
  } | null = null
  let resultScreen: {
    el: HTMLElement
    onAction: (action: Action) => void
  } | null = null
  // Reference kept so the ticker can patch text without rebuilding the DOM.
  let timerEl: HTMLElement | null = null

  // Formula editor state — tracked separately per player so each half is independent.
  let closeEditor1: (() => void) | null = null
  let tryUndoEditor1: (() => boolean) | null = null
  let onActionEditor1: ((action: Action) => void) | null = null
  let closeEditor2: (() => void) | null = null
  let tryUndoEditor2: (() => boolean) | null = null
  let onActionEditor2: ((action: Action) => void) | null = null

  const isNpc1 = !isTutorial && versusConfig.p1Input === 'npc'
  const isNpc2 = !isTutorial && versusConfig.p2Input === 'npc'
  // A tutor with no device is a dead half: reuse the NPC half's treatment
  // (controls hidden, pointer events off) so stray clicks can't drive it.
  // A function, not a const: the tutor device switches live from the pause
  // menu and buildHalf2 re-reads it on every rebuild.
  const tutorOff = () => isTutorial && tutorInput === 'off'

  // The on-screen control bar / topbar buttons are the pointer/touch UI. A
  // keyboard or gamepad slot drives the game with physical keys/buttons, so hide
  // them there (NPC halves are already fully hidden via .versus-half-npc).
  // The learner half always shows them — the mouse is never taken away.
  const hideControls1 = isTutorial
    ? false
    : versusConfig.p1Input !== 'mouse' && !isNpc1
  const hideControls2 = () =>
    isTutorial
      ? tutorInput === 'keyboard' ||
        tutorInput === 'gamepad1' ||
        tutorInput === 'gamepad2'
      : versusConfig.p2Input !== 'mouse' && !isNpc2

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
    const canUndo = ws.canUndo()
    const enabled = canUndo || ctx.isGazeModeActive()
    const undoBtn = createButton(t('undo'), !enabled, () => {
      if (canUndo) {
        ws.applyEvent(undo())
      } else {
        ctx.setGazeModeActive(false)
      }
      refresh()
    })
    undoBtn.classList.add('mutating')
    el.appendChild(undoBtn)
    return el
  }

  const buildHalf1 = (): HTMLElement => {
    const half = document.createElement('div')
    half.setAttribute(
      'class',
      'versus-half' +
        (isNpc1 ? ' versus-half-npc' : '') +
        (hideControls1 ? ' versus-half-keys' : ''),
    )
    // Build the full bar (Undo, Skip, …) even for an NPC slot so both halves
    // come from one code path and reserve identical height. The NPC half is
    // non-interactive — `.versus-half-npc` hides the bar and kills pointer
    // events — so the buttons are present but unreachable.
    half.appendChild(
      createBench(
        ws1,
        makeCongratsP1,
        makeUndoControls(ws1, ctx1, refreshP1),
        refreshP1,
        undefined,
        onApplyReverse1,
        // The tutorial hides Lemma outright (Cut belongs to the Input chapter);
        // a permanently-disabled button would only draw the learner's eye.
        isTutorial,
        ctx1,
        isTutorial ? undefined : skipPlayer1,
        isTutorial && beatAt(beatIdx).hideGaze,
        isTutorial,
      ),
    )
    return half
  }

  const buildHalf2 = (): HTMLElement => {
    const half = document.createElement('div')
    half.setAttribute(
      'class',
      'versus-half' +
        (isNpc2 || tutorOff() ? ' versus-half-npc' : '') +
        (tutorOff() ? ' versus-half-off' : '') +
        (hideControls2() ? ' versus-half-keys' : ''),
    )
    half.appendChild(
      createBench(
        ws2,
        makeCongratsP2,
        makeUndoControls(ws2, ctx2, refreshP2),
        refreshP2,
        undefined,
        onApplyReverse2,
        isTutorial,
        ctx2,
        isTutorial ? undefined : skipPlayer2,
        isTutorial && beatAt(beatIdx).hideGaze,
        isTutorial,
      ),
    )
    return half
  }

  const buildThermo = (): HTMLElement => {
    if (isTutorial) return buildTutorialThermo()
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

    // Global pause-menu button, shared by both players and below the scoreboard
    // since it's not the main attraction. Keyboard/gamepad open the menu via the
    // always-on control listeners; this is the pointer affordance.
    const menuBtn = createButton('⋮', false, () => setPaused(true))
    menuBtn.classList.add('versus-menu-btn')
    menuBtn.setAttribute('aria-label', t('menu'))
    thermo.appendChild(menuBtn)

    return thermo
  }

  const setPaused = (v: boolean) => {
    paused = v
    rerender()
  }

  // Standard in-game pause menu, mirroring createPausePopup's structure but with
  // versus-appropriate actions (no per-player Reset; a Play Again that restarts
  // the match with the same settings). The keyboard / gamepad cursor moves
  // through the buttons; direct-access keys still work via handleControlAction,
  // so the on-screen key badges are gone.
  const buildPauseMenu = (): {
    el: HTMLElement
    onAction: (action: Action) => void
  } => {
    const shroud = document.createElement('div')
    shroud.setAttribute('class', 'shroud pause-shroud')
    shroud.onclick = (ev) => {
      if (ev.target === shroud) {
        ev.preventDefault()
        setPaused(false)
      }
    }
    const panel = document.createElement('div')
    panel.setAttribute('class', 'pause-popup')
    panel.onclick = (ev) => {
      ev.stopPropagation()
    }
    const title = document.createElement('div')
    title.setAttribute('class', 'pause-title')
    title.textContent = t('paused')
    panel.appendChild(title)
    const buttons = document.createElement('div')
    buttons.setAttribute('class', 'pause-buttons')

    const cells: CursorCell[] = []
    const addButton = (label: string, activate: () => void): void => {
      const el = createButton(label, false, activate)
      buttons.appendChild(el)
      cells.push({ btn: el, activate })
    }
    addButton(t('resumeGame'), () => setPaused(false))
    if (isTutorial) {
      // The tutorial owns its pause menu: instead of Versus's Play Again /
      // Match Setup (which would launch a real match), a single cycler for
      // the tutor's device — the Wizard-of-Oz rig, off by default. The
      // learner needs no picker: their half takes every remaining device.
      // Cycling switches the tutor live (no remount — see applyTutorialTutor).
      const tutorLabel =
        tutorInput === 'off' ? t('inputOff') : inputLabel(tutorInput)
      addButton(`${t('tutor')}: ${tutorLabel}`, () =>
        applyTutorialTutor(nextTutorInput(tutorInput)),
      )
    } else {
      addButton(t('playAgain'), () => navigate('versus'))
      addButton(t('matchSetup'), () => navigate('versus-config'))
    }
    addButton(t('exitToMainMenu'), () => navigate('menu'))

    panel.appendChild(buttons)
    shroud.appendChild(panel)
    shroud.appendChild(createLangSwitcher())

    const cursor = createButtonCursor(cells.map((c) => [c]))
    return { el: shroud, onAction: cursor.onAction }
  }

  // Tutor cycling: off → next connected device → … → off. Claiming a device
  // takes it from the learner (who keeps everything else); the mouse is
  // shareable since each half has its own buttons.
  const TUTOR_INPUTS: ReadonlyArray<TutorInput> = [
    'off',
    'mouse',
    'keyboard',
    'gamepad1',
    'gamepad2',
  ]
  const nextTutorInput = (current: TutorInput): TutorInput => {
    const start = TUTOR_INPUTS.indexOf(current)
    for (let step = 1; step <= TUTOR_INPUTS.length; step += 1) {
      const candidate = TUTOR_INPUTS[(start + step) % TUTOR_INPUTS.length]
      if (candidate === undefined) continue
      if (candidate !== 'off' && !isInputAvailable(candidate)) continue
      return candidate
    }
    return current
  }
  // Switch the tutor device LIVE — no remount, both boards untouched. A
  // tutor is typically summoned mid-challenge to answer a question about
  // the exact position on the board; a remount would destroy the question.
  // The input listeners are all attached at mount and route by reading
  // tutorInput, so flipping the variable re-routes them; the rerender
  // refreshes the tutor half's visibility and the pause-menu label (menu
  // stays open — cycling should feel like a settings panel). The URL param
  // is kept in sync so the session setup stays a shareable link.
  const applyTutorialTutor = (tutor: TutorInput) => {
    tutorInput = tutor
    const params = new URLSearchParams(window.location.search)
    params.set('tutorial_beat', String(beatIdx))
    params.set('tutorial_tutor', tutor)
    history.replaceState(history.state, '', `?${params.toString()}`)
    pauseMenu = null
    rerender()
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

    // End-of-match breakdown screen when time expires.
    if (gameOver) {
      // Build once so the cursor survives any rerender; the match is over, so
      // the breakdown's contents are settled.
      if (!resultScreen) resultScreen = buildResultScreen()
      root.appendChild(resultScreen.el)
    } else if (paused) {
      // Build once per pause so the cursor survives the per-second timer
      // rerenders; rebuild on the next pause.
      if (!pauseMenu) pauseMenu = buildPauseMenu()
      root.appendChild(pauseMenu.el)
    } else {
      pauseMenu = null
    }
  }

  // ── End-of-match breakdown ────────────────────────────────────────────────
  // A dedicated screen mirroring the arena: P1 | Level | P2, one row per level.
  // Pure read over the existing per-player maps — no new state. Markup uses
  // per-level wrapper rows + CSS subgrid so the table can later collapse into
  // cards via a stylesheet-only media query (each cell carries a latent label).

  // The settled display state of one level for one player, mirroring the
  // thermometer's displayEntry: a move count, a skip, the in-progress level, or
  // unreached (undefined).
  const breakdownEntry = (
    resolved: Map<number, ResolvedEntry>,
    ci: number,
    i: number,
  ): DisplayEntry | undefined => {
    if (i !== ci) return resolved.get(i)
    const entry = resolved.get(ci)
    return typeof entry === 'number' ? entry : 'current'
  }

  type SideCells = {
    moves: string
    done: string
    bonus: string
    points: string
  }

  const sideCells = (
    entry: DisplayEntry | undefined,
    currentMoves: number,
    levelPoints: number | undefined,
    synthetic: number | undefined,
  ): SideCells => {
    if (entry === undefined)
      return { moves: '', done: '', bonus: '', points: '' }
    if (entry === 'current')
      return { moves: String(currentMoves), done: '…', bonus: '', points: '' }
    if (entry === 'skip')
      return {
        moves: synthetic !== undefined ? String(synthetic) : '',
        done: '⊘',
        bonus: '—',
        points: '0',
      }
    const pts = levelPoints ?? 1
    const bonus = pts - 1
    return {
      moves: String(entry),
      done: '✓',
      bonus: bonus > 0 ? `+${String(bonus)}` : '—',
      points: String(pts),
    }
  }

  // One cell: value text plus a latent label (shown only in collapsed card mode).
  const cell = (cls: string, label: string, value: string): HTMLElement => {
    const el = document.createElement('div')
    el.setAttribute('class', `vb-cell ${cls}`)
    const lab = document.createElement('div')
    lab.setAttribute('class', 'vb-cell-label')
    lab.textContent = label
    const val = document.createElement('div')
    val.setAttribute('class', 'vb-cell-value')
    val.textContent = value
    el.appendChild(lab)
    el.appendChild(val)
    return el
  }

  const par = (i: number): string => {
    const solution = sharedChallenges[i]?.challenge.solution
    if (solution === undefined) return '💀'
    const counts = countRuleUsage(solution)
    return String(Object.values(counts).reduce((a, b) => a + b, 0))
  }

  const buildResultScreen = (): {
    el: HTMLElement
    onAction: (action: Action) => void
  } => {
    const ci1 = currentChallengeIdx1()
    const ci2 = currentChallengeIdx2()
    const maxIdx = Math.max(
      ci1,
      ci2,
      ...Array.from(resolved1.keys()),
      ...Array.from(resolved2.keys()),
    )
    const moves1 = totalMoves(ws1)
    const moves2 = totalMoves(ws2)

    const overlay = document.createElement('div')
    overlay.setAttribute('class', 'versus-result')

    const title = document.createElement('div')
    title.setAttribute('class', 'versus-breakdown-title')
    title.textContent =
      score1 > score2
        ? t('winsTemplate').replace('{player}', t('player1'))
        : score2 > score1
          ? t('winsTemplate').replace('{player}', t('player2'))
          : t('tie')
    overlay.appendChild(title)

    const grid = document.createElement('div')
    grid.setAttribute('class', 'versus-breakdown-grid')

    // Header row: player names + per-player totals, empty centre spacer.
    const header = document.createElement('div')
    header.setAttribute('class', 'vb-level vb-header')
    // Each total sits in its player's Points grid column (centred like the Points
    // cells) so it reads as that column's sum.
    const p1Name = document.createElement('div')
    p1Name.setAttribute('class', 'vb-title-name p1')
    p1Name.textContent = t('player1')
    const p1Score = document.createElement('div')
    p1Score.setAttribute('class', 'vb-title-score-cell p1')
    p1Score.innerHTML = `<span class="vb-title-score">${String(score1)}</span>`
    // Empty center spacer (Par + Goal columns) — no upper 'Level' title.
    const spacer = document.createElement('div')
    spacer.setAttribute('class', 'vb-title-spacer')
    const p2Score = document.createElement('div')
    p2Score.setAttribute('class', 'vb-title-score-cell p2')
    p2Score.innerHTML = `<span class="vb-title-score">${String(score2)}</span>`
    const p2Name = document.createElement('div')
    p2Name.setAttribute('class', 'vb-title-name p2')
    p2Name.textContent = t('player2')
    header.appendChild(p1Name)
    header.appendChild(p1Score)
    header.appendChild(spacer)
    header.appendChild(p2Score)
    header.appendChild(p2Name)
    grid.appendChild(header)

    // Column subheader row (hidden in collapsed card mode; labels take over).
    const sub = document.createElement('div')
    sub.setAttribute('class', 'vb-level vb-subhead')
    const subCols = [
      t('moves'),
      t('done'),
      t('bonus'),
      t('points'),
      t('par'),
      t('goal'),
      t('points'),
      t('bonus'),
      t('done'),
      t('moves'),
    ]
    subCols.forEach((label, idx) => {
      const c = document.createElement('div')
      c.setAttribute(
        'class',
        'vb-cell vb-subcell' + (idx === 4 || idx === 6 ? ' vb-sec-start' : ''),
      )
      c.textContent = label
      sub.appendChild(c)
    })
    grid.appendChild(sub)

    for (let i = 0; i <= maxIdx; i += 1) {
      const e1 = breakdownEntry(resolved1, ci1, i)
      const e2 = breakdownEntry(resolved2, ci2, i)
      const s1 = sideCells(
        e1,
        moves1,
        levelPoints1.get(i),
        skipSynthetic1.get(i),
      )
      const s2 = sideCells(
        e2,
        moves2,
        levelPoints2.get(i),
        skipSynthetic2.get(i),
      )

      const row = document.createElement('div')
      row.setAttribute('class', 'vb-level')

      row.appendChild(cell('p1 num', t('moves'), s1.moves))
      row.appendChild(cell('p1 num', t('done'), s1.done))
      row.appendChild(cell('p1 num', t('bonus'), s1.bonus))
      row.appendChild(cell('p1 num pts', t('points'), s1.points))

      const parCell = cell('vb-sec-start num', t('par'), par(i))
      row.appendChild(parCell)
      const goalCell = document.createElement('div')
      goalCell.setAttribute('class', 'vb-cell vb-goal')
      const goalLab = document.createElement('div')
      goalLab.setAttribute('class', 'vb-cell-label')
      goalLab.textContent = t('goal')
      const goalVal = document.createElement('div')
      goalVal.setAttribute('class', 'vb-cell-value')
      const seq = sharedChallenges[i]?.challenge.goal
      if (seq !== undefined) goalVal.innerHTML = html(fromSequent(seq)(basic))
      goalCell.appendChild(goalLab)
      goalCell.appendChild(goalVal)
      row.appendChild(goalCell)

      row.appendChild(cell('p2 num pts vb-sec-start', t('points'), s2.points))
      row.appendChild(cell('p2 num', t('bonus'), s2.bonus))
      row.appendChild(cell('p2 num', t('done'), s2.done))
      row.appendChild(cell('p2 num', t('moves'), s2.moves))

      grid.appendChild(row)
    }

    overlay.appendChild(grid)

    const actions = document.createElement('div')
    actions.setAttribute('class', 'versus-breakdown-actions')

    const cells: CursorCell[] = []
    const addButton = (label: string, activate: () => void): void => {
      const el = createButton(label, false, activate)
      actions.appendChild(el)
      cells.push({ btn: el, activate })
    }
    addButton(t('matchSetup'), () => navigate('versus-config'))
    addButton(t('playAgain'), () => navigate('versus'))
    overlay.appendChild(actions)

    // The buttons sit side by side, so they form one row the cursor moves
    // through left / right.
    const cursor = createButtonCursor([cells])
    return { el: overlay, onAction: cursor.onAction }
  }

  const commitScore1 = () => {
    if (isTutorial) return // no scoring / re-queue in the tutorial
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
    if (isTutorial) return // no scoring / re-queue in the tutorial
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
    // No Skip in the tutorial: every goal is solvable and the give-up verb is
    // taught in the Input chapter; between-subchapter motion is the Next
    // Section button. (Also guards the keyboard/gamepad skip bindings.)
    if (isTutorial) return
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
    if (isTutorial) return
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
  // Jump the tutorial to a curriculum beat (forward or back): switch the
  // clamp and re-root BOTH players onto a fresh challenge generated under the
  // new beat, dropping anything buffered under the old one.
  const jumpToBeat = (target: number) => {
    const clamped = Math.max(0, Math.min(target, tutorialCurriculum.length - 1))
    if (clamped === beatIdx) return
    beatIdx = clamped
    // Leave gaze mode on both halves — the target beat may not offer it.
    ctx1.setGazeModeActive(false)
    ctx2.setGazeModeActive(false)
    const fresh = Math.max(index1, index2, wsIdx1 + 1, wsIdx2 + 1)
    sharedChallenges.splice(fresh)
    pending1 = []
    pending2 = []
    scoreCommitted1 = false
    scoreCommitted2 = false
    wsIdx1 = fresh
    index1 = fresh + 1
    wsIdx2 = fresh
    index2 = fresh + 1
    ws1 = makeWorkspace(fresh)
    ws2 = makeWorkspace(fresh)
    rerenderHalf1()
    rerenderHalf2()
    rebuildThermo()
  }
  // Beat rows name the behavior, never the schema; Basics rows reuse the
  // exact words on the buttons they teach (Close, Drop).
  const beatNameKey: Record<TutorialBeat['nameId'], MessageKey> = {
    close: 'axiom',
    drop: 'drop',
    split: 'tutorialShape1',
    sideFlip: 'tutorialShape2',
    crossing: 'tutorialShape3',
    branching: 'tutorialShape4',
    branchingCrossing: 'tutorialShape5',
  }
  const chapterKey: Record<TutorialBeat['chapter'], MessageKey> = {
    basics: 'tutorialBasics',
    logic: 'tutorialLogic',
  }
  // Tutorial scoreboard replacement: the curriculum ladder (every beat a
  // clickable row, current highlighted, chapter headers between groups), the
  // forward control, and the shared pause button. No clock or scores.
  const buildTutorialThermo = (): HTMLElement => {
    const thermo = document.createElement('div')
    thermo.setAttribute('class', 'versus-thermo versus-thermo-tutorial')

    const ladder = document.createElement('div')
    ladder.setAttribute('class', 'tutorial-ladder')
    let lastChapter: TutorialBeat['chapter'] | null = null
    let chapterNo = 0
    let beatNo = 0
    tutorialCurriculum.forEach((beat, i) => {
      if (beat.chapter !== lastChapter) {
        lastChapter = beat.chapter
        chapterNo += 1
        beatNo = 0
        const header = document.createElement('div')
        header.setAttribute('class', 'tutorial-ladder-chapter')
        header.textContent = `${chapterNo} · ${t(chapterKey[beat.chapter])}`
        ladder.appendChild(header)
      }
      beatNo += 1
      const row = document.createElement('div')
      row.setAttribute(
        'class',
        'tutorial-ladder-row' + (i === beatIdx ? ' current' : ''),
      )
      const number = document.createElement('span')
      number.setAttribute('class', 'tutorial-ladder-number')
      number.textContent = `${chapterNo}.${beatNo}`
      row.appendChild(number)
      row.appendChild(document.createTextNode(t(beatNameKey[beat.nameId])))
      if (beat.glyphs !== '') {
        const glyphs = document.createElement('span')
        glyphs.setAttribute('class', 'tutorial-ladder-glyphs')
        glyphs.textContent = beat.glyphs
        row.appendChild(glyphs)
      }
      row.onclick = () => jumpToBeat(i)
      ladder.appendChild(row)
    })
    thermo.appendChild(ladder)

    const menuBtn = createButton('⋮', false, () => setPaused(true))
    menuBtn.classList.add('versus-menu-btn')
    menuBtn.setAttribute('aria-label', t('menu'))
    thermo.appendChild(menuBtn)
    return thermo
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

  // The latest solved-screen button cursor per half, captured when the
  // congrats is built so the post-solve dispatch can drive it.
  type SolvedCursor = {
    onAction: (action: Action) => void
    isEngaged: () => boolean
  }
  let congrats1: SolvedCursor | null = null
  let congrats2: SolvedCursor | null = null

  // Post-solve: only the Continue action (axiom) advances; menu navigates away;
  // every other mapped key replays this player's animation on their own half.
  // (Cursor navigation over the solved-screen buttons is intercepted before
  // the base dispatch — see makeCursorDispatch.)
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
    )
    closeEditor2 = ed2.close
    tryUndoEditor2 = ed2.tryUndo
    onActionEditor2 = ed2.onAction
  }

  // Independent dispatch per player. Each player's regular-move rerender
  // callback is scoped to their own half + the thermometer, so an opponent's
  // moves can never disturb this player's in-flight animation.
  // In tutorial beats that hide the Gaze controls, the keyboard/gamepad gaze
  // actions must be inert too — checked per dispatch since the beat changes
  // at runtime.
  const gazeBlocked = () => isTutorial && beatAt(beatIdx).hideGaze
  // On the solved screen, arrow / D-pad actions drive the congrats button
  // cursor and axiom activates the focused button once engaged — mirroring
  // the other completion screens. This must run BEFORE createDispatch, whose
  // gaze handling (and the tutorial's gaze block) would swallow the arrows.
  const makeCursorDispatch =
    (
      base: (action: Action) => void,
      getWs: () => AnyWorkspace,
      getCursor: () => SolvedCursor | null,
    ) =>
    (action: Action): void => {
      const cursor = getCursor()
      if (getWs().isSolved() && cursor !== null) {
        if (cursorNavActions.has(action)) {
          cursor.onAction(action)
          return
        }
        if (action === 'axiom' && cursor.isEngaged()) {
          cursor.onAction('axiom')
          return
        }
      }
      base(action)
    }
  const dispatch1 = makeCursorDispatch(
    createDispatch(
      () => ws1,
      refreshP1,
      navigate,
      onSolved1,
      undefined,
      undefined,
      onApplyReverse1,
      ctx1,
      undefined,
      gazeBlocked,
    ),
    () => ws1,
    () => congrats1,
  )
  const dispatch2 = makeCursorDispatch(
    createDispatch(
      () => ws2,
      refreshP2,
      navigate,
      onSolved2,
      undefined,
      undefined,
      onApplyReverse2,
      ctx2,
      undefined,
      gazeBlocked,
    ),
    () => ws2,
    () => congrats2,
  )

  // In the tutorial the solved screen is also a navigation moment: Continue
  // stays in the current section (fresh challenge), flanked by section jumps
  // so the natural "I've got this" step forward happens right where the win
  // lands, without reaching for the ladder. The buttons form one cursor row
  // (registered via setCursor) so keyboard / gamepad players can pick them
  // like on the other completion screens.
  const makeCongrats =
    (onContinue: () => void, setCursor: (cursor: SolvedCursor) => void) =>
    () => {
      const hurray = document.createElement('div')
      const buttons = document.createElement('div')
      const cells: CursorCell[] = []
      const add = (
        label: string,
        disabled: boolean,
        activate: () => void,
      ): void => {
        const el = createButton(label, disabled, activate)
        buttons.appendChild(el)
        cells.push({ btn: el, activate, isEnabled: () => !disabled })
      }
      if (isTutorial) {
        add(t('tutorialPrevious'), beatIdx <= 0, () => jumpToBeat(beatIdx - 1))
      }
      add(isTutorial ? t('tutorialOneMore') : t('continue'), false, onContinue)
      if (isTutorial) {
        add(
          t('tutorialAdvance'),
          beatIdx >= tutorialCurriculum.length - 1,
          () => jumpToBeat(beatIdx + 1),
        )
      }
      // Continue is the screen's default (an unengaged axiom presses it), so
      // the cursor starts there and the first arrow moves immediately —
      // one press right lands on Next Section, not on a swallowed reveal.
      const continueCol = isTutorial ? 1 : 0
      const cursor = createButtonCursor([cells], {
        startCol: continueCol,
        moveOnReveal: true,
      })
      setCursor({ onAction: cursor.onAction, isEngaged: cursor.isEngaged })
      return { hurray, buttons }
    }
  const makeCongratsP1 = makeCongrats(
    () => solvePlayer1(),
    (c) => {
      congrats1 = c
    },
  )
  const makeCongratsP2 = makeCongrats(
    () => solvePlayer2(),
    (c) => {
      congrats2 = c
    },
  )

  // Only patch the timer text each tick — a full rerender would destroy the DOM
  // mid-animation and prevent the solved zoom + proof-check sweep from completing.
  const ticker = setInterval(() => {
    if (untimed || gameOver || paused) return
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

  // On the end-of-match breakdown screen, the Lemma bind opens settings and the
  // Skip bind starts a rematch. Reusing these binds (not confirm/undo) avoids
  // accidental exits and keeps confirm/undo free for future cursor navigation.
  const handleResultAction = (action: Action) => {
    if (action === 'lemma') navigate('versus-config')
    else if (action === 'skip') navigate('versus')
    else resultScreen?.onAction(action)
  }

  // Match-control actions are handled globally (see the always-on listeners
  // below), independent of which input device each slot uses, so the menu is
  // reachable in any configuration including all-NPC matches. The menu/pause
  // toggle lives here rather than in the per-player handlers, which only drive
  // gameplay and ignore input once paused or the match is over.
  const handleControlAction = (action: Action) => {
    if (gameOver) {
      handleResultAction(action)
      return
    }
    if (paused) {
      if (action === 'menu' || action === 'undo') setPaused(false)
      else if (action === 'skip') navigate('versus')
      else if (action === 'exit') navigate('menu')
      else pauseMenu?.onAction(action)
      return
    }
    if (action !== 'menu') return
    // First menu press cancels an open formula editor; otherwise it pauses.
    if (closeEditor1 !== null || closeEditor2 !== null) {
      closeEditor1?.()
      closeEditor2?.()
    } else {
      setPaused(true)
    }
  }

  const handleKey = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || gameOver || paused) return
    const action = qwertyKeyMap[ev.code]
    if (action === undefined || action === 'menu') return
    markKeyboardInput()
    if (handleEditorInput1(action)) return
    if (action === 'skip') {
      skipPlayer1()
      return
    }
    dispatch1(action)
  }

  const handleKey2 = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || gameOver || paused) return
    const action = qwertyKeyMap[ev.code]
    if (action === undefined || action === 'menu') return
    markKeyboardInput()
    if (handleEditorInput2(action)) return
    if (action === 'skip') {
      skipPlayer2()
      return
    }
    dispatch2(action)
  }

  let cleanupP1: () => void
  let cleanupP2: () => void
  if (isTutorial) {
    // Every human input device is attached once and ROUTED per event by the
    // live tutorInput: the tutor's claimed device drives the tutor half,
    // everything else drives the learner ('off' and 'mouse' claim no
    // listener — a second mouse needs none, each half has its own buttons).
    // Event-time routing is what lets the pause menu switch the tutor
    // without a remount. All four pad slots are wired so a pad plugged in
    // mid-session drives the learner immediately.
    const padHandler1 = (action: Action) => {
      if (gameOver || paused || action === 'menu') return
      if (handleEditorInput1(action)) return
      if (action === 'skip') {
        skipPlayer1()
        return
      }
      dispatch1(action)
    }
    const padHandler2 = (action: Action) => {
      if (gameOver || paused || action === 'menu') return
      if (handleEditorInput2(action)) return
      if (action === 'skip') {
        skipPlayer2()
        return
      }
      dispatch2(action)
    }
    const tutorPadIdx = (): number | null =>
      tutorInput === 'gamepad1' || tutorInput === 'gamepad2'
        ? gpIndex(tutorInput)
        : null
    const routeKey = (ev: KeyboardEvent) => {
      if (tutorInput === 'keyboard') handleKey2(ev)
      else handleKey(ev)
    }
    document.addEventListener('keydown', routeKey)
    const cleanups = [
      () => document.removeEventListener('keydown', routeKey),
      ...[0, 1, 2, 3].map((idx) =>
        setupGamepad((action) => {
          if (idx === tutorPadIdx()) padHandler2(action)
          else padHandler1(action)
        }, idx),
      ),
    ]
    cleanupP1 = () => cleanups.forEach((c) => c())
    cleanupP2 = () => {}
  } else {
    if (versusConfig.p1Input === 'keyboard') {
      document.addEventListener('keydown', handleKey)
      cleanupP1 = () => document.removeEventListener('keydown', handleKey)
    } else if (versusConfig.p1Input === 'mouse') {
      cleanupP1 = () => {}
    } else if (versusConfig.p1Input === 'npc') {
      const driver = createNpcDriver({
        getWorkspace: () => ws1,
        getChallengeIdx: () => wsIdx1,
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
        isPaused: () => paused,
      })
      cleanupP1 = driver.cleanup
    } else {
      cleanupP1 = setupGamepad((action) => {
        if (gameOver || paused || action === 'menu') return
        if (handleEditorInput1(action)) return
        if (action === 'skip') {
          skipPlayer1()
          return
        }
        dispatch1(action)
      }, gpIndex(versusConfig.p1Input))
    }

    if (versusConfig.p2Input === 'keyboard') {
      document.addEventListener('keydown', handleKey2)
      cleanupP2 = () => document.removeEventListener('keydown', handleKey2)
    } else if (versusConfig.p2Input === 'mouse') {
      cleanupP2 = () => {}
    } else if (versusConfig.p2Input === 'npc') {
      const driver = createNpcDriver({
        getWorkspace: () => ws2,
        getChallengeIdx: () => wsIdx2,
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
        isPaused: () => paused,
      })
      cleanupP2 = driver.cleanup
    } else {
      cleanupP2 = setupGamepad((action) => {
        if (gameOver || paused || action === 'menu') return
        if (handleEditorInput2(action)) return
        if (action === 'skip') {
          skipPlayer2()
          return
        }
        dispatch2(action)
      }, gpIndex(versusConfig.p2Input))
    }
  }

  // Match control (open/close the pause menu, plus end-of-match navigation) is
  // handled by always-on listeners that don't depend on how the slots are
  // configured, so the menu is reachable from any input device — keyboard, any
  // connected gamepad, or the on-screen button — even in all-NPC matches. The
  // per-player handlers above only drive gameplay, so there is no double dispatch.
  const handleControlKey = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return
    const action = qwertyKeyMap[ev.code]
    if (action !== undefined) handleControlAction(action)
  }
  document.addEventListener('keydown', handleControlKey)
  const controlPadIndices = [...new Set([0, ...connectedGamepadIndices()])]
  const cleanupControlPads = controlPadIndices.map((idx) =>
    setupGamepad((action) => handleControlAction(action), idx),
  )

  const unsubGamepad = subscribeGamepad(rerender)

  rerender()

  return {
    cleanup: () => {
      clearInterval(ticker)
      cleanupP1()
      cleanupP2()
      document.removeEventListener('keydown', handleControlKey)
      cleanupControlPads.forEach((c) => c())
      unsubGamepad()
      closeEditor1?.()
      closeEditor2?.()
    },
    rerender,
  }
}
