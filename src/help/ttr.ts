import { alpha, name } from '../systems/ttr'
import { ruleV } from '../rules/v'
import { ruleTSW } from '../rules/tsw'
import { ruleTSWA } from '../rules/tswa'
import { ruleTSWBA } from '../rules/tswba'
import { ruleTSWP } from '../rules/tswp'
import { ruleTSWQ } from '../rules/tswq'
import { ruleTSWPP } from '../rules/tswpp'
import { ruleTSWPQ } from '../rules/tswpq'
import { ruleTSWQP } from '../rules/tswqp'
import { ruleTSWQQ } from '../rules/tswqq'
import { ruleTC } from '../rules/tc'
import { ruleTD } from '../rules/td'

export const meta = {
  name,
  propositions: [
    {
      title: 'Atoms',
      examples: [[alpha('p'), alpha('q'), alpha('r'), alpha('s')]],
    },
  ],
  rules: [
    {
      title: 'Axiom',
      examples: [[ruleV.example]],
    },
    {
      title: 'Structural',
      examples: [
        [ruleTSW.example],
        [ruleTSWA.example],
        [ruleTSWBA.example],
        [ruleTSWP.example, ruleTSWQ.example],
        [ruleTSWPP.example, ruleTSWPQ.example],
        [ruleTSWQP.example, ruleTSWQQ.example],
      ],
    },
    {
      title: 'Logical',
      examples: [[ruleTC.example, ruleTD.example]],
    },
  ],
} as const

export const exampleProof = ruleV.apply()
