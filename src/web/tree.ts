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
import { t } from './i18n'

const equalPaths = (a: Path, b: Path): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i])

const startsWith = (path: Path, prefix: Path): boolean =>
  path.length >= prefix.length && prefix.every((v, i) => v === path[i])

const renderSequent = (
  derivation: AnyDerivation,
  isActive: boolean,
  gaze: GazeMark | null,
  ghost: boolean = false,
): HTMLElement => {
  const el = document.createElement('div')
  el.setAttribute('class', 'tree-sequent' + (ghost ? ' ghost' : ''))
  el.innerHTML = html(
    fromSequent(derivation.result, isActive ? gaze : null)(basic),
  )
  return el
}

const renderInferenceLine = (
  ruleId: RuleId,
  ghost: boolean = false,
): HTMLElement => {
  const container = document.createElement('div')
  container.setAttribute('class', 'tree-inference' + (ghost ? ' ghost' : ''))

  const label = document.createElement('div')
  label.setAttribute('class', 'tree-rule-label')
  label.innerHTML = html(
    fromRuleId(ruleId, t('sideLeft'), t('sideRight'))(basic),
  )
  container.appendChild(label)

  return container
}

export const renderDerivation = (
  derivation: AnyDerivation,
  activePath: Path,
  gaze: GazeMark | null = null,
  currentPath: Path = [],
  ghostPath: Path | null = null,
): HTMLElement => {
  // Ghost: nodes strictly deeper than ghostPath are fully ghost-styled.
  // The node AT ghostPath is the "boundary": its sequent keeps active
  // styling but its inference line and premises are ghost.
  const isGhostBoundary =
    ghostPath !== null && equalPaths(currentPath, ghostPath)
  const isGhostNode =
    ghostPath !== null &&
    currentPath.length > ghostPath.length &&
    startsWith(currentPath, ghostPath)
  const ghost = isGhostBoundary || isGhostNode

  const isActive = equalPaths(currentPath, activePath) || isGhostBoundary
  const isOpenActive =
    isActive && derivation.kind === 'premise' && !isGhostBoundary
  const isClosedActive =
    isActive && derivation.kind === 'transformation' && !isGhostBoundary

  const node = document.createElement('div')
  const cls =
    'tree-node' +
    (isOpenActive ? ' tree-active' : '') +
    (isClosedActive ? ' tree-closed-active' : '') +
    (isGhostBoundary ? ' tree-active' : '') +
    (isGhostNode ? ' ghost-node' : '')
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
        gaze,
        [...currentPath, i],
        ghostPath,
      )
      const childDepth = Number(child.dataset['leafDepth'] ?? '0')
      if (childDepth > maxChildDepth) maxChildDepth = childDepth
      premises.appendChild(child)
    })
    leafDepth = maxChildDepth < 0 ? 0 : maxChildDepth + 1
    node.appendChild(premises)
    node.appendChild(
      renderInferenceLine(derivation.rule, isGhostBoundary || isGhostNode),
    )
    node.appendChild(
      renderSequent(
        derivation,
        isGhostBoundary || isOpenActive,
        isGhostBoundary ? gaze : null,
        isGhostNode,
      ),
    )
  } else {
    node.appendChild(renderSequent(derivation, isOpenActive, gaze, isGhostNode))
  }
  node.dataset['leafDepth'] = String(leafDepth)

  if (currentPath.length === 0) {
    node.addEventListener('copy', (e) => {
      e.preventDefault()
      e.clipboardData?.setData(
        'text/plain',
        fromDerivation(derivation, t('sideLeft'), t('sideRight')),
      )
    })
  }

  return node
}

// Post-order layout matching treeAuto in src/render/block.ts:
// Each child's sequent is centered within its subtree width.  The
// inference line spans from the first child's sequent left edge to the
// last child's sequent right edge.  Only the first and last child's
// centering offsets matter for the span calculation.
type NodeWidths = { sequent: number; subtree: number }

const LINE_PAD = 16 // px of slack on each side of the inference line

const stabilizeWidths = (node: HTMLElement): NodeWidths => {
  const sequent = node.querySelector<HTMLElement>(':scope > .tree-sequent')
  const sequentWidth = sequent ? sequent.getBoundingClientRect().width : 0

  const premises = node.querySelector<HTMLElement>(':scope > .tree-premises')
  const inference = node.querySelector<HTMLElement>(':scope > .tree-inference')

  let childSubtreeSum = 0
  let firstChildPad = 0
  let lastChildPad = 0
  let gap = 0
  let count = 0
  if (premises) {
    const children = Array.from(
      premises.querySelectorAll<HTMLElement>(':scope > *'),
    )
    count = children.length
    gap = parseFloat(getComputedStyle(premises).gap) || 0
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i]
      if (!child) continue
      const cw = stabilizeWidths(child)
      childSubtreeSum += cw.subtree
      const pad = (cw.subtree - cw.sequent) / 2
      if (i === 0) firstChildPad = pad
      lastChildPad = pad
    }
  }
  const totalGap = Math.max(0, count - 1) * gap

  // The content span runs from the first child's sequent left edge to
  // the last child's sequent right edge, accounting for the centering
  // offset within each child's subtree block.
  const contentSpan = childSubtreeSum + totalGap - firstChildPad - lastChildPad
  const lineWidth = Math.ceil(
    Math.max(sequentWidth, contentSpan) + LINE_PAD * 2,
  )

  const premisesWidth = childSubtreeSum + totalGap
  const subtreeWidth = Math.ceil(Math.max(lineWidth, premisesWidth))

  if (inference) {
    inference.style.width = `${lineWidth}px`
    inference.style.alignSelf = 'center'
    // Center the line on the content (sequent edges), not on the node.
    // When children have asymmetric subtree depths the content center
    // differs from the node center by (firstChildPad - lastChildPad)/2.
    const lineShift = (firstChildPad - lastChildPad) / 2
    if (Math.abs(lineShift) > 0.5) {
      inference.style.transform = `translateX(${lineShift}px)`
    }
  }

  node.style.width = `${subtreeWidth}px`

  return { sequent: sequentWidth, subtree: subtreeWidth }
}

export const layoutTree = (
  root: HTMLElement,
  opts: { skipActiveScroll?: boolean } = {},
): void => {
  stabilizeWidths(root)
  if (opts.skipActiveScroll === true) return
  const active = root.querySelector<HTMLElement>('.tree-active')
  if (active) {
    active.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    })
  }
}
