import {
  reverse0,
  reverse1,
  undo,
  prevBranch,
  nextBranch,
} from '../interactive/event'
import { activePath, activeSequent } from '../interactive/focus'
import { Rule } from '../model/rule'
import { AnySequent } from '../model/sequent'
import {
  AnyDerivation,
  branches,
  Derivation,
  Edit,
  editDerivation,
  premise,
  subDerivation,
  transformation,
} from '../model/derivation'
import { fromDerivation } from '../render/print'
import { lemmaGhostPremises } from '../render/draft'
import { RuleId } from '../model/rule'
import { renderDerivation, layoutTree } from './tree'
import type { DraftPremises } from './tree'
import { createLemmaEditorBar } from './lemma-editor'
import type { LemmaEditorSession } from './lemma-editor'
import {
  center,
  isReverseId0,
  left,
  leftLogical,
  reverseAxiom0,
  right,
  rightLogical,
  ruleCategory,
  RuleCategory,
  ReverseId0,
  ReverseId1,
} from '../rules'
import type { Prop } from '../model/prop'
import { AnyWorkspace } from '../interactive/workspace'
import { Action } from '../interactive/action'
import { computeGhostChain, GhostStep } from '../interactive/ghost'
import { Navigate } from './types'
import { t } from './i18n'
import { createLangSwitcher } from './lang-switcher'
import { entries, keys } from '../utils/record'
import { isNonNullable } from '../utils/utils'
import { createButtonCursor } from './button-cursor'
import type { CursorCell } from './button-cursor'
import {
  activePadKeyMap,
  getActionHint,
  getActionHintPure,
  isGazeModeActive,
  markGamepadInput,
  onGamepadConnected,
  onGamepadDisconnected,
  setGazeModeActive,
  toggleHotMode,
} from './input-mode'

export { AnyWorkspace }

export {
  isGamepadActive,
  isGazeModeActive,
  isHotMode,
  markKeyboardInput,
  markPointerInput,
  qwertyKeyMap,
  setGazeModeActive,
  subscribeGamepad,
} from './input-mode'

const ghostToDerivation = <J extends AnySequent>(
  chain: GhostStep[],
  activeSequent: J,
): Derivation<J> => {
  let deps: AnyDerivation[] = []
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const step = chain[i]
    if (!step) continue
    if (deps.length === 0) {
      deps = step.sequents.map((s) => premise(s))
    }
    if (i === 0) {
      return transformation(activeSequent, deps, step.rule)
    }
    const result = chain[i - 1]?.sequents[0]
    if (!result) continue
    deps = [transformation(result, deps, step.rule)]
  }
  return premise(activeSequent)
}

const ruleAction: Partial<Record<RuleId, Action>> = {
  swl: 'leftWeakening',
  sRotLB: 'leftRotateRight',
  nl: 'leftConnective',
  cl: 'leftConnective',
  dl: 'leftConnective',
  il: 'leftConnective',
  swr: 'rightWeakening',
  sRotRB: 'rightRotateLeft',
  nr: 'rightConnective',
  dr: 'rightConnective',
  cr: 'rightConnective',
  ir: 'rightConnective',
  i: 'axiom',
  f: 'axiom',
  v: 'axiom',
  cut: 'lemma',
}

const keyHintBadge = (
  hint: string,
  variant: 'base' | 'hot' | 'cold' | 'coldGhost' = 'base',
): HTMLElement => {
  const badge = document.createElement('span')
  const base =
    variant === 'hot'
      ? 'key-hint hot'
      : variant === 'cold'
        ? 'key-hint cold'
        : variant === 'coldGhost'
          ? 'key-hint cold ghost'
          : 'key-hint'
  const cls = hint.length > 1 ? base + ' wide' : base
  badge.setAttribute('class', cls)
  badge.textContent = hint
  return badge
}

export const createButton = (
  label: string | { long: string; short: string },
  disabled: boolean,
  onClick?: () => void,
): HTMLElement => {
  const el = document.createElement('pre')
  el.setAttribute('class', 'button' + (disabled ? ' disabled' : ''))
  if (!disabled && onClick) el.onclick = onClick
  if (typeof label === 'string') {
    el.innerHTML = label
  } else {
    const longSpan = document.createElement('span')
    longSpan.setAttribute('class', 'button-label long')
    longSpan.textContent = label.long
    el.appendChild(longSpan)
    const shortSpan = document.createElement('span')
    shortSpan.setAttribute('class', 'button-label short')
    shortSpan.textContent = label.short
    el.appendChild(shortSpan)
  }
  return el
}

let rulesVisible = false

export const setDefaultRulesVisible = (visible: boolean): void => {
  rulesVisible = visible
  treeZoom = 1
  autoZoomedDerivations = new WeakSet()
}

let treeZoom = 1
const ZOOM_MIN = 0.4
const ZOOM_MAX = 2
const ZOOM_STEP = 0.2

let autoZoomedDerivations = new WeakSet<AnyDerivation>()
export const zoomTreeOut = (): void => {
  treeZoom = Math.max(ZOOM_MIN, treeZoom - ZOOM_STEP)
}
export const zoomTreeReset = (): void => {
  treeZoom = 1
}
export const zoomTreeIn = (): void => {
  treeZoom = Math.min(ZOOM_MAX, treeZoom + ZOOM_STEP)
}
const AUTO_ZOOM_MAX = 1.2
const AUTO_ZOOM_PAD = 0.9

// Per-bench context: isolates the state that must be independent when two
// benches are rendered side by side (gaze mode, zoom, scroll, hint mode).
export type BenchCtx = {
  isGazeModeActive: () => boolean
  setGazeModeActive: (v: boolean) => void
  getActionHint: (action: Action) => string | undefined
  getTreeZoom: () => number
  setTreeZoom: (v: number) => void
  tryAutoZoom: (d: AnyDerivation) => boolean
  autoZoomMax: number
  getLastScroll: () => { top: number; left: number }
  setLastScroll: (top: number, left: number) => void
  isRulesVisible: () => boolean
  toggleRulesVisible: () => void
  showPar: boolean
  showHud: boolean
}

export const createBenchCtx = (
  isGamepadMode = false,
  autoZoom = true,
  showPar = true,
  showHud = true,
  autoZoomMax = AUTO_ZOOM_MAX,
): BenchCtx => {
  let gazeModeActive = false
  let zoom = 1
  const autoZoomed = new WeakSet<AnyDerivation>()
  let lastScrollTop = 0
  let lastScrollLeft = 0
  let rulesVis = false
  return {
    isGazeModeActive: () => gazeModeActive,
    setGazeModeActive: (v) => {
      gazeModeActive = v
    },
    getActionHint: (action) => getActionHintPure(action, isGamepadMode),
    getTreeZoom: () => zoom,
    setTreeZoom: (v) => {
      zoom = v
    },
    tryAutoZoom: (d) => {
      if (!autoZoom) return false
      if (autoZoomed.has(d)) return false
      autoZoomed.add(d)
      return true
    },
    getLastScroll: () => ({ top: lastScrollTop, left: lastScrollLeft }),
    setLastScroll: (top, left) => {
      lastScrollTop = top
      lastScrollLeft = left
    },
    isRulesVisible: () => rulesVis,
    toggleRulesVisible: () => {
      rulesVis = !rulesVis
    },
    showPar,
    showHud,
    autoZoomMax,
  }
}

// Default context backed by the module-level globals; used by all single-player
// modes so their calling sites need no changes.
const defaultCtx: BenchCtx = {
  isGazeModeActive,
  setGazeModeActive,
  getActionHint,
  getTreeZoom: () => treeZoom,
  setTreeZoom: (v) => {
    treeZoom = v
  },
  tryAutoZoom: (d) => {
    if (autoZoomedDerivations.has(d)) return false
    autoZoomedDerivations.add(d)
    return true
  },
  getLastScroll: () => ({ top: lastScrollTop, left: lastScrollLeft }),
  setLastScroll: (top, left) => {
    lastScrollTop = top
    lastScrollLeft = left
  },
  isRulesVisible: () => rulesVisible,
  toggleRulesVisible: () => {
    rulesVisible = !rulesVisible
  },
  showPar: true,
  showHud: true,
  autoZoomMax: AUTO_ZOOM_MAX,
}

const CHECK_TOTAL_MS = 3000
const CHECK_STEP_MIN_MS = 80
const CHECK_STEP_MAX_MS = 600

const runProofCheckSweep = (tree: HTMLElement): void => {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return
  }
  const nodes = [
    tree,
    ...Array.from(tree.querySelectorAll<HTMLElement>('.tree-node')),
  ]
  if (nodes.length === 0) return
  const byDepth = new Map<number, HTMLElement[]>()
  let maxDepth = 0
  for (const n of nodes) {
    const d = Number(n.dataset['leafDepth'] ?? '0')
    if (d > maxDepth) maxDepth = d
    const list = byDepth.get(d)
    if (list) list.push(n)
    else byDepth.set(d, [n])
  }
  const stepMs = Math.min(
    CHECK_STEP_MAX_MS,
    Math.max(
      CHECK_STEP_MIN_MS,
      maxDepth > 0 ? CHECK_TOTAL_MS / maxDepth : CHECK_TOTAL_MS,
    ),
  )
  const holdMs = stepMs * 0.67
  for (let d = 0; d <= maxDepth; d += 1) {
    const level = byDepth.get(d)
    if (!level) continue
    const isRoot = d === maxDepth
    const prevLevel = d > 0 ? byDepth.get(d - 1) : null
    setTimeout(() => {
      for (const n of level) n.classList.add('tree-checking')
      setTimeout(() => {
        for (const n of level) n.classList.remove('tree-checking')
        if (isRoot) {
          tree.classList.add('tree-proven')
        } else {
          for (const n of level) n.classList.add('tree-verified')
        }
        if (prevLevel) {
          for (const n of prevLevel) {
            n.classList.remove('tree-verified')
            n.classList.add('tree-faded')
          }
        }
      }, holdMs)
    }, d * stepMs)
  }
}

let lastScrollTop = 0
let lastScrollLeft = 0

const createPlayArea = (
  workspace: AnyWorkspace,
  ctx: BenchCtx,
  draftPremises: DraftPremises | null = null,
): HTMLElement => {
  const panel = document.createElement('div')
  const solvedClass = workspace.isSolved() ? ' solved' : ''
  panel.setAttribute('class', 'playarea' + solvedClass)
  panel.style.setProperty('--tree-zoom', String(ctx.getTreeZoom()))
  const { top: startTop, left: startLeft } = ctx.getLastScroll()
  panel.addEventListener('scroll', () => {
    ctx.setLastScroll(panel.scrollTop, panel.scrollLeft)
  })
  const focus = workspace.currentConjecture()
  const solved = workspace.isSolved()
  const gaze = ctx.isGazeModeActive() ? workspace.gaze() : null
  const ghostChain = ctx.isGazeModeActive()
    ? computeGhostChain(
        activeSequent(focus),
        workspace.gaze(),
        workspace.gazeKind(),
        workspace.availableRules(),
      )
    : null
  const path = solved ? [-1] : activePath(focus)
  let derivation = focus.derivation
  let ghostPath: number[] | null = null
  if (ghostChain !== null && ghostChain.length > 0) {
    const edit: Edit = (leaf) => ghostToDerivation(ghostChain, leaf.result)
    const withGhost = editDerivation(focus.derivation, path, edit)
    if (withGhost) {
      derivation = withGhost
      ghostPath = path
    }
  }
  const tree = renderDerivation(
    derivation,
    path,
    gaze,
    [],
    ghostPath,
    workspace.currentStart() ?? null,
    draftPremises,
  )
  const isFresh = focus.derivation.kind === 'premise'
  tree.style.visibility = 'hidden'
  panel.appendChild(tree)
  requestAnimationFrame(() => {
    layoutTree(tree, { skipActiveScroll: true })
    panel.scrollTo({ top: startTop, left: startLeft, behavior: 'instant' })
    if (!solved) {
      requestAnimationFrame(() => {
        const active = tree.querySelector<HTMLElement>(
          '.tree-active, .tree-closed-active',
        )
        if (active) {
          active.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          })
        }
      })
    }
    if (isFresh && !solved && ctx.tryAutoZoom(focus.derivation)) {
      const rootSequent = tree.querySelector<HTMLElement>(
        ':scope > .tree-sequent',
      )
      if (rootSequent) {
        const sequentRect = rootSequent.getBoundingClientRect()
        const areaRect = panel.getBoundingClientRect()
        const panelStyle = getComputedStyle(panel)
        const padLeft = parseFloat(panelStyle.paddingLeft)
        const padRight = parseFloat(panelStyle.paddingRight)
        const availW = areaRect.width - padLeft - padRight
        if (sequentRect.width > 0 && availW > 0) {
          const target = Math.max(
            ZOOM_MIN,
            Math.min(
              ctx.autoZoomMax,
              (ctx.getTreeZoom() * availW * AUTO_ZOOM_PAD) / sequentRect.width,
            ),
          )
          if (Math.abs(target - ctx.getTreeZoom()) > 0.01) {
            ctx.setTreeZoom(target)
            panel.style.setProperty('--tree-zoom', String(ctx.getTreeZoom()))
            layoutTree(tree, { skipActiveScroll: true })
          }
        }
      }
    }
    tree.style.visibility = ''
    if (solved) {
      const treeRect = tree.getBoundingClientRect()
      const areaRect = panel.getBoundingClientRect()
      const panelStyle = getComputedStyle(panel)
      const padH =
        parseFloat(panelStyle.paddingLeft) + parseFloat(panelStyle.paddingRight)
      const padV =
        parseFloat(panelStyle.paddingTop) + parseFloat(panelStyle.paddingBottom)
      const availW = areaRect.width - padH
      const availH = (areaRect.height - padV) * 0.85
      const scale = Math.min(
        1,
        availW / treeRect.width,
        availH / treeRect.height,
      )
      tree.style.transformOrigin = 'center bottom'
      tree.style.transition = 'transform 1.2s ease-in-out'
      const currentScale = tree.style.transform
        ? parseFloat(tree.style.transform.replace('scale(', ''))
        : 1
      if (Math.abs(scale - currentScale) > 0.001) {
        const onZoomEnd = (e: TransitionEvent): void => {
          if (e.propertyName !== 'transform') return
          tree.removeEventListener('transitionend', onZoomEnd)
          runProofCheckSweep(tree)
        }
        tree.addEventListener('transitionend', onZoomEnd)
      } else {
        setTimeout(() => runProofCheckSweep(tree), 0)
      }
      requestAnimationFrame(() => {
        tree.style.transform = `scale(${scale})`
        tree.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'center',
        })
      })
    }
  })
  return panel
}

const ruleConnectiveLabel: Partial<Record<RuleId, string>> = {
  nl: '¬',
  nr: '¬',
  cl: '∧',
  cr: '∧',
  dl: '∨',
  dr: '∨',
  il: '→',
  ir: '→',
}

type GazeHintsForKind = {
  immediateRule: RuleId | null
  eventualRule: RuleId | null
  hintChar: string | undefined
}

type GazeHintInfo = {
  connective: GazeHintsForKind | null
  weakening: GazeHintsForKind | null
}

const gazeHintBadgeForKind = (
  key: RuleId,
  hints: GazeHintsForKind | null,
): HTMLElement | null => {
  if (!hints || hints.hintChar === undefined) return null
  if (key === hints.immediateRule) {
    return keyHintBadge(hints.hintChar, 'cold')
  }
  if (
    key === hints.eventualRule &&
    hints.eventualRule !== hints.immediateRule
  ) {
    return keyHintBadge(hints.hintChar, 'coldGhost')
  }
  return null
}

const createRuleCard = (
  key: RuleId,
  rule: Rule<AnySequent>,
  disabled: boolean,
  pinned: ReadonlyArray<RuleId>,
  hideRules: boolean,
  gazeHints: GazeHintInfo,
  panelClass: string,
  getHint: (action: Action) => string | undefined,
): HTMLElement => {
  const isPinned = pinned.includes(key)
  const pre = document.createElement('pre')
  pre.setAttribute(
    'class',
    'rule hint' + (disabled ? ' disabled' : '') + (isPinned ? ' pinned' : ''),
  )
  pre.dataset['rule'] = key
  pre.dataset['group'] = ruleCategory[key]
  const withLabel = fromDerivation(
    rule.example,
    t('sideLeft'),
    t('sideRight'),
    true,
  )
  const withoutLabel = fromDerivation(
    rule.example,
    t('sideLeft'),
    t('sideRight'),
    false,
  )
  pre.innerHTML =
    '<span class="rule-label long">' +
    withLabel +
    '</span>' +
    '<span class="rule-label short">' +
    withoutLabel +
    '</span>'
  const action = ruleAction[key]
  const hint = action !== undefined ? getHint(action) : undefined
  const ruleHintVariant = panelClass === 'main' ? 'base' : 'hot'
  if (hint !== undefined && !hideRules)
    pre.appendChild(keyHintBadge(hint, ruleHintVariant))
  const gazeBadges = [
    gazeHintBadgeForKind(key, gazeHints.connective),
    gazeHintBadgeForKind(key, gazeHints.weakening),
  ].filter(isNonNullable)
  if (gazeBadges.length > 0) {
    const stack = document.createElement('span')
    stack.setAttribute('class', 'gaze-hint-stack')
    for (const b of gazeBadges) stack.appendChild(b)
    pre.appendChild(stack)
  }
  return pre
}

// Bare rule card for the design-system gallery: production markup with the
// key/gaze badges suppressed.
export const createBareRuleCard = (
  key: RuleId,
  rule: Rule<AnySequent>,
  disabled: boolean,
): HTMLElement =>
  createRuleCard(
    key,
    rule,
    disabled,
    [],
    true,
    { connective: null, weakening: null },
    'main',
    () => undefined,
  )

const createPanel = <K extends RuleId>(
  className: string,
  ruleRecord: Record<K, Rule<AnySequent>>,
  ls: ReadonlyArray<RuleId>,
  rules: ReadonlyArray<RuleId>,
  pinned: ReadonlyArray<RuleId>,
  hideRules: boolean,
  solved: boolean,
  gazeHints: GazeHintInfo,
  getHint: (action: Action) => string | undefined,
): HTMLElement => {
  const panel = document.createElement('div')
  panel.setAttribute('class', className)
  entries(ruleRecord).forEach(([key, rule]) => {
    if (!rules.includes(key)) return
    const disabled = solved || !ls.includes(key)
    panel.appendChild(
      createRuleCard(
        key,
        rule,
        disabled,
        pinned,
        hideRules,
        gazeHints,
        className,
        getHint,
      ),
    )
  })
  return panel
}

export const countRuleUsage = (
  d: AnyDerivation,
): Record<RuleCategory, number> => {
  const counts: Record<RuleCategory, number> = {
    axiom: 0,
    structural: 0,
    logical: 0,
    meta: 0,
  }
  const walk = (node: AnyDerivation) => {
    if (node.kind === 'premise') return
    counts[ruleCategory[node.rule]] += 1
    node.deps.forEach(walk)
  }
  walk(d)
  return counts
}

const formatHudCounts = (counts: Record<RuleCategory, number>): string => {
  const order: RuleCategory[] = ['axiom', 'structural', 'logical', 'meta']
  const total = order.reduce((sum, cat) => sum + counts[cat], 0)
  return `<b>${total}</b>`
}

export type ApplyReverse1 = (
  key: ReverseId1,
  onFormula: (formula: Prop) => void,
) => void

export const createBench = (
  workspace: AnyWorkspace,
  makeCongrats: () => { hurray: HTMLElement; buttons: HTMLElement },
  controlsEl: HTMLElement,
  rerender: () => void,
  onMenu?: () => void,
  onApplyReverse1?: ApplyReverse1,
  hideLemma?: boolean,
  ctx: BenchCtx = defaultCtx,
  onSkip?: () => void,
  hideGaze?: boolean,
  hideRulesButton?: boolean,
  lemmaEditor: LemmaEditorSession | null = null,
): HTMLElement => {
  const ls = workspace.applicableRules()
  const rules = workspace.availableRules()
  const solved = workspace.isSolved()
  const focus = workspace.currentConjecture()
  const activeDeriv = subDerivation(focus.derivation, activePath(focus))
  const branchClosed = activeDeriv?.kind === 'transformation'
  const inactive = solved || branchClosed

  const seq = activeSequent(workspace.currentConjecture())
  const available = workspace.availableRules()
  const buildKindHints = (
    kind: 'connective' | 'weakening',
    hintChar: string | undefined,
  ): GazeHintsForKind | null => {
    const chain = computeGhostChain(seq, workspace.gaze(), kind, available)
    if (!chain || chain.length === 0) return null
    return {
      immediateRule: chain[0]?.rule ?? null,
      eventualRule: chain[chain.length - 1]?.rule ?? null,
      hintChar,
    }
  }
  const gazeHints: GazeHintInfo = ctx.isGazeModeActive()
    ? {
        connective: buildKindHints(
          'connective',
          ctx.getActionHint('gazeConnective'),
        ),
        weakening: buildKindHints(
          'weakening',
          ctx.getActionHint('gazeWeakening'),
        ),
      }
    : { connective: null, weakening: null }

  const hideRules = !ctx.isRulesVisible() || solved
  const pinned = workspace.pinnedRules()
  const panel = document.createElement('div')
  const hasPinned = !solved && pinned.length > 0
  const hasPinnedMany = !solved && pinned.length > 2
  panel.setAttribute(
    'class',
    'bench' +
      (hideRules ? ' rules-hidden' : '') +
      (hasPinned ? ' has-pinned' : '') +
      (hasPinnedMany ? ' has-pinned-many' : ''),
  )
  panel.appendChild(
    createPanel(
      'left',
      left,
      ls,
      rules,
      pinned,
      hideRules,
      inactive,
      gazeHints,
      ctx.getActionHint,
    ),
  )
  const congrats = solved ? makeCongrats() : null
  if (congrats) {
    panel.appendChild(congrats.hurray)
  } else {
    panel.appendChild(
      createPanel(
        'main',
        center,
        ls,
        rules,
        pinned,
        hideRules,
        inactive,
        gazeHints,
        ctx.getActionHint,
      ),
    )
  }
  panel.appendChild(
    createPanel(
      'right',
      right,
      ls,
      rules,
      pinned,
      hideRules,
      inactive,
      gazeHints,
      ctx.getActionHint,
    ),
  )

  const rulesBtn = document.createElement('div')
  rulesBtn.setAttribute('class', 'button toggle bench-rules-btn')
  rulesBtn.setAttribute('aria-label', t('rules'))
  rulesBtn.textContent = '?'
  rulesBtn.onclick = () => {
    ctx.toggleRulesVisible()
    rerender()
  }
  const rulesLed = document.createElement('span')
  rulesLed.setAttribute('class', 'led' + (ctx.isRulesVisible() ? ' on' : ''))
  rulesBtn.appendChild(rulesLed)

  const topbar = document.createElement('div')
  topbar.setAttribute('class', 'bench-topbar')

  const topbarLeft = document.createElement('div')
  topbarLeft.setAttribute('class', 'bench-topbar-left')
  if (onMenu !== undefined) {
    const menuBtn = document.createElement('div')
    menuBtn.setAttribute('class', 'button quiz-menu-btn')
    menuBtn.setAttribute('aria-label', t('menu'))
    menuBtn.textContent = '⋮'
    menuBtn.onclick = onMenu
    topbarLeft.appendChild(menuBtn)
  }
  topbar.appendChild(topbarLeft)

  const topbarCenter = document.createElement('div')
  topbarCenter.setAttribute('class', 'bench-topbar-center')
  const hud = document.createElement('div')
  hud.setAttribute('class', 'hud' + (solved ? ' solved' : ''))
  if (ctx.showHud && solved) {
    const hudCounts = formatHudCounts(countRuleUsage(focus.derivation))
    hud.innerHTML = t('moves') + ' ' + hudCounts
    if (ctx.showPar) {
      const solution = workspace.currentSolution()
      const par = document.createElement('div')
      par.setAttribute('class', 'par')
      par.innerHTML = solution
        ? t('par') + ' ' + formatHudCounts(countRuleUsage(solution))
        : t('par') + ' 💀'
      hud.appendChild(par)
    }
  }
  topbarCenter.appendChild(hud)
  topbar.appendChild(topbarCenter)

  const topbarRight = document.createElement('div')
  topbarRight.setAttribute('class', 'bench-topbar-right')
  // The rules sheet is a quick reference for rules already learned — the
  // tutorial hides the toggle so the player doesn't reach for it mid-lesson.
  if (!solved && hideRulesButton !== true) {
    topbarRight.appendChild(rulesBtn)
  }
  topbar.appendChild(topbarRight)

  panel.appendChild(topbar)

  // Mobile bottom sheet for rules
  const rulesSheet = document.createElement('div')
  const sheetMode = ctx.isGazeModeActive() ? 'gaze' : 'hot'
  rulesSheet.setAttribute('class', 'rules-sheet ' + sheetMode)
  if (!congrats) {
    const sheetCenter = document.createElement('div')
    sheetCenter.setAttribute('class', 'rules-sheet-center')
    entries(center).forEach(([key, rule]) => {
      if (!rules.includes(key)) return
      const disabled = solved || !ls.includes(key)
      const card = createRuleCard(
        key,
        rule,
        disabled,
        pinned,
        hideRules,
        gazeHints,
        'main',
        ctx.getActionHint,
      )
      sheetCenter.appendChild(card)
    })
    rulesSheet.appendChild(sheetCenter)
  }
  const sheetSides = document.createElement('div')
  sheetSides.setAttribute('class', 'rules-sheet-sides')
  const leftCol = document.createElement('div')
  leftCol.setAttribute('class', 'rules-sheet-col')
  entries(left).forEach(([key, rule]) => {
    if (!rules.includes(key)) return
    const disabled = inactive || !ls.includes(key)
    const card = createRuleCard(
      key,
      rule,
      disabled,
      pinned,
      hideRules,
      gazeHints,
      'left',
      ctx.getActionHint,
    )
    leftCol.appendChild(card)
  })
  const rightCol = document.createElement('div')
  rightCol.setAttribute('class', 'rules-sheet-col')
  entries(right).forEach(([key, rule]) => {
    if (!rules.includes(key)) return
    const disabled = inactive || !ls.includes(key)
    const card = createRuleCard(
      key,
      rule,
      disabled,
      pinned,
      hideRules,
      gazeHints,
      'right',
      ctx.getActionHint,
    )
    rightCol.appendChild(card)
  })
  sheetSides.appendChild(leftCol)
  sheetSides.appendChild(rightCol)
  rulesSheet.appendChild(sheetSides)
  panel.appendChild(rulesSheet)
  const editing = lemmaEditor !== null && !solved
  const draftPremises = editing
    ? lemmaGhostPremises(seq, lemmaEditor.draft())
    : null
  panel.appendChild(createPlayArea(workspace, ctx, draftPremises))
  const zoomOut = createButton('−', false, () => {
    ctx.setTreeZoom(Math.max(ZOOM_MIN, ctx.getTreeZoom() - ZOOM_STEP))
    rerender()
  })
  const zoomReset = createButton(':', false, () => {
    ctx.setTreeZoom(1)
    rerender()
  })
  zoomReset.classList.add('zoom-reset')
  const zoomIn = createButton('+', false, () => {
    ctx.setTreeZoom(Math.min(ZOOM_MAX, ctx.getTreeZoom() + ZOOM_STEP))
    rerender()
  })
  const gazeMovable =
    !inactive && seq.antecedent.length + seq.succedent.length > 1
  const leftDisabled = ctx.isGazeModeActive()
    ? !gazeMovable
    : inactive || seq.antecedent.length === 0
  const rightDisabled = ctx.isGazeModeActive()
    ? !gazeMovable
    : inactive || seq.succedent.length === 0
  const gazeLeftBtn = createButton(t('left'), leftDisabled, () => {
    if (!ctx.isGazeModeActive()) {
      ctx.setGazeModeActive(true)
      workspace.setGaze({
        side: 'left',
        index: seq.antecedent.length - 1,
      })
    } else {
      workspace.moveGaze(-1)
    }
    rerender()
  })
  const gazeRightBtn = createButton(t('right'), rightDisabled, () => {
    if (!ctx.isGazeModeActive()) {
      ctx.setGazeModeActive(true)
      workspace.setGaze({ side: 'right', index: 0 })
    } else {
      workspace.moveGaze(1)
    }
    rerender()
  })
  const gazeWeakeningBtn = createButton(
    t('drop'),
    !ctx.isGazeModeActive() || inactive,
    () => {
      workspace.setGazeKind('weakening')
      applyGazeRule(workspace, 'weakening')
      rerender()
    },
  )
  const connectiveRule = gazeHints.connective?.eventualRule ?? null
  const connectiveLabel =
    connectiveRule !== null ? (ruleConnectiveLabel[connectiveRule] ?? '') : ''
  const connectiveDisabled =
    !ctx.isGazeModeActive() || inactive || connectiveLabel === ''
  const gazeConnectiveBtn = createButton(
    t('destruct'),
    connectiveDisabled,
    () => {
      workspace.setGazeKind('connective')
      applyGazeRule(workspace, 'connective')
      rerender()
    },
  )
  const makeGroup = (...cls: string[]): HTMLElement => {
    const g = document.createElement('div')
    g.setAttribute('class', ['controls-group', ...cls].join(' '))
    return g
  }

  const axiomBtn = createButton(
    t('axiom'),
    inactive ||
      !keys(reverseAxiom0).some((k) => ls.includes(k) && isReverseId0(k)),
    () => {
      autoRule(workspace, keys(reverseAxiom0))
      rerender()
    },
  )

  const lemmaDisabled =
    inactive || onApplyReverse1 === undefined || !ls.includes('cut')
  const lemmaBtn = createButton(t('lemma'), lemmaDisabled, () => {
    if (onApplyReverse1 === undefined) return
    onApplyReverse1('cut', (formula) => {
      workspace.applyEvent(reverse1('cut', formula))
      rerender()
    })
  })

  const miscGroup = makeGroup('controls-misc')
  if (onSkip !== undefined) {
    const skipBtn = createButton(t('skip'), false, onSkip)
    skipBtn.classList.add('mutating')
    miscGroup.appendChild(skipBtn)
  }

  const gazeGroup = makeGroup(ctx.isGazeModeActive() ? 'gaze' : 'hot')
  gazeGroup.appendChild(gazeLeftBtn)
  gazeGroup.appendChild(gazeWeakeningBtn)
  gazeGroup.appendChild(gazeConnectiveBtn)
  gazeGroup.appendChild(gazeRightBtn)

  zoomOut.classList.add('zoom-step')
  zoomIn.classList.add('zoom-step')
  const zoomGroup = document.createElement('div')
  zoomGroup.setAttribute('class', 'bench-zoom')
  zoomGroup.appendChild(zoomOut)
  zoomGroup.appendChild(zoomReset)
  zoomGroup.appendChild(zoomIn)
  if (!solved) topbarCenter.appendChild(zoomGroup)

  controlsEl.setAttribute('class', 'controls-undo-inner')

  const branchCount = branches(workspace.currentConjecture().derivation).length
  const canSwitch = !solved && branchCount > 1
  const prevBranchBtn = createButton(t('prevBranch'), !canSwitch, () => {
    workspace.applyEvent(prevBranch())
    rerender()
  })
  const nextBranchBtn = createButton(t('nextBranch'), !canSwitch, () => {
    workspace.applyEvent(nextBranch())
    rerender()
  })

  // Two button families distinguished by border color: `inert` buttons only
  // navigate or select and never change the proof; `mutating` buttons directly
  // change game state (apply/undo a rule, skip the challenge).
  gazeLeftBtn.classList.add('inert')
  gazeRightBtn.classList.add('inert')
  lemmaBtn.classList.add('inert')
  prevBranchBtn.classList.add('inert')
  nextBranchBtn.classList.add('inert')
  gazeWeakeningBtn.classList.add('mutating')
  gazeConnectiveBtn.classList.add('mutating')
  axiomBtn.classList.add('mutating')

  const navGroup = makeGroup('controls-nav')
  navGroup.appendChild(prevBranchBtn)
  // Lemma sits with the branch controls: it operates on the active branch. Still
  // gated by hideLemma so Campaign keeps it out.
  if (hideLemma !== true) navGroup.appendChild(lemmaBtn)
  navGroup.appendChild(controlsEl)
  navGroup.appendChild(axiomBtn)
  navGroup.appendChild(nextBranchBtn)

  if (editing) {
    // Inline lemma editing takes over the whole bottom bar; the play controls
    // return when the session confirms or cancels.
    panel.appendChild(createLemmaEditorBar(lemmaEditor, rerender))
    return panel
  }

  const controlsBar = document.createElement('div')
  controlsBar.setAttribute('class', 'controls')
  if (congrats) {
    congrats.buttons.setAttribute('class', 'congrabuttons controls-group')
    controlsBar.appendChild(congrats.buttons)
  } else {
    // Order: Skip · Branch · Gaze — a centered row that wraps group-by-group
    // onto extra lines when they no longer all fit (see .controls in lk.css).
    if (onSkip !== undefined) controlsBar.appendChild(miscGroup)
    controlsBar.appendChild(navGroup)
    if (hideGaze !== true) controlsBar.appendChild(gazeGroup)
  }
  panel.appendChild(controlsBar)

  // Mobile pinned rules strip below gaze buttons
  if (!solved && pinned.length > 0) {
    const pinnedStrip = document.createElement('div')
    pinnedStrip.setAttribute('class', 'pinned-strip')
    const allRules: Partial<Record<RuleId, Rule<AnySequent>>> = {
      ...left,
      ...center,
      ...right,
    }
    for (const key of pinned) {
      const rule = allRules[key]
      if (rule === undefined || !rules.includes(key)) continue
      const disabled = inactive || !ls.includes(key)
      const panelClass = key in left ? 'left' : key in right ? 'right' : 'main'
      const card = createRuleCard(
        key,
        rule,
        disabled,
        pinned,
        false,
        gazeHints,
        panelClass,
        ctx.getActionHint,
      )
      pinnedStrip.appendChild(card)
    }
    panel.appendChild(pinnedStrip)
  }

  return panel
}

const autoRule = (workspace: AnyWorkspace, rules: RuleId[]) => {
  const available = workspace.applicableRules()
  const [first] = rules.filter(
    (rule): rule is ReverseId0 =>
      available.includes(rule) && isReverseId0(rule),
  )
  if (!first) return
  workspace.applyEvent(reverse0(first))
}

export const createPausePopup = (
  onResume: () => void,
  onExit: () => void,
  onSettings?: () => void,
  onCustom?: () => void,
): { el: HTMLElement; onAction: (action: Action) => void } => {
  const shroud = document.createElement('div')
  shroud.setAttribute('class', 'shroud pause-shroud')
  shroud.onclick = (ev) => {
    if (ev.target === shroud) {
      ev.preventDefault()
      onResume()
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

  // Each button is one cursor row; the keyboard / gamepad cursor moves up / down
  // and axiom presses the focused one. Direct-access keybindings still work via
  // the mode's dispatch, so the on-screen key badges are gone.
  const cells: CursorCell[] = []
  const addButton = (
    el: HTMLElement,
    activate: () => void,
    isEnabled: () => boolean,
  ): void => {
    buttons.appendChild(el)
    cells.push({ btn: el, activate, isEnabled })
  }

  addButton(
    createButton(t('resumeGame'), false, onResume),
    onResume,
    () => true,
  )
  const spacer = document.createElement('div')
  spacer.setAttribute('class', 'pause-buttons-spacer')
  buttons.appendChild(spacer)
  if (onCustom) {
    addButton(
      createButton(t('challengeSetup'), false, onCustom),
      onCustom,
      () => true,
    )
  }
  if (onSettings) {
    addButton(
      createButton(t('challengeSetup'), false, onSettings),
      onSettings,
      () => true,
    )
  }
  addButton(
    createButton(t('exitToMainMenu'), false, onExit),
    onExit,
    () => true,
  )

  panel.appendChild(buttons)
  shroud.appendChild(panel)
  shroud.appendChild(createLangSwitcher())

  const cursor = createButtonCursor(cells.map((c) => [c]))
  return { el: shroud, onAction: cursor.onAction }
}

const RULE_APPLY_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  'leftWeakening',
  'leftConnective',
  'leftRotateRight',
  'rightWeakening',
  'rightConnective',
  'rightRotateLeft',
])

export const createDispatch =
  (
    getWorkspace: () => AnyWorkspace,
    rerender: () => void,
    navigate: Navigate,
    onSolved: (action: Action) => void,
    onLevel?: () => void,
    onMenu?: () => void,
    onApplyReverse1?: ApplyReverse1,
    ctx: BenchCtx = defaultCtx,
    onJustSolved?: () => void,
    blockGaze?: () => boolean,
  ) =>
  (action: Action): void => {
    // Gaze can be disabled per bench state (the tutorial's Close beat hides
    // the buttons; this keeps the keyboard/gamepad paths consistent).
    if (
      blockGaze !== undefined &&
      blockGaze() &&
      (action === 'gazeLeft' ||
        action === 'gazeRight' ||
        action === 'gazeConnective' ||
        action === 'gazeWeakening')
    ) {
      return
    }
    if (action === 'gazeLeft' || action === 'gazeRight') {
      if (!ctx.isGazeModeActive()) {
        const workspace = getWorkspace()
        const seq = activeSequent(workspace.currentConjecture())
        if (action === 'gazeLeft') {
          if (seq.antecedent.length === 0) return
          ctx.setGazeModeActive(true)
          workspace.setGaze({
            side: 'left',
            index: seq.antecedent.length - 1,
          })
        } else {
          if (seq.succedent.length === 0) return
          ctx.setGazeModeActive(true)
          workspace.setGaze({ side: 'right', index: 0 })
        }
        rerender()
        return
      }
    } else if (action === 'gazeConnective' || action === 'gazeWeakening') {
      if (!ctx.isGazeModeActive()) return
    } else if (ctx.isGazeModeActive() && RULE_APPLY_ACTIONS.has(action)) {
      ctx.setGazeModeActive(false)
    } else if (action === 'undo' && ctx.isGazeModeActive()) {
      if (activePath(getWorkspace().currentConjecture()).length === 0) {
        ctx.setGazeModeActive(false)
      }
    }
    if (action === 'menu') {
      if (onMenu) onMenu()
      else navigate('menu')
      return
    }
    if (action === 'level') {
      onLevel?.()
      return
    }
    if (action === 'toggleRules') {
      ctx.toggleRulesVisible()
      rerender()
      return
    }
    const workspace = getWorkspace()
    if (workspace.isSolved()) {
      onSolved(action)
      return
    }
    const focusState = workspace.currentConjecture()
    const activeDeriv = subDerivation(
      focusState.derivation,
      activePath(focusState),
    )
    const onClosedBranch = activeDeriv?.kind === 'transformation'
    if (
      onClosedBranch &&
      action !== 'prevBranch' &&
      action !== 'nextBranch' &&
      action !== 'undo'
    ) {
      rerender()
      return
    }
    switch (action) {
      case 'leftWeakening':
        workspace.applyEvent(reverse0('swl'))
        break
      case 'leftRotateRight':
        workspace.applyEvent(reverse0('sRotLB'))
        break
      case 'leftConnective':
        autoRule(workspace, keys(leftLogical))
        break
      case 'rightWeakening':
        workspace.applyEvent(reverse0('swr'))
        break
      case 'rightRotateLeft':
        workspace.applyEvent(reverse0('sRotRB'))
        break
      case 'rightConnective':
        autoRule(workspace, keys(rightLogical))
        break
      case 'prevBranch':
        workspace.applyEvent(prevBranch())
        break
      case 'nextBranch':
        workspace.applyEvent(nextBranch())
        break
      case 'lemma':
        if (
          onApplyReverse1 !== undefined &&
          workspace.availableRules().includes('cut')
        ) {
          onApplyReverse1('cut', (formula) => {
            workspace.applyEvent(reverse1('cut', formula))
            rerender()
          })
        }
        return
      case 'axiom':
        autoRule(workspace, keys(reverseAxiom0))
        break
      case 'undo':
        workspace.applyEvent(undo())
        break
      case 'gazeLeft':
        workspace.moveGaze(-1)
        break
      case 'gazeRight':
        workspace.moveGaze(1)
        break
      case 'gazeConnective':
        workspace.setGazeKind('connective')
        applyGazeRule(workspace, 'connective')
        break
      case 'gazeWeakening':
        workspace.setGazeKind('weakening')
        applyGazeRule(workspace, 'weakening')
        break
    }
    if (workspace.isSolved()) {
      onJustSolved?.()
    }
    rerender()
  }

const applyGazeRule = (
  workspace: AnyWorkspace,
  kind: 'connective' | 'weakening',
): void => {
  const gaze = workspace.gaze()
  const seq = activeSequent(workspace.currentConjecture())
  const available = workspace.availableRules()
  const chain = computeGhostChain(seq, gaze, kind, available)
  if (!chain || chain.length === 0) return
  const ant = seq.antecedent.length
  const suc = seq.succedent.length
  if (gaze.side === 'left') {
    if (ant === 0) return
    const activeIndex = ant - 1
    if (gaze.index === activeIndex) {
      if (kind === 'connective') {
        autoRule(workspace, keys(leftLogical))
      } else {
        if (!available.includes('swl')) return
        workspace.applyEvent(reverse0('swl'))
      }
      return
    }
    if (!available.includes('sRotLB')) return
    workspace.applyEventWithGaze(reverse0('sRotLB'), {
      side: 'left',
      index: gaze.index + 1,
    })
  } else {
    if (suc === 0) return
    const activeIndex = 0
    if (gaze.index === activeIndex) {
      if (kind === 'connective') {
        autoRule(workspace, keys(rightLogical))
      } else {
        if (!available.includes('swr')) return
        workspace.applyEvent(reverse0('swr'))
      }
      return
    }
    if (!available.includes('sRotRB')) return
    workspace.applyEventWithGaze(reverse0('sRotRB'), {
      side: 'right',
      index: gaze.index - 1,
    })
  }
}

export const setupGamepad = (
  dispatch: (action: Action) => void,
  gamepadIndex = 0,
): (() => void) => {
  const oldPresses: Array<boolean> = []
  let active = false
  let chordFired = false

  const loop = () => {
    if (!active) return
    const gp = navigator.getGamepads()[gamepadIndex]
    if (gp) {
      for (const [button, action] of Object.entries(activePadKeyMap())) {
        const index = Number(button)
        const oldPress = oldPresses[index] ?? false
        const newPress = gp.buttons[index]?.pressed ?? false
        if (newPress !== oldPress) {
          // Defer dispatch out of the RAF callback so the rerender it triggers
          // runs as a task between frames. This matches keyboard event timing
          // and prevents createPlayArea's hide-then-show layout pass from
          // painting one frame with the tree hidden.
          if (newPress) {
            markGamepadInput()
            setTimeout(() => dispatch(action), 0)
          }
          oldPresses[index] = newPress
        }
      }
      // L3 + R3 chord toggles hot mode. Detected as "both pressed in the same
      // poll frame"; chordFired latches until both buttons are released, so a
      // single press of the chord doesn't fire repeatedly.
      const l3 = gp.buttons[10]?.pressed ?? false
      const r3 = gp.buttons[11]?.pressed ?? false
      if (l3 && r3 && !chordFired) {
        markGamepadInput()
        setTimeout(toggleHotMode, 0)
        chordFired = true
      }
      if (!l3 && !r3) chordFired = false
    }
    requestAnimationFrame(loop)
  }

  const onConnected = () => {
    if (active) return
    active = true
    onGamepadConnected()
    loop()
  }

  const onDisconnected = () => {
    if (navigator.getGamepads()[gamepadIndex] !== null) return
    active = false
    onGamepadDisconnected()
  }

  window.addEventListener('gamepadconnected', onConnected)
  window.addEventListener('gamepaddisconnected', onDisconnected)

  // Detect a pad that was already connected before mount.
  const preExisting = navigator.getGamepads()[gamepadIndex] !== null
  if (preExisting) onConnected()

  return () => {
    active = false
    window.removeEventListener('gamepadconnected', onConnected)
    window.removeEventListener('gamepaddisconnected', onDisconnected)
  }
}
