import { parseEvent } from './event'
import { focus, applyEvent, Focus, activePath } from './focus'
import { premise, isProof } from '../model/derivation'
import { AnyJudgement } from '../model/judgement'
import { fromFocus } from '../render/print'
import { revs } from '../systems/lk'
import { head } from '../utils/tuple'
import { split } from '../utils/string'
import { Theorems, isTheoremKey } from '../theorems'

type Workspace = Partial<{ [K in keyof Theorems]: Focus<Theorems[K]['goal']> }>

export function* repl(theorems: Theorems): Generator<string, string, string> {
  const workspace: Workspace = {}
  let selected: keyof Workspace | null = null
  let output = '\nWelcome!\n'
  while (true) {
    const input = yield output
    output = ''
    const [cmd, ...args] = split(input, ' ')
    switch (cmd) {
      case 'quit':
        return '\nExiting...\n'
      case 'list':
        output =
          '\nConjectures:' +
          '\n' +
          Object.keys(theorems)
            .map((id) => (id === selected ? '*' : ' ') + ' ' + id)
            .join('\n') +
          '\n'
        break
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
      default:
        const ev = parseEvent(cmd)
        if (!ev) {
          break
        }
        if (!selected) {
          break
        }
        if (!isTheoremKey(selected)) {
          break
        }
        const cursor = workspace[selected]
        if (!cursor) {
          break
        }
        const update = applyEvent(cursor, ev)
        workspace[selected] = update
        output = status(update)
    }
  }
}
const status = (s: Focus<AnyJudgement>): string =>
  '\n' +
  fromFocus(s) +
  '\nReversals: ' +
  revs(s.derivation, activePath(s)).map(head).join(', ') +
  '\nNavigation: prev, next, undo' +
  '\nSystem: quit, list, select' +
  '\n' +
  (isProof(s.derivation) ? '\nConglaturations!\n' : '')
