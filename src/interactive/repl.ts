import { parseEvent } from './event'
import { Focus } from './focus'
import { isProof } from '../model/derivation'
import { fromDerivation, fromFocus } from '../render/print'
import { applicableRules } from './focus'
import { isRuleId } from '../model/rule'
import { split } from '../utils/string'
import { rules } from '../rules'
import { Workspace } from './workspace'
import { Configuration } from '../model/challenge'
import { AnySequent } from '../model/sequent'

export function* repl<
  K extends string,
  C extends Record<K, Configuration<AnySequent>>,
>(workspace: Workspace<K, C>): Generator<string, string, string> {
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
        if (arg == null) {
          output =
            '\nSystem commands:' +
            '\n  help - display this manual' +
            '\n  help <rule> - display rule description' +
            '\n  list - list all conjectures' +
            '\n  prev - select previous conjecture' +
            '\n  next - select next conjecture' +
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
        output = '\nUnknown rule "' + arg + '"'
        break
      }
      case 'list':
        output =
          '\nConjectures:' +
          '\n' +
          workspace
            .listConjectures()
            .map(([id]) => (id === workspace.selected ? '*' : ' ') + ' ' + id)
            .join('\n')
        break
      case 'prev':
        workspace.selectConjecture(workspace.previousConjectureId())
        output = status(workspace.currentConjecture())
        break
      case 'next':
        workspace.selectConjecture(workspace.nextConjectureId())
        output = status(workspace.currentConjecture())
        break
      case 'select': {
        const [conjectureId] = args
        if (!workspace.isConjectureId(conjectureId)) {
          output = '\nUnknown conjecture "' + conjectureId + '"'
          break
        }
        workspace.selectConjecture(conjectureId)
        output = status(workspace.currentConjecture())
        break
      }
      default: {
        const ev = parseEvent(cmd)
        if (!ev) {
          output = '\nUnknown command "' + cmd + '"'
          break
        }
        workspace.applyEvent(ev)
        output = status(workspace.currentConjecture())
      }
    }
  }
}
const status = (s: Focus<AnySequent>): string =>
  '\n' +
  fromFocus(s) +
  '\nRules: ' +
  applicableRules(s).join(', ') +
  '\nProof: undo, reset' +
  '\nConjectures: prev, next, select, list' +
  '\nSystem: quit, help' +
  '\n' +
  (isProof(s.derivation) ? '\nConglaturations!\n' : '')
