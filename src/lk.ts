import { log } from './lib/block'
import {
  editDerivation,
  isProof,
  AnyDerivation,
  premise,
  Proof,
  Path,
} from './lib/derivation'
import { AnyJudgement, conclusion } from './lib/judgement'
import { lk, rev } from './systems/lk'
import { activePath, apply, focus, Focus, undo } from './lib/focus'
import { fromFocus } from './lib/print'

type Rev = keyof typeof rev

const list = (d: AnyDerivation, p: Path): Array<Rev> =>
  Object.entries(rev).flatMap(([n, r]): [] | [keyof typeof rev] => {
    if (editDerivation(d, p, r)) {
      return [n as Rev]
    }
    return []
  })

type Level<J extends AnyJudgement> = {
  rules: Array<Rev>
  goal: J
  solution: Proof<J>
}

const level1: Level<AnyJudgement> = {
  rules: Object.keys(rev),
  goal: conclusion(
    lk.o.p2.implication(
      lk.o.p2.implication(
        lk.a('p'),
        lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
      ),
      lk.o.p2.implication(lk.a('p'), lk.a('p')),
    ),
  ),
  solution: lk.z.ir(
    lk.z.swl(
      lk.o.p2.implication(
        lk.a('p'),
        lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))),
      ),
      lk.z.ir(lk.i.i(lk.a('p'))),
    ),
  ),
} as any

const status = (s: Focus<AnyJudgement>): string =>
  '\n\n' +
  fromFocus(s) +
  '\n\n' +
  list(s.derivation, activePath(s)).join(', ') +
  '\n'

export const setGoal = <J extends AnyJudgement>(j: J): Focus<J> =>
  focus(premise(j))

const isRev = (u: unknown): u is Rev => typeof u === 'string' && u in rev

function* repl(l: Level<AnyJudgement>): Generator<string, void, string> {
  let state = setGoal(l.goal)
  while (!isProof(state.derivation)) {
    const cmd = yield status(state)
    const edit = isRev(cmd) ? rev[cmd] : null
    if (!edit) {
      continue
    }
    state = apply(state, edit)
  }
  yield status(state)
}
const x = repl(level1)

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
