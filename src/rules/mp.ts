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
export type MPDeps<Q extends Prop, P extends Prop> = [
  Derivation<Conclusion<Implication<P, Q>>>,
  Derivation<Conclusion<P>>,
]
export type AnyMPDeps = MPDeps<Prop, Prop>
export type MP<
  Q extends Prop,
  P extends Prop,
  C extends MPResult<Q>,
  D extends MPDeps<Q, P>,
> = Transformation<C, D, 'MP'>
export type AnyMP = MP<Prop, Prop, AnyMPResult, AnyMPDeps>
export const mp = <
  Q extends Prop,
  P extends Prop,
  C extends MPResult<Q>,
  D extends MPDeps<Q, P>,
>(
  result: C,
  deps: D,
): MP<Q, P, C, D> => transformation(result, deps, 'MP')
export const applyMP = <A extends Prop, C extends Prop, D extends MPDeps<C, A>>(
  ...deps: D & MPDeps<C, A>
): MP<C, A, MPResult<C>, D> => {
  const [dep1, dep2] = deps
  const a1: A = dep1.result.succedent[0].antecedent
  const a2: A = dep2.result.succedent[0]
  const _a: A = utils.assertEqual(a1, a2)
  const c: C = dep1.result.succedent[0].consequent
  return transformation(conclusion(c), deps, 'MP')
}
export const reverseMP = <
  Q extends Prop,
  P extends Prop,
  C extends MPResult<Q>,
>(
  d: Derivation<C>,
  p: P,
): MP<Q, P, C, MPDeps<Q, P>> => {
  const q: Q = head.head(d.result.succedent)
  const piq: Implication<P, Q> = implication(p, q)
  return mp(d.result, [premise(conclusion(piq)), premise(conclusion(p))])
}
export const tryReverseMP =
  (p: Prop) =>
  <C extends AnySequent>(d: Derivation<C>): Derivation<C> | null => {
    return isMPResultDerivation(d) ? reverseMP(d, p) : null
  }
export const exampleMP = applyMP(
  premise(conclusion(implication(atom('A'), atom('B')))),
  premise(conclusion(atom('A'))),
)

export const ruleMP = {
  id: 'mp',
  isResult: isMPResult,
  isResultDerivation: isMPResultDerivation,
  make: mp,
  apply: applyMP,
  reverse: reverseMP,
  tryReverse: tryReverseMP,
  example: exampleMP,
} satisfies Rule<AnyMPResult>
