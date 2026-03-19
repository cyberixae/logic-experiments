import { parseEvent } from './event'
import { focus, applyEvent, Focus } from './focus'
import { premise, isProof } from '../model/derivation'
import { AnySequent } from '../model/sequent'
import { fromDerivation, fromFocus } from '../render/print'
import { applicableRules } from './focus'
import { isRuleId } from '../model/rule'
import { split } from '../utils/string'
import { Theorems, isTheoremKey } from '../challenges'
import { rules } from '../rules'

type Workspace = Partial<{ [K in keyof Theorems]: Focus<Theorems[K]['goal']> }>

export function* repl(theorems: Theorems): Generator<string, string, string> {
  const workspace: Workspace = {}
  let selected: keyof Workspace | null = null
  let output = '\nWelcome!' + '\n' + '\nType "help" for help'
  while (true) {
    const input = yield output + '\n'
    output = ''
    const [cmd, ...args] = split(input, ' ')
    switch (cmd) {
      case 'quit':
        return '\nExiting...'
      case 'help': {
        const [arg] = args
        if (!arg) {
          output =
            '\nSystem commands:' +
            '\n  help - display this manual' +
            '\n  help <rule> - display rule description' +
            '\n  list - list all conjectures' +
            '\n  prev - change active branch in current conjecture' +
            '\n  next - change active branch in current conjecture' +
            '\n  undo - undo applied rule in current conjecture' +
            '\n  reset - undo all applied rules of current conjecture' +
            '\n  select <conjecture> - select active conjecture'
          break
        }
        if (isRuleId(arg)) {
          output = '\nRule "' + arg + '":' + '\n' + '\n'
          output += fromDerivation(rules[arg].example)
          break
        }
        break
      }
      case 'list':
        output =
          '\nConjectures:' +
          '\n' +
          Object.keys(theorems)
            .map((id) => (id === selected ? '*' : ' ') + ' ' + id)
            .join('\n')
        break
      case 'select': {
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
      default: {
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
}
const status = (s: Focus<AnySequent>): string =>
  '\n' +
  fromFocus(s) +
  '\nRules: ' +
  applicableRules(s).join(', ') +
  '\nNavigation: prev, next, undo' +
  '\nSystem: quit, list, select' +
  '\n' +
  (isProof(s.derivation) ? '\nConglaturations!\n' : '')
