import { AnyDerivation, Path } from '../model/derivation'
import {
  basic,
  fromDerivation,
  fromRuleId,
  fromSequent,
  GazeMark,
} from '../render/print'
import { html } from '../render/segment'
import { RuleId } from '../model/rule'
import { GhostStep } from '../interactive/ghost'

const equalPaths = (a: Path, b: Path): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i])

const renderSequent = (
  derivation: AnyDerivation,
  ruleIds: ReadonlyArray<RuleId>,
  isActive: boolean,
  gaze: GazeMark | null,
): HTMLElement => {
  const el = document.createElement('div')
  el.setAttribute('class', 'tree-sequent')
  el.innerHTML = html(
    fromSequent(
      derivation.result,
      isActive ? ruleIds : [],
      isActive ? gaze : null,
    )(basic),
  )
  return el
}

const renderGhost = (chain: GhostStep[]): HTMLElement => {
  const wrap = document.createElement('div')
  wrap.setAttribute('class', 'ghost-tree')
  // Chain is ordered first-step → final-step. Visually, we want the
  // final step at the top and the first step just above the active
  // sequent at the bottom. Render in reverse order so the DOM order
  // top-to-bottom matches.
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const step = chain[i]
    if (!step) continue
    const sequent = document.createElement('div')
    sequent.setAttribute('class', 'tree-sequent ghost')
    sequent.innerHTML = html(fromSequent(step.sequent, [], null)(basic))
    wrap.appendChild(sequent)
    const inference = document.createElement('div')
    inference.setAttribute('class', 'tree-inference ghost')
    const label = document.createElement('div')
    label.setAttribute('class', 'tree-rule-label')
    label.innerHTML = html(fromRuleId(step.rule)(basic))
    inference.appendChild(label)
    wrap.appendChild(inference)
  }
  return wrap
}

const renderInferenceLine = (ruleId: RuleId): HTMLElement => {
  const container = document.createElement('div')
  container.setAttribute('class', 'tree-inference')

  const label = document.createElement('div')
  label.setAttribute('class', 'tree-rule-label')
  label.innerHTML = html(fromRuleId(ruleId)(basic))
  container.appendChild(label)

  return container
}

export const renderDerivation = (
  derivation: AnyDerivation,
  activePath: Path,
  applicableRules: ReadonlyArray<RuleId>,
  gaze: GazeMark | null = null,
  ghost: GhostStep[] | null = null,
  currentPath: Path = [],
): HTMLElement => {
  const isActive = equalPaths(currentPath, activePath)
  const isOpenActive = isActive && derivation.kind === 'premise'
  const isClosedActive = isActive && derivation.kind === 'transformation'

  const node = document.createElement('div')
  const cls =
    'tree-node' +
    (isOpenActive ? ' tree-active' : '') +
    (isClosedActive ? ' tree-closed-active' : '')
  node.setAttribute('class', cls)

  let leafDepth = 0
  if (derivation.kind === 'transformation') {
    if (isClosedActive) {
      const marker = document.createElement('div')
      marker.setAttribute('class', 'tree-closed-marker')
      node.appendChild(marker)
    }
    const premises = document.createElement('div')
    premises.setAttribute('class', 'tree-premises')
    let maxChildDepth = -1
    derivation.deps.forEach((dep, i) => {
      const child = renderDerivation(
        dep,
        activePath,
        applicableRules,
        gaze,
        ghost,
        [...currentPath, i],
      )
      const childDepth = Number(child.dataset['leafDepth'] ?? '0')
      if (childDepth > maxChildDepth) maxChildDepth = childDepth
      premises.appendChild(child)
    })
    leafDepth = maxChildDepth < 0 ? 0 : maxChildDepth + 1
    node.appendChild(premises)
    node.appendChild(renderInferenceLine(derivation.rule))
    node.appendChild(renderSequent(derivation, applicableRules, false, null))
  } else {
    if (isOpenActive && ghost && ghost.length > 0) {
      node.appendChild(renderGhost(ghost))
    }
    node.appendChild(
      renderSequent(derivation, applicableRules, isOpenActive, gaze),
    )
  }
  node.dataset['leafDepth'] = String(leafDepth)

  if (currentPath.length === 0) {
    node.addEventListener('copy', (e) => {
      e.preventDefault()
      e.clipboardData?.setData('text/plain', fromDerivation(derivation))
    })
  }

  return node
}

// Post-order layout matching treeAuto in src/render/block.ts:
// a node's inference line depends only on its OWN sequent and the
// joined widths of its IMMEDIATE child sequents — not on grandchildren.
// The whole subtree may still need a wider footprint to accommodate
// deeper structure; that footprint never feeds back into the line width.
type NodeWidths = { sequent: number; subtree: number }

const LINE_PAD = 16 // px of slack on each side of the inference line

const stabilizeWidths = (node: HTMLElement): NodeWidths => {
  const sequent = node.querySelector(
    ':scope > .tree-sequent',
  ) as HTMLElement | null
  const sequentWidth = sequent ? sequent.getBoundingClientRect().width : 0

  const premises = node.querySelector(
    ':scope > .tree-premises',
  ) as HTMLElement | null
  const inference = node.querySelector(
    ':scope > .tree-inference',
  ) as HTMLElement | null

  let childSequentSum = 0
  let childSubtreeSum = 0
  let gap = 0
  let count = 0
  if (premises) {
    const children = Array.from(premises.children) as HTMLElement[]
    count = children.length
    gap = parseFloat(getComputedStyle(premises).gap) || 0
    for (const child of children) {
      const cw = stabilizeWidths(child)
      childSequentSum += cw.sequent
      childSubtreeSum += cw.subtree
    }
  }
  const totalGap = Math.max(0, count - 1) * gap

  const lineWidth = Math.ceil(
    Math.max(sequentWidth, childSequentSum + totalGap) + LINE_PAD * 2,
  )
  if (inference) {
    inference.style.width = `${lineWidth}px`
    inference.style.alignSelf = 'center'
  }

  const subtreeWidth = Math.ceil(
    Math.max(lineWidth, childSubtreeSum + totalGap),
  )
  node.style.width = `${subtreeWidth}px`

  return { sequent: sequentWidth, subtree: subtreeWidth }
}

export const layoutTree = (
  root: HTMLElement,
  opts: { skipActiveScroll?: boolean } = {},
): void => {
  stabilizeWidths(root)
  if (opts.skipActiveScroll === true) return
  const active = root.querySelector('.tree-active') as HTMLElement | null
  if (active) {
    active.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    })
  }
}
