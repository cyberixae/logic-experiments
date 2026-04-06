import { AnyDerivation, Path } from '../model/derivation'
import { basic, fromRuleId, fromSequent } from '../render/print'
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
  el.innerHTML = html(fromSequent(derivation.result, isActive ? ruleIds : [])(basic))
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
  const isActive = derivation.kind === 'premise' && equalPaths(currentPath, activePath)

  const node = document.createElement('div')
  node.setAttribute(
    'class',
    'tree-node' + (isActive ? ' tree-active' : ''),
  )

  if (derivation.kind === 'transformation') {
    const premises = document.createElement('div')
    premises.setAttribute('class', 'tree-premises')
    derivation.deps.forEach((dep, i) => {
      premises.appendChild(
        renderDerivation(dep, activePath, applicableRules, [...currentPath, i]),
      )
    })
    node.appendChild(premises)

    const conclusion = document.createElement('div')
    conclusion.setAttribute('class', 'tree-conclusion')
    conclusion.appendChild(renderInferenceLine(derivation.rule))
    conclusion.appendChild(renderSequent(derivation, applicableRules, isActive))
    node.appendChild(conclusion)
  } else {
    node.appendChild(renderSequent(derivation, applicableRules, isActive))
  }

  if (isActive) {
    requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    })
  }

  return node
}
