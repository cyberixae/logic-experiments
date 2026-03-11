import { Event, Next, parseEvent, Prev, Reset, Reverse, reverse, Undo } from './interactive/event'
import { focus, applyEvent, Focus, activePath, next, undo, prev, reset } from './interactive/focus'
import { premise, isProof, lsDerivation } from './model/derivation'
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
    'reset',
    'level',
    'next',
]

type Workspace = Partial<{ [K in keyof Theorems]: Focus<Theorems[K]['goal']> }>
const workspace: Workspace = {}
let selected: keyof Workspace | null = null
let isDone = false

const status = (s: Focus<AnyJudgement>): string =>
  '\n' +
  fromFocus(s) +
  '\n' +
  (isDone ? '\n\n\u{1F389} Conglaturations! \u{1F389}\n' : '')

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

const ruleHandler = (ev: Reverse<Rev>) => () => {
  if (!selected) {
    return
  }
  const cursor = workspace[selected]
  if (!cursor) {
    return
  }
  const update = applyEvent(cursor, ev)
  workspace[selected] = update
  render()
}
const undoHandler = (_ev?: Undo) => () => {
  if (!selected) {
    return
  }
  const cursor = workspace[selected]
  if (!cursor) {
    return
  }
  const update = undo(cursor)
  workspace[selected] = update
  render()
}

const nextHandler = (_ev?: Next) => () => {
  if (!selected) {
    return
  }
  const cursor = workspace[selected]
  if (!cursor) {
    return
  }
  const update = next(cursor)
  workspace[selected] = update
  render()
}

const prevHandler = (_ev?: Prev) => () => {
  if (!selected) {
    return
  }
  const cursor = workspace[selected]
  if (!cursor) {
    return
  }
  const update = prev(cursor)
  workspace[selected] = update
  render()
}

const resetHandler = (_ev?: Reset) => () => {
  if (!selected) {
    return
  }
  const cursor = workspace[selected]
  if (!cursor) {
    return
  }
  const update = reset(cursor)
  workspace[selected] = update
  render()
}
const levelHandler = (_ev?: Reset) => () => {
  alert('Tämä ei vielä toimi.')
}


const mainPanel = (ls: Array<Rev>, rules: Array<Rev>) => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'main')
  Object.entries(main).forEach(([key, schem]) => {
    if (rules.includes(key as Rev)) {
      const pre = document.createElement('pre')
      const disabled = isDone || !ls.includes(key as Rev)
      pre.setAttribute('class', 'rule button' + (disabled ? ' disabled' : ''))
      if (!disabled) {
        pre.onclick = ruleHandler(reverse(key as Rev))
      }
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
      const disabled = isDone || !ls.includes(key as Rev)
      pre.setAttribute('class', 'rule button' + (disabled ? ' disabled' : ''))
      if (!disabled) {
        pre.onclick = ruleHandler(reverse(key as Rev))
      }
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
      const disabled = isDone || !ls.includes(key as Rev)
      if (!disabled) {
        pre.onclick = ruleHandler(reverse(key as Rev))
      }
      pre.setAttribute('class', 'rule button' + (disabled ? ' disabled' : ''))
      pre.innerHTML = schem
      panel.appendChild(pre)
    }
  })
  return panel
}
const control = <J extends AnyJudgement>(s: Focus<J>) => {
  const path = activePath(s)
  const panel = document.createElement('div')
  panel.setAttribute('class', 'controls')
  controls.forEach((key) => {
    const disabled = !(key === 'level' || (['undo', 'reset'].includes(key) && path.length > 0) || (['next', 'prev'].includes(key) && lsDerivation(s.derivation).length > 1))
    const pre = document.createElement('pre')
    pre.setAttribute('class', 'button' + (disabled ? ' disabled' : ''))
      if (!disabled) {
        switch(key) {
          case 'undo':
            pre.onclick = undoHandler()
          break
          case 'reset':
            pre.onclick = resetHandler()
          break
          case 'prev':
            pre.onclick = prevHandler()
          break
          case 'next':
            pre.onclick = nextHandler()
          break
          case 'level':
            pre.onclick = levelHandler()
          break
        }
      }
    pre.innerHTML = key
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

const render = () => {
  if (!selected) {
    return
  }
  const current = workspace[selected]
  if (!current) {
    return
  }
  const body = document.getElementById('body')
  if (!body) {
    return
  }
  body.innerHTML = ''
  isDone = isProof(current.derivation)
  body.appendChild(listing())
  body.appendChild(bench(current, theorems[selected].rules))
}

const selectLevel = (conjectureId: keyof Theorems) => {
  if (!(conjectureId in workspace)) {
    workspace[conjectureId] = focus(premise(theorems[conjectureId].goal))
  }
  selected = conjectureId
  render()
}

const init = () => {
  //selectLevel('syaaniPaprikaKettu')
  selectLevel('harmaaPuolukkaTiikeri')
}

document.addEventListener('DOMContentLoaded', init)
