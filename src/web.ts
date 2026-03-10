import { parseEvent } from './interactive/event'
import { focus, applyEvent, Focus, activePath } from './interactive/focus'
import { premise, isProof } from './model/derivation'
import { AnyJudgement } from './model/judgement'
import { fromDerivation, fromFocus } from './render/print'
import {
  exampleCL1,
  exampleCL2,
  exampleCR,
  exampleDL,
  exampleDR1,
  exampleDR2,
  exampleI,
  exampleIL,
  exampleIR,
  exampleNL,
  exampleNR,
  exampleSCL,
  exampleSCR,
  exampleSRotLB,
  exampleSRotLF,
  exampleSRotRB,
  exampleSRotRF,
  exampleSWL,
  exampleSWR,
  exampleSXL,
  exampleSXR,
  isRev,
  Rev,
  revs,
} from './systems/lk'
import { head } from './utils/tuple'
import { split } from './utils/string'
import { Theorems, theorems, isTheoremKey } from './theorems'


const main = {
  i: fromDerivation(exampleI),
}

const left = {
  cl1: fromDerivation(exampleCL1),
  cl2: fromDerivation(exampleCL2),
  dl: fromDerivation(exampleDL),
  il: fromDerivation(exampleIL),
  nl: fromDerivation(exampleNL),
  scl: fromDerivation(exampleSCL),
  swl: fromDerivation(exampleSWL),
  //sxl: fromDerivation(exampleSXL),
  //sRotLB: fromDerivation(exampleSRotLB),
  sRotLF: fromDerivation(exampleSRotLF),
}

const right = {
  dr1: fromDerivation(exampleDR1),
  dr2: fromDerivation(exampleDR2),
  cr: fromDerivation(exampleCR),
  ir: fromDerivation(exampleIR),
  nr: fromDerivation(exampleNR),
  scr: fromDerivation(exampleSCR),
  swr: fromDerivation(exampleSWR),
  //sxr: fromDerivation(exampleSXR),
  //sRotRB: fromDerivation(exampleSRotRB),
  sRotRF: fromDerivation(exampleSRotRF),
}

const controls = [
    'prev',
    'undo',
    'next',
]

type Workspace = Partial<{ [K in keyof Theorems]: Focus<Theorems[K]['goal']> }>
const workspace: Workspace = {}
let selected: keyof Workspace | null = null

/*
export function* repl(theorems: Theorems): Generator<string, string, string> {
      case 'select':
        const [conjectureId] = args
        if (!conjectureId) {
          break
        }
        if (!isTheoremKey(conjectureId)) {
          break
        }
        if (conjectureId in workspace) {
          const pickled = workspace[conjectureId]
          if (!pickled) {
            break
          }
          selected = conjectureId
          output = status(pickled)
          break
        }
        const fresh = focus(premise(theorems[conjectureId].goal))
        workspace[conjectureId] = fresh
        selected = conjectureId
        output = status(fresh)
        break
    }
  }
}
*/

const status = (s: Focus<AnyJudgement>): string =>
  '\n' +
  fromFocus(s) +
  '\n' +
  (isProof(s.derivation) ? '\nConglaturations!\n' : '')

const listing = () => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'levels')
  Object.keys(theorems).forEach((id) => {
    const item = document.createElement('div')
    const link = document.createElement('a')
    link.setAttribute('class', (id === selected ? 'active' : ''))
    link.setAttribute('href', '#')
    link.innerHTML = id
    item.appendChild(link)
    panel.appendChild(item)
  })
  return panel
}
const level = <J extends AnyJudgement>(s: Focus<J>) => {
  const pre = document.createElement('pre')
  pre.setAttribute('class', 'status')
  pre.innerHTML = status(s)
  return pre
}
const mainPanel = (ls: Array<Rev>, rules: Array<Rev>) => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'main')
  Object.entries(main).forEach(([key, schem]) => {
    if (rules.includes(key as Rev)) {
      const pre = document.createElement('pre')
      const disabled = ls.includes(key as Rev) ? '' : ' disabled'
      pre.setAttribute('class', 'rule button' + disabled)
      pre.innerHTML = schem
      panel.appendChild(pre)
    }
  })
  return panel
}
const leftPanel = (ls: Array<Rev>, rules: Array<Rev>) => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'left')
  Object.entries(left).forEach(([key, schem]) => {
    if (rules.includes(key as Rev)) {
      const pre = document.createElement('pre')
      const disabled = ls.includes(key as Rev) ? '' : ' disabled'
      pre.setAttribute('class', 'rule button' + disabled)
      pre.innerHTML = schem
      panel.appendChild(pre)
    }
  })
  return panel
}
const rightPanel = (ls: Array<Rev>, rules: Array<Rev>) => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'right')
  Object.entries(right).forEach(([key, schem]) => {
    if (rules.includes(key as Rev)) {
      const pre = document.createElement('pre')
      const disabled = ls.includes(key as Rev) ? '' : ' disabled'
      pre.setAttribute('class', 'rule button' + disabled)
      pre.innerHTML = schem
      panel.appendChild(pre)
    }
  })
  return panel
}
const control = <J extends AnyJudgement>(s: Focus<J>) => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'controls')
  Object.entries(controls).forEach(([key, schem]) => {
    const pre = document.createElement('pre')
    pre.setAttribute('class', 'button' + ' disabled')
    pre.innerHTML = schem
    panel.appendChild(pre)
  })
  return panel
}
const bench = <J extends AnyJudgement>(s: Focus<J>, rules: Array<Rev>) => {
  const ls = revs(s.derivation, activePath(s)).map(head)
  const panel = document.createElement('div')
  panel.setAttribute('class', 'bench')
  panel.appendChild(leftPanel(ls, rules))
  panel.appendChild(mainPanel(ls, rules))
  panel.appendChild(rightPanel(ls, rules))
  panel.appendChild(level(s))
  panel.appendChild(control(s))
  return panel
}

const init = () => {
  const body = document.getElementById('body')
  if (!body) {
    return
  }
  //const conjectureId = 'syaaniPaprikaKettu'
  const conjectureId = 'harmaaPuolukkaTiikeri'
  if (!conjectureId) {
    return
  }
  const fresh = focus(premise(theorems[conjectureId].goal))
  workspace[conjectureId] = fresh
  selected = conjectureId
  body.appendChild(listing())
  body.appendChild(bench(fresh, theorems[conjectureId].rules))
}

document.addEventListener('DOMContentLoaded', init)
