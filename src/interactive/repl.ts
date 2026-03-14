import { parseEvent } from './event'
import { focus, applyEvent, Focus, activePath } from './focus'
import { premise, isProof } from '../model/derivation'
import { AnySequent } from '../model/sequent'
import { fromDerivation, fromFocus } from '../render/print'
import { isRev, revs } from '../systems/lk'
import { exampleSXR } from '../rules/sxr'
import { exampleSXL } from '../rules/sxl'
import { exampleSRotRB } from '../rules/srotrb'
import { exampleSRotRF } from '../rules/srotrf'
import { exampleSRotLB } from '../rules/srotlb'
import { exampleSRotLF } from '../rules/srotlf'
import { exampleSCR } from '../rules/scr'
import { exampleSCL } from '../rules/scl'
import { exampleSWR } from '../rules/swr'
import { exampleSWL } from '../rules/swl'
import { exampleNR } from '../rules/nr'
import { exampleNL } from '../rules/nl'
import { exampleIR } from '../rules/ir'
import { exampleIL } from '../rules/il'
import { exampleCR } from '../rules/cr'
import { exampleDL } from '../rules/dl'
import { exampleDR2 } from '../rules/dr2'
import { exampleCL2 } from '../rules/cl2'
import { exampleDR1 } from '../rules/dr1'
import { exampleCL1 } from '../rules/cl1'
import { exampleI } from '../rules/i'
import { head } from '../utils/tuple'
import { split } from '../utils/string'
import { Theorems, isTheoremKey } from '../challenges'

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
      case 'help':
        const [rule] = args
        if (!rule) {
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
        if (isRev(rule)) {
          output = '\nRule "' + rule + '":' + '\n' + '\n'
          switch (rule) {
            case 'cl1':
              output += fromDerivation(exampleCL1)
              break
            case 'cl2':
              output += fromDerivation(exampleCL2)
              break
            case 'cr':
              output += fromDerivation(exampleCR)
              break
            case 'dl':
              output += fromDerivation(exampleDL)
              break
            case 'dr1':
              output += fromDerivation(exampleDR1)
              break
            case 'dr2':
              output += fromDerivation(exampleDR2)
              break
            case 'i':
              output += fromDerivation(exampleI)
              break
            case 'il':
              output += fromDerivation(exampleIL)
              break
            case 'ir':
              output += fromDerivation(exampleIR)
              break
            case 'nl':
              output += fromDerivation(exampleNL)
              break
            case 'nr':
              output += fromDerivation(exampleNR)
              break
            case 'sRotLB':
              output += fromDerivation(exampleSRotLB)
              break
            case 'sRotLF':
              output += fromDerivation(exampleSRotLF)
              break
            case 'sRotRB':
              output += fromDerivation(exampleSRotRB)
              break
            case 'sRotRF':
              output += fromDerivation(exampleSRotRF)
              break
            case 'scl':
              output += fromDerivation(exampleSCL)
              break
            case 'scr':
              output += fromDerivation(exampleSCR)
              break
            case 'swl':
              output += fromDerivation(exampleSWL)
              break
            case 'swr':
              output += fromDerivation(exampleSWR)
              break
            case 'sxl':
              output += fromDerivation(exampleSXL)
              break
            case 'sxr':
              output += fromDerivation(exampleSXR)
              break
          }
          break
        }
        break
      case 'list':
        output =
          '\nConjectures:' +
          '\n' +
          Object.keys(theorems)
            .map((id) => (id === selected ? '*' : ' ') + ' ' + id)
            .join('\n')
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
const status = (s: Focus<AnySequent>): string =>
  '\n' +
  fromFocus(s) +
  '\nRules: ' +
  revs(s.derivation, activePath(s)).map(head).join(', ') +
  '\nNavigation: prev, next, undo' +
  '\nSystem: quit, list, select' +
  '\n' +
  (isProof(s.derivation) ? '\nConglaturations!\n' : '')
