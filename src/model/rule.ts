import { AnyDerivation, Derivation } from './derivation'
import { AnySequent } from './sequent'
import { Refinement } from '../utils/generic'
import { Prop } from './prop'

type TryReverse0 = <J extends AnySequent>(d: Derivation<J>) => Derivation<J> | null
type TryReverse1 = (p: Prop) => TryReverse0
type TryReverse = TryReverse0 | TryReverse1

export interface Rule<R extends AnySequent> {
  isResult: Refinement<AnySequent, R>
  isResultDerivation: Refinement<AnyDerivation, Derivation<R>>
  make: unknown
  apply: unknown
  reverse: unknown
  tryReverse: TryReverse
  example: Derivation<R>
}
