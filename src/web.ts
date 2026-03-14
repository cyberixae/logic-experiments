import {
  Event,
  Next,
  parseEvent,
  Prev,
  Reset,
  Reverse,
  reverse,
  Undo,
} from './interactive/event'
import {
  focus,
  applyEvent,
  Focus,
  activePath,
  next,
  undo,
  prev,
  reset,
} from './interactive/focus'
import { premise, isProof, lsDerivation } from './model/derivation'
import { AnySequent } from './model/sequent'
import { fromDerivation, fromFocus } from './render/print'
import {
  isRev,
  Rev,
  revs,
} from './systems/lk'
import { exampleSXR } from './rules/sxr'
import { exampleSXL } from './rules/sxl'
import { exampleSRotRB } from './rules/srotrb'
import { exampleSRotRF } from './rules/srotrf'
import { exampleSRotLB } from './rules/srotlb'
import { exampleSRotLF } from './rules/srotlf'
import { exampleSCR } from './rules/scr'
import { exampleSCL } from './rules/scl'
import { exampleSWR } from './rules/swr'
import { exampleSWL } from './rules/swl'
import { exampleNR } from './rules/nr'
import { exampleNL } from './rules/nl'
import { exampleIR } from './rules/ir'
import { exampleIL } from './rules/il'
import { exampleCR } from './rules/cr'
import { exampleDL } from './rules/dl'
import { exampleDR2 } from './rules/dr2'
import { exampleCL2 } from './rules/cl2'
import { exampleDR1 } from './rules/dr1'
import { exampleCL1 } from './rules/cl1'
import { exampleI } from './rules/i'
import { head } from './utils/tuple'
import { split } from './utils/string'
import { Theorems, theorems, isTheoremKey } from './challenges'

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
  //sxl: fromDerivation(exampleSXL), not relevant for reverse
  sRotLB: fromDerivation(exampleSRotLB),
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
  //sxr: fromDerivation(exampleSXR), not relevant for reverse
  sRotRB: fromDerivation(exampleSRotRB),
  sRotRF: fromDerivation(exampleSRotRF),
}

const controls = ['prev', 'undo', 'reset', 'level', 'next']

type Workspace = Partial<{ [K in keyof Theorems]: Focus<Theorems[K]['goal']> }>
const workspace: Workspace = {}
let selected: keyof Workspace | null = null
let isDone = false

const status = (s: Focus<AnySequent>): string => '\n' + fromFocus(s) + '\n'

const listing = () => {
  const shroud = document.createElement('div')
  shroud.onclick = (click) => {
    click.preventDefault()
    shroud.setAttribute('style', 'display: none;')
  }
  shroud.setAttribute('class', 'shroud')
  shroud.setAttribute('style', 'display: none;')
  shroud.setAttribute('id', 'levelmenu')
  const panel = document.createElement('div')
  panel.onclick = (click) => {
    // prevent shroud click
    click.preventDefault()
    return false
  }
  const close = document.createElement('a')
  close.setAttribute('class', 'close')
  close.innerHTML = '\u2716'
  close.onclick = (click) => {
    click.preventDefault()
    shroud.setAttribute('style', 'display: none;')
  }
  panel.appendChild(close)
  panel.setAttribute('class', 'levels')
  Object.keys(theorems).forEach((id) => {
    const item = document.createElement('div')
    const link = document.createElement('a')
    link.setAttribute('class', id === selected ? 'active' : '')
    link.setAttribute('href', '#')
    link.onclick = (click) => {
      click.preventDefault()
      selectLevel(id as keyof Workspace)
    }
    link.innerHTML = id
    item.appendChild(link)
    panel.appendChild(item)
  })
  shroud.appendChild(panel)
  return shroud
}
const level = <J extends AnySequent>(s: Focus<J>) => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'playarea')
  if (isDone) {
    const congrats = document.createElement('div')
    congrats.setAttribute('class', 'congrats')
    const hurray = document.createElement('div')
    hurray.setAttribute('class', 'hurray')
    hurray.innerHTML = '\n\n\u{1F389} Conglaturations! \u{1F389}\n'
    congrats.appendChild(hurray)
    const congratsButtons = document.createElement('div')
    congratsButtons.setAttribute('class', 'congrabuttons')
    const previousButton = document.createElement('div')
    previousButton.setAttribute('class', 'button')
    previousButton.innerHTML = 'Prev Level'
    previousButton.onclick = () => prevLevel()
    congratsButtons.appendChild(previousButton)
    const againbutton = document.createElement('div')
    againbutton.setAttribute('class', 'button')
    againbutton.innerHTML = 'Play Again'
    againbutton.onclick = resetHandler()
    congratsButtons.appendChild(againbutton)
    const continueButton = document.createElement('div')
    continueButton.setAttribute('class', 'button')
    continueButton.innerHTML = 'Next Level'
    continueButton.onclick = () => nextLevel()
    congratsButtons.appendChild(continueButton)
    panel.appendChild(congrats)
    panel.appendChild(congratsButtons)
  }
  const pre = document.createElement('pre')
  pre.setAttribute('class', 'status')
  pre.innerHTML = status(s)
  panel.appendChild(pre)
  return panel
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
  const menu = document.getElementById('levelmenu')
  menu?.removeAttribute('style')
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
const control = <J extends AnySequent>(s: Focus<J>) => {
  const path = activePath(s)
  const panel = document.createElement('div')
  panel.setAttribute('class', 'controls')
  controls.forEach((key) => {
    const disabled = !(
      key === 'level' ||
      (['undo', 'reset'].includes(key) && path.length > 0) ||
      (['next', 'prev'].includes(key) && lsDerivation(s.derivation).length > 1)
    )
    const pre = document.createElement('pre')
    pre.setAttribute('class', 'button' + (disabled ? ' disabled' : ''))
    if (!disabled) {
      switch (key) {
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
const bench = <J extends AnySequent>(s: Focus<J>, rules: Array<Rev>) => {
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
  history.pushState({ selected }, '', `?level=${selected}`)
  render()
}

type TKey = keyof Theorems

const theoremKeys: Array<TKey> = Object.keys(theorems) as Array<
  TKey
>
const first: TKey = theoremKeys.at(0) as TKey
const last: TKey = theoremKeys.at(-1) as TKey

const currentLevelIndex = (): number => {
  if (!selected) {
    return 0
  }
  const index = theoremKeys.findIndex((x) => x === selected)
  if (index < 0) {
    return 0
  }
  return index
}

const prevLevelId = (): keyof Theorems => {
  const index = currentLevelIndex()
  return theoremKeys[index - 1] ?? last
}
const prevLevel = () => {
  selectLevel(prevLevelId())
}
const nextLevelId = (): keyof Theorems => {
  const index = currentLevelIndex()
  return theoremKeys[index + 1] ?? first
}
const nextLevel = () => {
  selectLevel(nextLevelId())
}

const init = () => {
  const params = new URLSearchParams(window.location.search)
  const level = params.get('level')
  if (level && isTheoremKey(level)) {
    selectLevel(level)
  } else {
    nextLevel()
  }
}

document.addEventListener('DOMContentLoaded', init)

window.addEventListener('popstate', (event) => {
  const level = event.state?.selected
  if (level && isTheoremKey(level)) {
    selectLevel(level)
  }
  render()
})