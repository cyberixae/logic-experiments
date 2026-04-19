import { alpha, name } from '../systems/ttr'
import { ruleTip } from '../rules/tip'
import { ruleTiq } from '../rules/tiq'

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
      title: 'Identity',
      examples: [[ruleTip.example, ruleTiq.example]],
    },
  ],
} as const

export const exampleProof = ruleTip.apply()
