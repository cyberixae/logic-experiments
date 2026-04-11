import { parseEvent } from './event'
import { Focus } from './focus'
import { isProof } from '../model/derivation'
import { basic, fromDerivation, fromFocus, fromSequent } from '../render/print'
import { of, type Segments } from '../render/segment'
import { activeSequent, applicableRules } from './focus'
import { isRuleId } from '../model/rule'
import { split } from '../utils/string'
import { rules } from '../rules'
import { helpSystems, isHelpSystemId, renderSystemHelp } from '../help'
import { Workspace } from './workspace'
import { Configuration } from '../model/challenge'
import { AnySequent } from '../model/sequent'

export function* repl<
  K extends string,
  C extends Record<K, Configuration<AnySequent>>,
>(workspace: Workspace<K, C>): Generator<Segments, Segments, string> {
  let output: Segments = [of('\nWelcome!\n\nType "help" for help')]
  while (true) {
    const input = yield [...output, of('\n')]
    const [cmd, ...args] = split(input, ' ')
    switch (cmd) {
      case 'quit':
        return [of('\nExiting...')]
      case 'help': {
        const [arg] = args
        if (arg == null) {
          output = [
            of(
              '\nSystem commands:' +
                '\n  help - display this manual' +
                '\n  help <rule> - display rule description' +
                '\n  systems - list available logic systems' +
                '\n  system <id> - display logic system documentation' +
                '\n  list - list all conjectures' +
                '\n  prev - select previous conjecture' +
                '\n  next - select next conjecture' +
                '\n  undo - undo applied rule in current conjecture' +
                '\n  reset - undo all applied rules of current conjecture' +
                '\n  select <conjecture> - select active conjecture',
            ),
          ]
          break
        }
        if (isRuleId(arg)) {
          output = [
            of(
              '\nRule "' + arg + '":\n\n' + fromDerivation(rules[arg].example),
            ),
          ]
          break
        }
        output = [of('\nUnknown rule "' + arg + '"')]
        break
      }
      case 'systems':
        output = [
          of(
            '\nSystems:\n' +
              Object.values(helpSystems)
                .map((s) => '  ' + s.id + ' - ' + s.name)
                .join('\n'),
          ),
        ]
        break
      case 'system': {
        const [arg] = args
        if (arg == null || !isHelpSystemId(arg)) {
          output = [of('\nUnknown system "' + arg + '"')]
          break
        }
        output = [of('\n' + renderSystemHelp(arg))]
        break
      }
      case 'list':
        output = [
          of(
            '\nConjectures:\n' +
              workspace
                .listConjectures()
                .map(
                  ([id]) => (id === workspace.selected ? '*' : ' ') + ' ' + id,
                )
                .join('\n'),
          ),
        ]
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
          output = [of('\nUnknown conjecture "' + conjectureId + '"')]
          break
        }
        workspace.selectConjecture(conjectureId)
        output = status(workspace.currentConjecture())
        break
      }
      default: {
        const ev = parseEvent(cmd)
        if (!ev) {
          output = [of('\nUnknown command "' + cmd + '"')]
          break
        }
        workspace.applyEvent(ev)
        output = status(workspace.currentConjecture())
      }
    }
  }
}

const status = (s: Focus<AnySequent>): Segments => {
  const rules = applicableRules(s)
  return [
    of('\n'),
    ...fromSequent(activeSequent(s))(basic),
    of('\n\n' + fromFocus(s)),
    of('\nRules: ' + rules.join(', ')),
    of('\nProof: undo, reset'),
    of('\nConjectures: prev, next, select, list'),
    of('\nSystem: quit, help, systems\n'),
    ...(isProof(s.derivation) ? [of('\nConglaturations!\n')] : []),
  ]
}
