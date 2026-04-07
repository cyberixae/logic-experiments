import { AnyDerivation, Path } from '../model/derivation'
import { basic, fromDerivation, fromRuleId, fromSequent } from '../render/print'
import { html } from '../render/segment'
import { RuleId } from '../model/rule'

const equalPaths = (a: Path, b: Path): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i])

const renderSequent = (
  derivation: AnyDerivation,
  ruleIds: ReadonlyArray<RuleId>,
  isActive: boolean,
): HTMLElement => {
  const el = document.createElement('div')
  el.setAttribute('class', 'tree-sequent')
  el.innerHTML = html(
    fromSequent(derivation.result, isActive ? ruleIds : [])(basic),
  )
  return el
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
  currentPath: Path = [],
): HTMLElement => {
  const isActive =
    derivation.kind === 'premise' && equalPaths(currentPath, activePath)

  const node = document.createElement('div')
  node.setAttribute('class', 'tree-node' + (isActive ? ' tree-active' : ''))

  if (derivation.kind === 'transformation') {
    const premises = document.createElement('div')
    premises.setAttribute('class', 'tree-premises')
    derivation.deps.forEach((dep, i) => {
      premises.appendChild(
        renderDerivation(dep, activePath, applicableRules, [...currentPath, i]),
      )
    })
    node.appendChild(premises)
    node.appendChild(renderInferenceLine(derivation.rule))
    node.appendChild(renderSequent(derivation, applicableRules, isActive))
  } else {
    node.appendChild(renderSequent(derivation, applicableRules, isActive))
  }

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

  const lineWidth =
    Math.max(sequentWidth, childSequentSum + totalGap) + LINE_PAD * 2
  if (inference) {
    inference.style.width = `${lineWidth}px`
    inference.style.alignSelf = 'center'
  }

  const subtreeWidth = Math.max(lineWidth, childSubtreeSum + totalGap)
  node.style.width = `${subtreeWidth}px`

  return { sequent: sequentWidth, subtree: subtreeWidth }
}

export const layoutTree = (root: HTMLElement): void => {
  stabilizeWidths(root)
  const active = root.querySelector('.tree-active') as HTMLElement | null
  if (active) {
    active.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    })
  }
}
