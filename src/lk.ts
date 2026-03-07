import { log } from './render/block'
import { isProof, premise } from './model/derivation'
import { AnyJudgement } from './model/judgement'
import { revs } from './systems/lk'
import { activePath, applyEvent, focus, Focus } from './interactive/focus'
import { fromFocus } from './render/print'
import { example } from './theorems/example'
import { parseEvent } from './interactive/event'
import { head } from './utils/tuple'

const status = (s: Focus<AnyJudgement>): string =>
  '\n\n' +
  fromFocus(s) +
  '\n\n' +
  revs(s.derivation, activePath(s)).map(head).join(', ') +
  '\n'

function* repl(goal: AnyJudgement): Generator<string, void, string> {
  let state = focus(premise(goal))
  while (!isProof(state.derivation)) {
    const cmd = yield status(state)
    if (cmd === 'quit') {
      return
    }
    const ev = parseEvent(cmd)
    if (!ev) {
      continue
    }
    state = applyEvent(state, ev)
  }
  yield status(state)
}

const x = repl(example.goal)

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
