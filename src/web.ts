import { reverse0, undo, reset } from './interactive/event'
import { Focus, activePath, activeSequent } from './interactive/focus'

import { AnySequent } from './model/sequent'
import {
  basic,
  fromDerivation,
  fromFocus,
  fromRule,
  fromSequent,
} from './render/print'
import { RuleId } from './model/rule'
import { challenges, isTheoremKey } from './challenges'
import {
  center,
  isReverseId0,
  left,
  leftLogical,
  right,
  rightLogical,
} from './rules'
import { entries, keys } from './utils/record'
import { Workspace } from './interactive/workspace'
import { repl } from './interactive/repl'
import { Action } from './interactive/action'

const controls = ['undo', 'reset', 'level'] as const

const workspace = new Workspace(challenges)

const proof = (s: Focus<AnySequent>) => {
  const pre = document.createElement('pre')
  pre.setAttribute('class', 'proof')
  if (s.derivation.kind === 'transformation') {
    pre.innerHTML = '\n' + fromFocus(s) + '\n'
  }
  return pre
}

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
  panel.setAttribute('class', 'level-select')
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
  const levels = document.createElement('div')
  levels.setAttribute('class', 'levels')
  workspace.listConjectures().forEach(([id, challenge]) => {
    const item = document.createElement('div')
    item.setAttribute(
      'class',
      'level' + (id === workspace.selected ? ' active' : ''),
    )
    item.onclick = (click) => {
      click.preventDefault()
      selectLevel(id)
    }
    const title = document.createElement('div')
    title.setAttribute('class', 'title')
    title.innerHTML = id
    item.appendChild(title)
    const rules = document.createElement('div')
    rules.setAttribute('class', 'rules')
    rules.innerHTML = challenge.rules
      .map((rule) => fromRule(rule)(basic))
      .join(', ')
    item.appendChild(rules)
    const goal = document.createElement('div')
    goal.setAttribute('class', 'goal')
    goal.innerHTML = fromSequent(challenge.goal)(basic)
    item.appendChild(goal)
    levels.appendChild(item)
  })
  panel.appendChild(levels)
  shroud.appendChild(panel)
  return shroud
}

const congrats = () => {
  const panel = document.createElement('div')
  const banner = document.createElement('div')
  banner.setAttribute('class', 'congrats')
  const hurray = document.createElement('div')
  hurray.setAttribute('class', 'hurray')
  hurray.innerHTML = '\n\n\u{1F389} Conglaturations! \u{1F389}\n'
  banner.appendChild(hurray)
  const congratsButtons = document.createElement('div')
  congratsButtons.setAttribute('class', 'congrabuttons')
  const previousButton = document.createElement('div')
  previousButton.setAttribute('class', 'button')
  previousButton.innerHTML = 'Prev Level'
  previousButton.onclick = () => {
    selectLevel(workspace.previousConjectureId())
  }
  congratsButtons.appendChild(previousButton)
  const againbutton = document.createElement('div')
  againbutton.setAttribute('class', 'button')
  againbutton.innerHTML = 'Play Again'
  againbutton.onclick = () => {
    workspace.applyEvent(reset())
    render()
  }
  congratsButtons.appendChild(againbutton)
  const continueButton = document.createElement('div')
  continueButton.setAttribute('class', 'button')
  continueButton.innerHTML = 'Next Level'
  continueButton.onclick = () => {
    selectLevel(workspace.nextConjectureId())
  }
  congratsButtons.appendChild(continueButton)
  panel.appendChild(banner)
  panel.appendChild(congratsButtons)
  return panel
}

const current = <J extends AnySequent>(s: Focus<J>) => {
  if (workspace.isSolved()) {
    return congrats()
  }
  const active = document.createElement('div')
  active.setAttribute('class', 'current')
  const sequent = activeSequent(s)
  active.innerHTML = fromSequent(sequent)(basic)
  return active
}

const playArea = <J extends AnySequent>(s: Focus<J>) => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'playarea')
  panel.appendChild(current(s))
  panel.appendChild(proof(s))
  return panel
}

const levelHandler = () => {
  const menu = document.getElementById('levelmenu')
  menu?.removeAttribute('style')
}

const mainPanel = (ls: Array<RuleId>, rules: Array<RuleId>) => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'main')

  entries(center).forEach(([key, rule]) => {
    if (rules.includes(key)) {
      const pre = document.createElement('pre')
      const disabled = workspace.isSolved() || !ls.includes(key)
      pre.setAttribute('class', 'rule button' + (disabled ? ' disabled' : ''))
      if (!disabled) {
        pre.onclick = () => {
          if (isReverseId0(key)) {
            workspace.applyEvent(reverse0(key))
          }
          render()
        }
      }
      pre.innerHTML = fromDerivation(rule.example)
      panel.appendChild(pre)
    }
  })
  return panel
}
const leftPanel = (ls: Array<RuleId>, rules: Array<RuleId>) => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'left')
  entries(left).forEach(([key, rule]) => {
    if (rules.includes(key)) {
      const pre = document.createElement('pre')
      const disabled = workspace.isSolved() || !ls.includes(key)
      pre.setAttribute('class', 'rule button' + (disabled ? ' disabled' : ''))
      if (!disabled) {
        pre.onclick = () => {
          workspace.applyEvent(reverse0(key))
          render()
        }
      }
      pre.innerHTML = fromDerivation(rule.example)
      panel.appendChild(pre)
    }
  })
  return panel
}
const rightPanel = (ls: Array<RuleId>, rules: Array<RuleId>) => {
  const panel = document.createElement('div')
  panel.setAttribute('class', 'right')
  entries(right).forEach(([key, rule]) => {
    if (rules.includes(key)) {
      const pre = document.createElement('pre')
      const disabled = workspace.isSolved() || !ls.includes(key)
      if (!disabled) {
        pre.onclick = () => {
          workspace.applyEvent(reverse0(key))
          render()
        }
      }
      pre.setAttribute('class', 'rule button' + (disabled ? ' disabled' : ''))
      pre.innerHTML = fromDerivation(rule.example)
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
      (['undo', 'reset'].includes(key) && path.length > 0)
    )
    const pre = document.createElement('pre')
    pre.setAttribute('class', 'button' + (disabled ? ' disabled' : ''))
    if (!disabled) {
      switch (key) {
        case 'undo':
          pre.onclick = () => {
            workspace.applyEvent(undo())
            render()
          }
          break
        case 'reset':
          pre.onclick = () => {
            workspace.applyEvent(reset())
            render()
          }
          break
        case 'level':
          pre.onclick = levelHandler
          break
      }
    }
    pre.innerHTML = key
    panel.appendChild(pre)
  })
  return panel
}
const bench = <J extends AnySequent>(s: Focus<J>, rules: Array<RuleId>) => {
  const ls = workspace.applicableRules()
  const panel = document.createElement('div')
  panel.setAttribute('class', 'bench')
  panel.appendChild(leftPanel(ls, rules))
  panel.appendChild(mainPanel(ls, rules))
  panel.appendChild(rightPanel(ls, rules))
  panel.appendChild(playArea(s))
  panel.appendChild(control(s))
  return panel
}

const render = () => {
  const body = document.getElementById('body')
  if (!body) {
    return
  }
  body.innerHTML = ''
  body.appendChild(listing())
  body.appendChild(
    bench(workspace.currentConjecture(), workspace.availableRules()),
  )
}

const selectLevel = (selected: string) => {
  if (workspace.isConjectureId(selected)) {
    workspace.selectConjecture(selected)
    history.pushState({ selected }, '', `?level=${selected}`)
  }
  render()
}

const init = () => {
  const params = new URLSearchParams(window.location.search)
  const level = params.get('level') ?? ''
  if (workspace.isConjectureId(level)) {
    workspace.selectConjecture(level)
    history.replaceState({ selected: level }, '', `?level=${level}`)
  }
  render()

  const autoRule = (rules: Array<RuleId>) => {
    const available = workspace.applicableRules()
    const [first] = rules.filter((rule) => available.includes(rule))
    if (!first) {
      return
    }
    if (isReverseId0(first)) {
      workspace.applyEvent(reverse0(first))
    }
  }

  const dispatch = (action: Action) => {
    if (workspace.isSolved()) {
      switch (action) {
        case 'leftWeakening':
        case 'rightWeakening':
          workspace.applyEvent(reset())
          break
        case 'axiom':
          workspace.selectConjecture(workspace.nextConjectureId())
          break
        case 'undo':
          workspace.selectConjecture(workspace.previousConjectureId())
          break
      }
    } else {
      switch (action) {
        case 'leftWeakening':
          workspace.applyEvent(reverse0('swl'))
          break
        case 'leftRotateLeft':
          workspace.applyEvent(reverse0('sRotLF'))
          break
        case 'leftRotateRight':
          workspace.applyEvent(reverse0('sRotLB'))
          break
        case 'leftConnective':
          autoRule(keys(leftLogical))
          break
        case 'rightWeakening':
          workspace.applyEvent(reverse0('swr'))
          break
        case 'rightRotateLeft':
          workspace.applyEvent(reverse0('sRotRB'))
          break
        case 'rightRotateRight':
          workspace.applyEvent(reverse0('sRotRF'))
          break
        case 'rightConnective':
          autoRule(keys(rightLogical))
          break
        case 'axiom':
          autoRule(keys(center))
          break
        case 'undo':
          workspace.applyEvent(undo())
          break
      }
    }
    render()
  }

  document.addEventListener('keydown', (ev) => {
    const keyMap: Record<KeyboardEvent['key'], Action> = {
      e: 'leftWeakening',
      s: 'leftRotateLeft',
      f: 'leftRotateRight',
      d: 'leftConnective',
      i: 'rightWeakening',
      j: 'rightRotateLeft',
      l: 'rightRotateRight',
      k: 'rightConnective',
      Enter: 'axiom',
      Backspace: 'undo',
    }
    const action = keyMap[ev.key]
    if (!action) {
      return
    }
    dispatch(action)
  })
}

const gen = repl(workspace)
gen.next('')
;(window as unknown as Record<string, unknown>)['cmd'] = (input: string) => {
  const result = gen.next(input)
  console.log(result.value)
  render()
  return result.done
}

document.addEventListener('DOMContentLoaded', init)

window.addEventListener('popstate', (event) => {
  const level = event.state?.selected
  if (level && isTheoremKey(level)) {
    workspace.selectConjecture(level)
  }
  render()
})
