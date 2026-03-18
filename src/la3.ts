import { log } from './render/block'
import { equalsDerivation, isProof, premise } from './model/derivation'
import { conclusion } from './model/sequent'
import * as print from './render/print'
import { apply, focus, next } from './interactive/focus'
import { alpha, la3, name } from './systems/la3'
import { ruleMP, tryReverseMP } from './rules/mp'
import { ruleA2, tryReverseA2 } from './rules/a2'
import { ruleA1, tryReverseA1 } from './rules/a1'
import { negation, atom, implication } from './model/prop'
import { ruleA3 } from './rules/a3'

const meta = {
  name,
  propositions: [
    {
      title: 'Variables',
      examples: [
        [
          alpha('p'),
          alpha('q'),
          alpha('r'),
          alpha('s'),
          alpha('t'),
          alpha('u'),
        ],
      ],
    },
    {
      title: 'Connectives',
      examples: [[negation(atom('A')), implication(atom('A'), atom('B'))]],
    },
  ],
  rules: [
    {
      title: 'Axioms',
      examples: [[ruleA1.example, ruleA2.example, ruleA3.example]],
    },
    {
      title: 'Rule',
      examples: [[ruleMP.example]],
    },
  ],
} as const

const usage = () => print.fromMeta(meta)

const goal = conclusion(
  la3.o.p2.implication(
    la3.o.p2.implication(
      la3.a('p'),
      la3.o.p2.implication(la3.a('q'), la3.o.p1.negation(la3.a('p'))),
    ),
    la3.o.p2.implication(la3.a('p'), la3.a('p')),
  ),
)

const proof = la3.z.mp(
  la3.i.a2(
    la3.a('p'),
    la3.o.p2.implication(la3.a('q'), la3.o.p1.negation(la3.a('p'))),
    la3.a('p'),
  ),
  la3.i.a1(
    la3.a('p'),
    la3.o.p2.implication(la3.a('q'), la3.o.p1.negation(la3.a('p'))),
  ),
)

let cursor = focus(premise(goal))
cursor = apply(cursor, (d) =>
  tryReverseMP(
    d,
    la3.o.p2.implication(
      la3.a('p'),
      la3.o.p2.implication(
        la3.o.p2.implication(la3.a('q'), la3.o.p1.negation(la3.a('p'))),
        la3.a('p'),
      ),
    ),
  ),
)
cursor = apply(cursor, tryReverseA2)
cursor = next(cursor)
cursor = apply(cursor, tryReverseA1)
if (
  !cursor ||
  !isProof(cursor.derivation) ||
  !equalsDerivation(cursor.derivation, proof)
) {
  throw cursor
}

log(usage())
log()
log('Sandbox')
log()
log(print.fromDerivation(cursor.derivation))
log()
log()
