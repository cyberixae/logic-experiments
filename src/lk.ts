import { log } from './render/block'
import { editDerivation, AnyDerivation, Path } from './model/derivation'
import { AnyJudgement } from './model/judgement'
import { rev } from './systems/lk'
import { activePath, Focus } from './interactive/focus'
import { fromFocus } from './render/print'
import { level1 } from './Level'
import { search } from './interactive/search'
import * as event from './interactive/event'

export type Rev = keyof typeof rev

const list = (d: AnyDerivation, p: Path): Array<Rev> =>
  Object.entries(rev).flatMap(([n, r]): [] | [keyof typeof rev] => {
    if (editDerivation(d, p, r)) {
      return [n as Rev]
    }
    return []
  })

const status = (s: Focus<AnyJudgement>): string =>
  '\n\n' +
  fromFocus(s) +
  '\n\n' +
  list(s.derivation, activePath(s)).join(', ') +
  '\n'

const isRev = (u: unknown): u is Rev => typeof u === 'string' && u in rev

const parseCommand = (cmd: string): event.Event | null => {
  switch (cmd) {
    case 'next':
      return event.next()
    case 'prev':
      return event.prev()
    case 'undo':
      return event.undo()
    default:
      if (isRev(cmd)) {
        return event.reverse(cmd)
      }
  }
  return null
}

function* repl(goal: AnyJudgement): Generator<string, void, string> {
  const init = search(goal)
  let g = init()
  let state = g.next()
  while (!state.done) {
    const cmd = yield status(state.value)
    if (cmd === 'quit') {
      return
    }
    const parsed = parseCommand(cmd)
    if (!parsed) {
      continue
    }
    state = g.next(parsed)
  }
}

const x = repl(level1.goal)

const test = () =>
  ['', 'ir', 'swl', 'ir', 'i'].map((c) => {
    log()
    if (c) {
      log('> ' + c)
    }
    const ret = x.next(c).value ?? ''
    log(ret)
    log()
  })

test()
