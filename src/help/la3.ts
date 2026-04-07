import { alpha, la3, name } from '../systems/la3'
import { negation, atom, implication } from '../model/prop'
import { ruleMP } from '../rules/mp'
import { ruleA1 } from '../rules/a1'
import { ruleA2 } from '../rules/a2'
import { ruleA3 } from '../rules/a3'

export const meta = {
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

export const exampleProof = la3.z.mp(
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
