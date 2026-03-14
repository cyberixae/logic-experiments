import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import { Prop, Implication, implication, atom } from '../model/prop'
import {
  Conclusion,
  AnyConclusion,
  conclusion,
  AnySequent,
  isConclusion,
} from '../model/sequent'
import { Refinement } from '../utils/generic'
import * as head from '../utils/tuple'
import * as utils from '../utils/utils'
import { Rule } from '../model/rule'

export type MPResult<Q extends Prop> = Conclusion<Q>
export type AnyMPResult = MPResult<Prop>
export const isMPResult: Refinement<AnySequent, AnyMPResult> = (
  j: AnySequent,
): j is AnyMPResult => isConclusion(j)
export const isMPResultDerivation = refineDerivation(isMPResult)
export type MP<
  Q extends Prop,
  P extends Prop,
  C extends MPResult<Q>,
> = Transformation<
  C,
  [Derivation<Conclusion<Implication<P, Q>>>, Derivation<Conclusion<P>>],
  'MP'
>
export type AnyMP = MP<Prop, Prop, AnyMPResult>
export const mp = <Q extends Prop, P extends Prop, C extends MPResult<Q>>(
  result: C,
  deps: [Derivation<Conclusion<Implication<P, Q>>>, Derivation<Conclusion<P>>],
): MP<Q, P, C> => transformation(result, deps, 'MP')
export type ApplyMP<
  S1 extends Derivation<
    Conclusion<Implication<S2['result']['succedent'][0], Prop>>
  >,
  S2 extends Derivation<Conclusion<Prop>>,
> =
  S1 extends Derivation<
    Conclusion<Implication<infer P extends Prop, infer Q extends Prop>>
  >
    ? MP<Q, P, MPResult<Q>>
    : never
export const applyMP = <A extends Prop, C extends Prop>(
  s1: Derivation<Conclusion<Implication<A, C>>>,
  s2: Derivation<Conclusion<A>>,
): ApplyMP<
  Derivation<Conclusion<Implication<A & Prop, C>>>,
  Derivation<Conclusion<A>>
> => {
  const a1: A = s1.result.succedent[0].antecedent
  const a2: A = s2.result.succedent[0]
  const _a: A = utils.assertEqual(a1, a2)
  const c: C = s1.result.succedent[0].consequent
  return transformation(conclusion(c), [s1, s2], 'MP')
}
export const reverseMP = <
  Q extends Prop,
  P extends Prop,
  C extends MPResult<Q>,
>(
  d: Derivation<C>,
  p: P,
): MP<Q, P, C> => {
  const q: Q = head.head(d.result.succedent)
  const piq: Implication<P, Q> = implication(p, q)
  return mp(d.result, [premise(conclusion(piq)), premise(conclusion(p))])
}
export const tryReverseMP = <C extends AnySequent, P extends Prop>(
  d: Derivation<C>,
  p: P,
): Derivation<C> | null => {
  return isMPResultDerivation(d) ? reverseMP(d, p) : null
}
export const exampleMP = applyMP(
  premise(conclusion(implication(atom('A'), atom('B')))),
  premise(conclusion(atom('A'))),
)

export const ruleMP = {
  isResult: isMPResult,
  isResultDerivation: isMPResultDerivation,
  make: mp,
  apply: applyMP,
  reverse: reverseMP,
  tryReverse: tryReverseMP,
  example: exampleMP,
} //satisfies Rule<AnyMPResult>
