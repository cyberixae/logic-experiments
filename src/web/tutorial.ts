import { Event, nextBranch, prevBranch, undo } from '../interactive/event'
import { Workspace } from '../interactive/workspace'
import { Action } from '../interactive/action'
import {
  AnyWorkspace,
  ApplyReverse1,
  BenchCtx,
  createBench,
  createBenchCtx,
  createButton,
  createDispatch,
  createPausePopup,
  createPlayArea,
  markKeyboardInput,
  markPointerInput,
  qwertyKeyMap,
  setupGamepad,
  subscribeGamepad,
} from './game'
import { createButtonCursor, cursorNavActions } from './button-cursor'
import type { CursorCell } from './button-cursor'
import {
  createLemmaEditorBar,
  createLemmaEditorSession,
  editorKeyPieces,
} from './lemma-editor'
import type { LemmaEditorSession } from './lemma-editor'
import { basic } from '../render/print'
import { conjectureGhost } from '../render/draft'
import { html } from '../render/segment'
import { AnySequent, isTautology, sequent } from '../model/sequent'
import { MountResult, Navigate } from './types'
import { MessageKey, t } from './i18n'
import { getActionHint, gazeKeyHint, gazePadHint } from './input-mode'
import {
  beatAt,
  generateDemoChallenge,
  stopAt,
  tutorialCurriculum,
  tutorialStops,
  TutorialBeat,
  TutorialChapter,
} from '../random/tutorial'
import { linearize, linearizeStart } from '../npc/proof-walker'
import { Configuration } from '../model/challenge'
import { AnyDerivation } from '../model/derivation'
import { rules as rkRules } from '../systems/rk'

// The tutorial: a single-board, untimed mode sourcing clamped practice
// challenges from the current curriculum beat (generated on the spot). The
// clamp is purely generative — untaught rules are never applicable because
// goals only contain taught connectives and backward play only decomposes
// (Cut, the exception, is hidden until its teaching beat). Navigation walks
// the stop list (chapter intro pages + beats; the tutorial_stop URL param
// addresses a stop). The learner drives with any input device: on-screen
// buttons, keyboard, or any connected gamepad.

// Beat rows name the concept, never the schema: Basics rows name what you
// find on the branch (identity, constants, extras), Consequences rows the
// consequence of the drop. Each name's word appears in its own owl beat
// text and nowhere else.
const beatNameKey: Record<TutorialBeat['nameId'], MessageKey> = {
  identity: 'tutorialIdentity',
  constants: 'tutorialConstants',
  drop: 'tutorialExtras',
  split: 'tutorialShape1',
  sideFlip: 'tutorialShape2',
  crossing: 'tutorialShape3',
  branching: 'tutorialShape4',
  branchingCrossing: 'tutorialShape5',
  claims: 'tutorialClaims',
  unsolvable: 'tutorialSkipping',
  conjecture: 'tutorialConjecture',
}
const chapterKey: Record<TutorialBeat['chapter'], MessageKey> = {
  basics: 'tutorialBasics',
  logic: 'tutorialLogic',
  optimization: 'tutorialOptimization',
  solvability: 'tutorialSolvability',
}

// The owl: the tutor character's portrait in the board's lower-right corner,
// with a speech bubble of the current stop's message — the chapter's framing
// on an intro page, the beat's lesson on a beat.
//
// The messages are i18n templates with {pick}/{drop}/… placeholders for
// keybinds. Each placeholder renders as a chip holding all three device
// variants as latent spans — mouse gets the localized button words,
// keyboard / gamepad get labels derived from the live keymaps (gazeKeyHint /
// gazePadHint), so rebindable keys flow through with no copy changes. CSS
// shows the variant matching the html input-* class, so the chips follow the
// device last touched instantly, without a re-render (pointer↔keyboard flips
// never re-render by design — see setActiveInput).
const owlChapterKey: Record<TutorialChapter, MessageKey> = {
  basics: 'tutorialOwlBasics',
  logic: 'tutorialOwlLogic',
  optimization: 'tutorialOwlOptimization',
  solvability: 'tutorialOwlSolvability',
  done: 'tutorialOwlDone',
}
// Keyed by curriculum index — the two Close beats share a nameId, so the
// name alone cannot address a beat.
const owlBeatKey: ReadonlyArray<MessageKey> = [
  'tutorialOwlClose',
  'tutorialOwlCloseConstants',
  'tutorialOwlDrop',
  'tutorialOwlSplit',
  'tutorialOwlSideFlip',
  'tutorialOwlCrossing',
  'tutorialOwlBranching',
  'tutorialOwlBranchingCrossing',
  'tutorialOwlClaims',
  'tutorialOwlUnsolvable',
  'tutorialOwlConjecture',
]
// The welcome demo: before anything is asked of the player, the owl solves
// one fixed exemplar on the welcome page — the whole game in one look: a
// sequent, moves growing it into a tree, a branch closing, the tree
// finishing. The board is watch-only, and the owl's narration advances by
// phase rather than by move, so the player reads four short lines instead
// of a move list. The demo loops until the player moves on.
type DemoPhase = 'sequent' | 'grow' | 'closed' | 'other' | 'done'
const demoPhaseKey: Record<DemoPhase, MessageKey> = {
  sequent: 'tutorialDemoSequent',
  grow: 'tutorialDemoGrow',
  closed: 'tutorialDemoClosed',
  other: 'tutorialDemoOther',
  done: 'tutorialDemoDone',
}
const DEMO_MOVE_MS = 1300
// Dwell after a narration change, so the new line gets read before the
// next move draws the eye back to the board.
const DEMO_PHASE_MS = 3600
// Dwell on the finished tree: the solve celebration sweep plays here.
const DEMO_DONE_MS = 8000
const isClosingEvent = (ev: Event): boolean =>
  ev.kind === 'reverse0' && (ev.rev === 'i' || ev.rev === 'f' || ev.rev === 'v')

// The presolve animation: on the presolved Basics beats the owl visibly
// lays the foundation — the board starts at the bare goal, the foundation's
// moves replay at a brisk pace, and at the handover the board swaps to the
// real presolved challenge (frozen nodes, undo floor). "Let me help you get
// started" — the owl is a participant, not a narrator, so the help is
// played, not told.
const PRESOLVE_DWELL_MS = 1800
const PRESOLVE_MOVE_MS = 550

type OwlDevice = 'pointer' | 'keyboard' | 'gamepad'
const owlDevices: ReadonlyArray<OwlDevice> = ['pointer', 'keyboard', 'gamepad']
const owlBindLabels = (device: OwlDevice): Map<string, string> => {
  if (device === 'pointer') {
    return new Map([
      ['pick', `${t('left')} / ${t('right')}`],
      ['drop', t('drop')],
      ['close', t('axiom')],
      ['undo', t('undo')],
      ['destruct', t('destruct')],
      ['branch', `${t('prevBranch')} / ${t('nextBranch')}`],
      ['skip', t('skip')],
      // The formula editor's palette has no single button word; a glyph
      // sample stands in for the row of piece buttons.
      ['pieces', '🐧 ¬ ∧ …'],
      ['confirm', t('lemmaConfirm')],
      ['lemma', t('lemma')],
    ])
  }
  const hint = device === 'keyboard' ? gazeKeyHint : gazePadHint
  const label = (action: Action): string => hint(action) ?? '?'
  return new Map([
    ['pick', `${label('gazeLeft')} ${label('gazeRight')}`],
    ['drop', label('gazeWeakening')],
    ['close', label('axiom')],
    ['undo', label('undo')],
    ['destruct', label('gazeConnective')],
    ['branch', `${label('prevBranch')} / ${label('nextBranch')}`],
    ['skip', label('skip')],
    // In the editor the gaze keys drive the bar cursor: aim with the
    // arrows / D-pad, take the aimed piece with the confirm press.
    ['pieces', `${label('gazeLeft')} ${label('gazeRight')} ${label('axiom')}`],
    ['confirm', label('axiom')],
    ['lemma', label('lemma')],
  ])
}
// Split the template on {token} boundaries; tokens become bind chips (one
// latent variant per device), everything else stays plain text.
const appendOwlTemplate = (into: HTMLElement, template: string): void => {
  const binds: ReadonlyArray<[OwlDevice, Map<string, string>]> = owlDevices.map(
    (device) => [device, owlBindLabels(device)],
  )
  for (const part of template.split(/(\{\w+\})/)) {
    if (part === '') continue
    const token =
      part.startsWith('{') && part.endsWith('}') ? part.slice(1, -1) : null
    if (token === null || !(binds[0]?.[1].has(token) ?? false)) {
      into.appendChild(document.createTextNode(part))
      continue
    }
    for (const [device, labels] of binds) {
      const label = labels.get(token)
      if (label === undefined) continue
      const chip = document.createElement('span')
      chip.setAttribute('class', `owl-bind for-${device}`)
      chip.textContent = label
      into.appendChild(chip)
    }
  }
}

export const mountTutorial = (
  container: HTMLElement,
  navigate: Navigate,
  startStop: number,
): MountResult => {
  // Navigation cursor: an index into tutorialStops (chapter intro pages +
  // beats). beatIdx tracks the beat the board is rooted at — on an intro
  // page it stays at the upcoming chapter's first beat, so stepping forward
  // onto that beat needs no re-root.
  let stopIdx = Math.max(0, Math.min(startStop, tutorialStops.length - 1))
  const beatForStop = (s: number): number => {
    for (let i = s; i < tutorialStops.length; i += 1) {
      const stop = tutorialStops[i]
      if (stop !== undefined && stop.kind === 'beat') return stop.beatIdx
    }
    return tutorialCurriculum.length - 1
  }
  let beatIdx = beatForStop(stopIdx)
  const onIntro = (): boolean => stopAt(stopIdx).kind === 'intro'
  const onConjecture = (): boolean => beatAt(beatIdx).conjecture

  const freshWorkspace = (): AnyWorkspace =>
    new Workspace({ challenge: beatAt(beatIdx).generate().challenge })
  let ws = freshWorkspace()

  // Per-mount bench context on the global input-mode hints. Auto-zoom is the
  // standard full-viewport behavior; the moves/par HUD stays hidden (the
  // tutorial doesn't score), and the rules toggle is deadened — the sheet is
  // a quick reference for rules already learned, not something to reach for
  // mid-lesson. Deadening at the state keeps any binding inert too.
  const ctx: BenchCtx = {
    ...createBenchCtx(false, true, false, false),
    getActionHint,
    toggleRulesVisible: () => {},
  }

  // Welcome-demo state: the owl's board, the remaining moves of its solve,
  // and the narration phase. Lives only while the welcome page is showing.
  const onWelcome = (): boolean => stopIdx === 0
  let demoWs: AnyWorkspace | null = null
  let demoQueue: ReadonlyArray<Event> = []
  let demoPhase: DemoPhase = 'sequent'
  let demoTimer: number | null = null
  // Set while the closed-branch pause is showing: the next tick returns
  // focus to the open branch instead of consuming a move.
  let demoReturn = false
  // The demo board's own zoom/scroll state, independent of the beat board's.
  const demoCtx: BenchCtx = {
    ...createBenchCtx(false, true, false, false),
    getActionHint,
    toggleRulesVisible: () => {},
  }

  const scheduleDemo = (ms: number): void => {
    if (demoTimer !== null) window.clearTimeout(demoTimer)
    demoTimer = window.setTimeout(() => demoStep(), ms)
  }
  const startDemo = (): void => {
    const challenge = generateDemoChallenge().challenge
    const solution = challenge.solution
    demoWs = new Workspace({ challenge })
    demoQueue =
      solution === undefined ? [] : linearize(solution, { shuffle: false })
    demoPhase = 'sequent'
    demoReturn = false
  }
  const stopDemo = (): void => {
    if (demoTimer !== null) window.clearTimeout(demoTimer)
    demoTimer = null
    demoWs = null
  }
  const demoStep = (): void => {
    demoTimer = null
    if (!onWelcome() || demoWs === null) return
    // Hold still while the pause menu covers the page.
    if (paused) {
      scheduleDemo(DEMO_MOVE_MS)
      return
    }
    // Second half of the closed-branch beat: after dwelling on the closed
    // branch, step over to the open one and announce it before playing on.
    if (demoReturn) {
      demoReturn = false
      demoWs.applyEvent(nextBranch())
      demoPhase = 'other'
      rerender()
      scheduleDemo(DEMO_PHASE_MS)
      return
    }
    const ev = demoQueue[0]
    if (demoWs.isSolved() || ev === undefined) {
      startDemo()
      rerender()
      scheduleDemo(DEMO_PHASE_MS)
      return
    }
    demoQueue = demoQueue.slice(1)
    demoWs.applyEvent(ev)
    let dwell = DEMO_MOVE_MS
    if (demoPhase === 'sequent') {
      demoPhase = 'grow'
      dwell = DEMO_PHASE_MS
    }
    if (isClosingEvent(ev)) {
      if (demoWs.isSolved()) {
        demoPhase = 'done'
        dwell = DEMO_DONE_MS
      } else {
        // Closing auto-advances focus to the next open branch, but the
        // narration is about the branch that just closed — step back so
        // the highlight and the words point at the same place. Exact for
        // the two-branch exemplar, where the closed branch is one step
        // back from the auto-advanced focus.
        demoWs.applyEvent(prevBranch())
        demoReturn = true
        demoPhase = 'closed'
        dwell = DEMO_PHASE_MS
      }
    }
    rerender()
    scheduleDemo(dwell)
  }

  // Presolve-animation state: the pending real challenge (with `start`),
  // the remaining foundation moves, and whether the owl currently holds the
  // board. Each foundation animates once (tracked by identity); revisiting
  // a board mid-challenge never replays it.
  let presolving = false
  let presolvePending: Configuration<AnySequent> | undefined
  let presolveQueue: ReadonlyArray<Event> = []
  let presolveTimer: number | null = null
  const presolveDone = new WeakSet<AnyDerivation>()

  const schedulePresolve = (ms: number): void => {
    if (presolveTimer !== null) window.clearTimeout(presolveTimer)
    presolveTimer = window.setTimeout(() => presolveStep(), ms)
  }
  // Skip to the end state: whatever remains unplayed lands at once as the
  // real presolved board. Called when leaving the beat mid-animation.
  const cancelPresolve = (): void => {
    if (presolveTimer !== null) window.clearTimeout(presolveTimer)
    presolveTimer = null
    if (presolving && presolvePending !== undefined) {
      ws = new Workspace({ challenge: presolvePending })
    }
    presolving = false
    presolvePending = undefined
    presolveQueue = []
  }
  const startPresolveIfAny = (): void => {
    if (onIntro()) return
    const conf = ws.listConjectures()[0]?.[1]
    const start = conf?.start
    if (conf === undefined || start === undefined) return
    if (presolveDone.has(start)) return
    presolveDone.add(start)
    presolvePending = conf
    presolveQueue = linearizeStart(start)
    ws = new Workspace({ challenge: { rules: conf.rules, goal: conf.goal } })
    presolving = true
    schedulePresolve(PRESOLVE_DWELL_MS)
  }
  const presolveStep = (): void => {
    presolveTimer = null
    if (!presolving) return
    if (paused) {
      schedulePresolve(PRESOLVE_MOVE_MS)
      return
    }
    const ev = presolveQueue[0]
    if (ev === undefined) {
      // Handover: the foundation is laid — swap in the real challenge so
      // the frozen rendering and the undo floor take effect.
      const pending = presolvePending
      presolving = false
      presolvePending = undefined
      if (pending !== undefined) ws = new Workspace({ challenge: pending })
      rerender()
      return
    }
    presolveQueue = presolveQueue.slice(1)
    ws.applyEvent(ev)
    rerender()
    schedulePresolve(PRESOLVE_MOVE_MS)
  }

  let paused = false
  let pausePopup: {
    el: HTMLElement
    onAction: (action: Action) => void
  } | null = null
  // The chapter index: an on-demand overlay opened from the breadcrumb (the
  // ambient "where am I" indicator in the top-right corner).
  let ladderOpen = false
  let ladderPopup: HTMLElement | null = null

  // Inline lemma editing, one session for the single board. The session owns
  // the draft and cursor, so it survives any rerender.
  let lemmaSession: LemmaEditorSession | null = null
  // Whether the live lemma session is the conjecture ENTRY (composing a
  // goal) rather than a mid-proof Claim on the confirmed board — the two
  // share the session slot but render and cancel differently.
  let conjectureEntry = false

  // Skip state: whether the board currently shows the skip completion
  // screen — the unsolvable-beat counterpart of the solved screen. Skip must
  // resolve into a screen that carries the topic navigation, or a keyboard/
  // gamepad learner in an all-unsolvable beat could never leave it.
  // skipHadSolution picks the screen's confirmation line: goals are small
  // enough that a truth-table check at skip time settles honestly whether a
  // proof existed (in the Skip beat it never does; a conjecture may go
  // either way).
  let skipped = false
  let skipHadSolution = false

  // The latest completion-screen button cursors, captured when each screen is
  // built so the dispatch can drive them. The default is what an unengaged
  // axiom press activates.
  type SolvedCursor = {
    onAction: (action: Action) => void
    isEngaged: () => boolean
  }
  let congrats: SolvedCursor | null = null
  let introCursor: SolvedCursor | null = null
  let introDefault: (() => void) | null = null
  let skipCursor: SolvedCursor | null = null
  let skipDefault: (() => void) | null = null

  const setPaused = (v: boolean) => {
    paused = v
    rerender()
  }
  const closeLadder = () => {
    ladderOpen = false
    rerender()
  }

  // Keep the shareable link pointing at the current stop.
  const syncUrl = () => {
    const params = new URLSearchParams(window.location.search)
    params.set('tutorial_stop', String(stopIdx))
    history.replaceState(history.state, '', `?${params.toString()}`)
  }

  // Conjecture entry: in a conjecture beat the player composes their own
  // goal. The entry reuses the lemma editor session slot, so all the
  // existing input routing (bar clicks, editor pro keys, cursor actions)
  // drives it unchanged; on confirm the workspace is replaced with the
  // authored `⊢ φ` challenge. Cancel (undo past the beginning) starts the
  // draft over.
  const openConjecture = (): void => {
    conjectureEntry = true
    lemmaSession = createLemmaEditorSession(
      (formula) => {
        conjectureEntry = false
        lemmaSession = null
        // Full rule set: Claim is taught by the Optimization chapter, so
        // authored goals keep it available.
        ws = new Workspace({
          challenge: { rules: rkRules, goal: sequent([], [formula]) },
        })
        rerender()
      },
      () => {
        openConjecture()
        rerender()
      },
      // No board behind the entry to back out to — hide the Back cell.
      true,
    )
  }

  // The next challenge in the current beat: fresh entry in a conjecture
  // beat, a fresh generated board everywhere else. Both the solved screen's
  // One More and the skip screen's continue land here.
  const nextChallenge = (): void => {
    cancelPresolve()
    skipped = false
    if (onConjecture()) openConjecture()
    else {
      ws = freshWorkspace()
      startPresolveIfAny()
    }
    rerender()
  }

  // Re-root the board onto a curriculum beat: switch the clamp and draw a
  // fresh challenge generated under the new beat.
  const rerootAtBeat = (target: number) => {
    const clamped = Math.max(0, Math.min(target, tutorialCurriculum.length - 1))
    if (clamped === beatIdx) return
    beatIdx = clamped
    // Leave gaze mode — the target beat may not offer it.
    ctx.setGazeModeActive(false)
    skipped = false
    // Conjecture beats open with the entry flow instead of a generated
    // board; leaving one drops any half-built draft or open lemma editor.
    lemmaSession = null
    conjectureEntry = false
    ws = freshWorkspace()
    if (beatAt(beatIdx).conjecture) openConjecture()
  }
  // Jump to a stop (chapter intro page or beat), forward or back. Landing on
  // a beat re-roots the board under its clamp; landing on an intro page
  // pre-roots at the chapter's first beat so stepping forward from the
  // intro needs no re-root.
  const jumpToStop = (target: number) => {
    const clamped = Math.max(0, Math.min(target, tutorialStops.length - 1))
    if (clamped === stopIdx) return
    cancelPresolve()
    stopIdx = clamped
    if (!onWelcome()) stopDemo()
    const stop = stopAt(stopIdx)
    rerootAtBeat(stop.kind === 'beat' ? stop.beatIdx : beatForStop(stopIdx))
    syncUrl()
    if (stop.kind === 'beat') startPresolveIfAny()
    rerender()
  }
  // Stop index addressing: beat i / a chapter's intro page.
  const stopIndexOfBeat = (beat: number): number =>
    tutorialStops.findIndex((s) => s.kind === 'beat' && s.beatIdx === beat)
  const stopIndexOfIntro = (chapter: TutorialChapter): number =>
    tutorialStops.findIndex((s) => s.kind === 'intro' && s.chapter === chapter)

  const skipChallenge = () => {
    if (onIntro() || beatAt(beatIdx).hideSkip || ws.isSolved()) return
    if (lemmaSession !== null) return
    if (skipped) {
      nextChallenge()
      return
    }
    ctx.setGazeModeActive(false)
    skipHadSolution = isTautology(ws.currentConjecture().derivation.result)
    skipped = true
    rerender()
  }

  const makeUndoControls = (): HTMLElement => {
    const el = document.createElement('div')
    el.setAttribute('class', 'controls')
    const canUndo = ws.canUndo()
    const enabled = !presolving && (canUndo || ctx.isGazeModeActive())
    const undoBtn = createButton(t('undo'), !enabled, () => {
      if (canUndo) {
        ws.applyEvent(undo())
      } else {
        ctx.setGazeModeActive(false)
      }
      rerender()
    })
    undoBtn.classList.add('mutating')
    el.appendChild(undoBtn)
    return el
  }

  // Chapter intro page: just the topic navigation — no board, no controls;
  // the owl does the speaking. The buttons form a cursor row so keyboard /
  // gamepad can drive them like the solved screen's. The edge pages have a
  // single purpose and a single button: the welcome page starts the
  // tutorial, the completion page exits to the main menu; middle intros
  // navigate both ways.
  const buildIntroPage = (): HTMLElement => {
    const page = document.createElement('div')
    page.setAttribute('class', 'tutorial-intro')
    // The welcome page carries the owl's demo above the Start button. The
    // demo (re)starts whenever the page is entered without one running.
    if (onWelcome()) {
      page.classList.add('tutorial-welcome')
      if (demoWs === null) {
        startDemo()
        scheduleDemo(DEMO_PHASE_MS)
      }
      if (demoWs !== null) {
        const demo = document.createElement('div')
        demo.setAttribute('class', 'tutorial-demo')
        demo.appendChild(createPlayArea(demoWs, demoCtx))
        page.appendChild(demo)
      }
    }
    const cells: CursorCell[] = []
    const add = (label: string, activate: () => void) => {
      const el = createButton(label, false, activate)
      page.appendChild(el)
      cells.push({ btn: el, activate })
    }
    const stop = stopAt(stopIdx)
    if (stopIdx <= 0) {
      add(t('tutorialStart'), () => jumpToStop(stopIdx + 1))
    } else if (stop.kind === 'intro' && stop.chapter === 'done') {
      add(t('exitToMainMenu'), () => navigate('menu'))
    } else {
      add(t('tutorialPrevious'), () => jumpToStop(stopIdx - 1))
      add(t('tutorialAdvance'), () => jumpToStop(stopIdx + 1))
    }
    // The last button is the page's default (an unengaged axiom presses
    // it), so the cursor starts there and the first arrow moves
    // immediately.
    const cursor = createButtonCursor([cells], {
      startCol: cells.length - 1,
      moveOnReveal: true,
    })
    introCursor = { onAction: cursor.onAction, isEngaged: cursor.isEngaged }
    introDefault = cells[cells.length - 1]?.activate ?? null
    return page
  }

  // Skip completion screen: what Skip resolves into. It mirrors the solved
  // screen's navigation row (Previous / One More / Next, One More as the
  // default) with a confirmation line in place of the hurray — in the Skip
  // beat every goal is verifiably unsolvable, so the reveal is honest.
  const buildSkippedPage = (): HTMLElement => {
    const page = document.createElement('div')
    page.setAttribute('class', 'tutorial-intro tutorial-skipped')
    const note = document.createElement('div')
    note.setAttribute('class', 'tutorial-skipped-note')
    note.textContent = t(
      skipHadSolution ? 'tutorialSkippedSolvable' : 'tutorialSkipped',
    )
    page.appendChild(note)
    const cells: CursorCell[] = []
    const add = (label: string, disabled: boolean, activate: () => void) => {
      const el = createButton(label, disabled, activate)
      page.appendChild(el)
      cells.push({ btn: el, activate, isEnabled: () => !disabled })
    }
    add(t('tutorialPrevious'), stopIdx <= 0, () => jumpToStop(stopIdx - 1))
    add(t('tutorialOneMore'), false, nextChallenge)
    add(t('tutorialAdvance'), stopIdx >= tutorialStops.length - 1, () =>
      jumpToStop(stopIdx + 1),
    )
    const cursor = createButtonCursor([cells], {
      startCol: 1,
      moveOnReveal: true,
    })
    skipCursor = { onAction: cursor.onAction, isEngaged: cursor.isEngaged }
    skipDefault = () => cells[1]?.activate()
    return page
  }

  // Conjecture entry page: the live `⊢ φ` preview above the formula editor
  // bar. The board (and its Skip/Undo controls) only exists once the player
  // confirms; menu/pause stay reachable through the global bindings.
  const buildConjecturePage = (session: LemmaEditorSession): HTMLElement => {
    const page = document.createElement('div')
    page.setAttribute('class', 'conjecture-entry')
    const previewArea = document.createElement('div')
    previewArea.setAttribute('class', 'conjecture-preview-area')
    const preview = document.createElement('div')
    preview.setAttribute('class', 'tree-sequent ghost conjecture-preview')
    preview.innerHTML = html(conjectureGhost(session.draft())(basic))
    previewArea.appendChild(preview)
    page.appendChild(previewArea)
    page.appendChild(createLemmaEditorBar(session, rerender))
    return page
  }

  const buildOwl = (): HTMLElement => {
    const owl = document.createElement('div')
    owl.setAttribute('class', 'tutor-owl')
    const bubble = document.createElement('div')
    bubble.setAttribute('class', 'tutor-owl-bubble')
    // The welcome page narrates the demo phase by phase; other chapter
    // intro pages carry the chapter's framing; beats carry only their own
    // lesson (the intro page exists so the framing text doesn't haunt
    // every beat).
    const stop = stopAt(stopIdx)
    const beatKey = stop.kind === 'beat' ? owlBeatKey[stop.beatIdx] : undefined
    const paragraphs = onWelcome()
      ? [t(demoPhaseKey[demoPhase])]
      : presolving
        ? [t('tutorialOwlPresolve')]
        : stop.kind === 'intro'
          ? [t(owlChapterKey[stop.chapter])]
          : beatKey === undefined
            ? []
            : [t(beatKey)]
    for (const text of paragraphs) {
      const para = document.createElement('div')
      para.setAttribute('class', 'tutor-owl-para')
      appendOwlTemplate(para, text)
      bubble.appendChild(para)
    }
    const face = document.createElement('div')
    face.setAttribute('class', 'tutor-owl-face')
    face.textContent = '🦉'
    owl.appendChild(bubble)
    owl.appendChild(face)
    return owl
  }

  // The current stop's number + name, e.g. "2.3 · Jakautuminen". Chapter
  // and beat ordinals fall out of walking the stop list.
  const stopLabel = (idx: number): string => {
    let chapterNo = 0
    let beatNo = 0
    for (let i = 0; i <= idx; i += 1) {
      const stop = tutorialStops[i]
      if (stop === undefined) continue
      if (stop.kind === 'intro') {
        chapterNo += 1
        beatNo = 0
      } else {
        beatNo += 1
      }
    }
    const stop = stopAt(idx)
    if (stop.kind === 'intro') {
      const name =
        stop.chapter === 'done'
          ? t('tutorialComplete')
          : t(chapterKey[stop.chapter])
      return `${String(chapterNo)} · ${name}`
    }
    const beat = beatAt(stop.beatIdx)
    return `${String(chapterNo)}.${String(beatNo)} · ${t(beatNameKey[beat.nameId])}`
  }

  // Breadcrumb: the ambient position indicator. Clicking opens the chapter
  // index overlay; keyboard/gamepad topic navigation lives on the
  // completion screens.
  const buildCrumb = (): HTMLElement => {
    const crumb = createButton(stopLabel(stopIdx), false, () => {
      ladderOpen = true
      rerender()
    })
    crumb.classList.add('tutorial-crumb')
    return crumb
  }

  // Curriculum ladder: the tutorial's roadmap and navigation in one — every
  // beat a clickable row, the current one highlighted, chapter headers (the
  // intro pages' rows) between groups.
  const buildLadder = (): HTMLElement => {
    const ladder = document.createElement('div')
    ladder.setAttribute('class', 'tutorial-ladder')
    let lastChapter: TutorialBeat['chapter'] | null = null
    let chapterNo = 0
    let beatNo = 0
    const jump = (target: number) => {
      ladderOpen = false
      ladderPopup = null
      jumpToStop(target)
      rerender()
    }
    tutorialCurriculum.forEach((beat, i) => {
      if (beat.chapter !== lastChapter) {
        lastChapter = beat.chapter
        chapterNo += 1
        beatNo = 0
        const chapter = beat.chapter
        const introIdx = stopIndexOfIntro(chapter)
        const header = document.createElement('div')
        header.setAttribute(
          'class',
          'tutorial-ladder-chapter' + (introIdx === stopIdx ? ' current' : ''),
        )
        header.textContent = `${String(chapterNo)} · ${t(chapterKey[chapter])}`
        header.onclick = () => jump(introIdx)
        ladder.appendChild(header)
      }
      beatNo += 1
      const currentStop = stopAt(stopIdx)
      const isCurrent = currentStop.kind === 'beat' && currentStop.beatIdx === i
      const row = document.createElement('div')
      row.setAttribute(
        'class',
        'tutorial-ladder-row' + (isCurrent ? ' current' : ''),
      )
      const number = document.createElement('span')
      number.setAttribute('class', 'tutorial-ladder-number')
      number.textContent = `${String(chapterNo)}.${String(beatNo)}`
      row.appendChild(number)
      row.appendChild(document.createTextNode(t(beatNameKey[beat.nameId])))
      if (beat.glyphs !== '') {
        const glyphs = document.createElement('span')
        glyphs.setAttribute('class', 'tutorial-ladder-glyphs')
        glyphs.textContent = beat.glyphs
        row.appendChild(glyphs)
      }
      row.onclick = () => jump(stopIndexOfBeat(i))
      ladder.appendChild(row)
    })
    // The beat-less completion chapter: a header row only.
    const doneIdx = stopIndexOfIntro('done')
    const doneHeader = document.createElement('div')
    doneHeader.setAttribute(
      'class',
      'tutorial-ladder-chapter' + (doneIdx === stopIdx ? ' current' : ''),
    )
    doneHeader.textContent = `${String(chapterNo + 1)} · ${t('tutorialComplete')}`
    doneHeader.onclick = () => jump(doneIdx)
    ladder.appendChild(doneHeader)
    return ladder
  }

  const buildLadderPopup = (): HTMLElement => {
    const shroud = document.createElement('div')
    shroud.setAttribute('class', 'shroud pause-shroud')
    shroud.onclick = (ev) => {
      if (ev.target === shroud) {
        ev.preventDefault()
        closeLadder()
      }
    }
    const panel = document.createElement('div')
    panel.setAttribute('class', 'pause-popup tutorial-ladder-popup')
    panel.onclick = (ev) => {
      ev.stopPropagation()
    }
    panel.appendChild(buildLadder())
    shroud.appendChild(panel)
    return shroud
  }

  // The solved screen is also a navigation moment: One More stays in the
  // current topic (fresh challenge), flanked by topic jumps so the natural
  // "I've got this" step forward happens right where the win lands.
  const makeCongrats = () => {
    const hurray = document.createElement('div')
    hurray.setAttribute('class', 'hurray')
    hurray.innerHTML = t('congratulations')
    const buttons = document.createElement('div')
    const cells: CursorCell[] = []
    const add = (label: string, disabled: boolean, activate: () => void) => {
      const el = createButton(label, disabled, activate)
      buttons.appendChild(el)
      cells.push({ btn: el, activate, isEnabled: () => !disabled })
    }
    add(t('tutorialPrevious'), stopIdx <= 0, () => jumpToStop(stopIdx - 1))
    add(t('tutorialOneMore'), false, nextChallenge)
    add(t('tutorialAdvance'), stopIdx >= tutorialStops.length - 1, () =>
      jumpToStop(stopIdx + 1),
    )
    // One More is the screen's default (an unengaged axiom presses it), so
    // the cursor starts there and the first arrow moves immediately — one
    // press right lands on Next Topic, not on a swallowed reveal.
    const cursor = createButtonCursor([cells], {
      startCol: 1,
      moveOnReveal: true,
    })
    congrats = { onAction: cursor.onAction, isEngaged: cursor.isEngaged }
    return { hurray, buttons }
  }

  const rerender = () => {
    container.innerHTML = ''
    const screen = document.createElement('div')
    screen.setAttribute('class', 'tutorial-screen')
    if (presolving) screen.classList.add('tutorial-presolving')
    if (onIntro()) {
      screen.appendChild(buildIntroPage())
    } else if (skipped) {
      screen.appendChild(buildSkippedPage())
    } else if (conjectureEntry && lemmaSession !== null) {
      screen.appendChild(buildConjecturePage(lemmaSession))
    } else {
      screen.appendChild(
        createBench(
          ws,
          makeCongrats,
          makeUndoControls(),
          rerender,
          () => setPaused(true),
          onApplyReverse1,
          // Claim and Skip are per-beat: each stays hidden (not
          // shown-disabled, which would only draw the learner's eye) until
          // its teaching beat.
          beatAt(beatIdx).hideLemma,
          ctx,
          beatAt(beatIdx).hideSkip ? undefined : skipChallenge,
          beatAt(beatIdx).hideGaze,
          true,
          lemmaSession,
        ),
      )
      // While the owl lays the foundation, the player's controls wear the
      // real disabled styling — the dispatch guard and the pointer block
      // already deaden them; this makes the held state visible.
      if (presolving) {
        screen.querySelectorAll('.controls .button').forEach((el) => {
          el.classList.add('disabled')
        })
      }
    }
    screen.appendChild(buildCrumb())
    screen.appendChild(buildOwl())
    container.appendChild(screen)
    if (paused) {
      // Build once per pause so the cursor survives rerenders; rebuild on
      // the next pause.
      if (!pausePopup) {
        pausePopup = createPausePopup(
          () => setPaused(false),
          () => navigate('menu'),
        )
      }
      container.appendChild(pausePopup.el)
    } else {
      pausePopup = null
    }
    if (ladderOpen) {
      if (ladderPopup === null) ladderPopup = buildLadderPopup()
      container.appendChild(ladderPopup)
    } else {
      ladderPopup = null
    }
  }

  // Post-solve: only the Continue action (axiom) advances; every other
  // mapped key replays the completion animation. (Cursor navigation over
  // the solved-screen buttons is intercepted before the base dispatch —
  // see dispatch below.)
  const onSolved = (action: Action) => {
    if (action === 'axiom') {
      nextChallenge()
      return
    }
    rerender()
  }

  const onApplyReverse1: ApplyReverse1 = (_key, onFormula) => {
    if (lemmaSession !== null) return
    ctx.setGazeModeActive(false)
    lemmaSession = createLemmaEditorSession(
      (formula) => {
        lemmaSession = null
        onFormula(formula)
      },
      () => {
        lemmaSession = null
        rerender()
      },
    )
    rerender()
  }

  // In beats that hide the Gaze controls, the keyboard/gamepad gaze actions
  // must be inert too — checked per dispatch since the beat changes at
  // runtime.
  const gazeBlocked = () => beatAt(beatIdx).hideGaze

  const baseDispatch = createDispatch(
    () => ws,
    rerender,
    navigate,
    onSolved,
    undefined,
    () => setPaused(true),
    onApplyReverse1,
    ctx,
    undefined,
    gazeBlocked,
  )

  // One dispatch for every input device, layered: overlays (chapter index,
  // pause) swallow everything, then the live editor session, then the
  // boardless screens (intro / skip completion) whose cursors take the
  // arrows, then the solved screen's cursor, then regular play.
  const dispatch = (action: Action): void => {
    if (ladderOpen) {
      if (action === 'menu' || action === 'undo' || action === 'exit') {
        closeLadder()
      }
      return
    }
    if (paused) {
      if (action === 'menu' || action === 'undo') setPaused(false)
      else if (action === 'exit') navigate('menu')
      else pausePopup?.onAction(action)
      return
    }
    if (lemmaSession !== null) {
      const session = lemmaSession
      if (action === 'menu' || action === 'exit') {
        // The conjecture entry is a persistent state, not a modal — cancel
        // would only restart the draft, trapping menu; pause instead. A
        // mid-proof Claim editor cancels.
        if (conjectureEntry) setPaused(true)
        else session.cancel()
        return
      }
      if (action === 'undo') {
        // Undo-past-the-beginning backs out of the editor entirely.
        if (session.undo()) rerender()
        else session.cancel()
        return
      }
      if (session.handleAction(action)) rerender()
      return
    }
    if (action === 'menu') {
      setPaused(true)
      return
    }
    // While the owl lays the foundation the board is briefly the owl's —
    // gameplay actions wait for the handover (pointer input is blocked by
    // the tutorial-presolving class).
    if (presolving) return
    // On a chapter intro page there is no board: arrows drive the topic
    // buttons, axiom presses the focused one (or the default when the
    // cursor is unengaged), and every gameplay action is swallowed so keys
    // can't mutate the hidden workspace.
    if (onIntro()) {
      const cursor = introCursor
      if (cursor !== null) {
        if (cursorNavActions.has(action)) {
          cursor.onAction(action)
          return
        }
        if (action === 'axiom') {
          if (cursor.isEngaged()) cursor.onAction('axiom')
          else introDefault?.()
          return
        }
      }
      return
    }
    // The skip completion screen behaves like an intro page: arrows drive
    // its buttons, axiom presses the focused one (or One More when the
    // cursor is unengaged), and everything else is swallowed so keys can't
    // mutate the board being left behind.
    if (skipped) {
      const cursor = skipCursor
      if (cursor !== null) {
        if (cursorNavActions.has(action)) {
          cursor.onAction(action)
          return
        }
        if (action === 'axiom') {
          if (cursor.isEngaged()) cursor.onAction('axiom')
          else skipDefault?.()
          return
        }
      }
      return
    }
    // On the solved screen, arrow / D-pad actions drive the congrats button
    // cursor and axiom activates the focused button once engaged. This must
    // run BEFORE the base dispatch, whose gaze handling (and the tutorial's
    // gaze block) would swallow the arrows.
    if (ws.isSolved() && congrats !== null) {
      if (cursorNavActions.has(action)) {
        congrats.onAction(action)
        return
      }
      if (action === 'axiom' && congrats.isEngaged()) {
        congrats.onAction('axiom')
        return
      }
    }
    if (action === 'skip') {
      skipChallenge()
      return
    }
    baseDispatch(action)
  }

  const handleKey = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return
    markKeyboardInput()
    // Editor-mode key layer: digits type atom slots, the (otherwise inert)
    // proof-move letters type operators. Checked before the play-mode map so
    // the same physical keys carry editor meanings while a session is live —
    // but not while an overlay covers the editor.
    if (lemmaSession !== null && !paused && !ladderOpen) {
      const piece = editorKeyPieces[ev.code]
      if (piece !== undefined) {
        if (lemmaSession.fill(piece())) rerender()
        return
      }
    }
    const action = qwertyKeyMap[ev.code]
    if (action !== undefined) dispatch(action)
  }

  document.documentElement.classList.add('mode-single')
  document.addEventListener('keydown', handleKey)
  document.addEventListener('pointerdown', markPointerInput)
  // All four pad slots are wired so a pad plugged in mid-session drives the
  // game immediately.
  const cleanupPads = [0, 1, 2, 3].map((idx) => setupGamepad(dispatch, idx))
  const unsubscribeGamepad = subscribeGamepad(rerender)

  // A mount that lands directly on a conjecture beat (tutorial_stop URL)
  // opens with the entry flow, like a beat jump would; landing on a
  // presolved beat opens with the owl laying the foundation.
  if (onConjecture()) openConjecture()
  if (!onIntro()) startPresolveIfAny()

  rerender()

  return {
    cleanup: () => {
      stopDemo()
      cancelPresolve()
      document.documentElement.classList.remove('mode-single')
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('pointerdown', markPointerInput)
      cleanupPads.forEach((c) => c())
      unsubscribeGamepad()
    },
    rerender,
  }
}
