import {
  refineDerivation,
  Transformation,
  Derivation,
  transformation,
  premise,
} from '../model/derivation'
import {
  Prop,
  Implication,
  isImplication,
  implication,
  atom,
} from '../model/prop'
import { Sequent, AnySequent, refineActiveR, sequent } from '../model/sequent'
import { Formulas } from '../model/formulas'
import { Refinement } from '../utils/generic'
import * as tuple from '../utils/tuple'
import { Rule } from '../model/rule'

export type IRResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = Sequent<Γ, [Implication<A, B>, ...Δ]>
export type AnyIRResult = IRResult<Formulas, Prop, Prop, Formulas>
export const isIRResult: Refinement<AnySequent, AnyIRResult> =
  refineActiveR(isImplication)
export const isIRResultDerivation = refineDerivation(isIRResult)
export type IRDeps<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
> = [Derivation<Sequent<[...Γ, A], [B, ...Δ]>>]
export type AnyIRDeps = IRDeps<Formulas, Prop, Prop, Formulas>
export type IR<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends IRResult<Γ, A, B, Δ>,
  D extends IRDeps<Γ, A, B, Δ>,
> = Transformation<R, D, 'ir'>
export type AnyIR = IR<Formulas, Prop, Prop, Formulas, AnyIRResult, AnyIRDeps>
export const ir = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends IRResult<Γ, A, B, Δ>,
  D extends IRDeps<Γ, A, B, Δ>,
>(
  result: R,
  deps: D,
): IR<Γ, A, B, Δ, R, D> => {
  return transformation(result, deps, 'ir')
}
export const applyIR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  D extends IRDeps<Γ, A, B, Δ>,
>(
  ...deps: D & IRDeps<Γ, A, B, Δ>
): IR<Γ, A, B, Δ, IRResult<Γ, A, B, Δ>, D> => {
  const [dep] = deps
  const γ: Γ = tuple.init(dep.result.antecedent)
  const a: A = tuple.last(dep.result.antecedent)
  const b: B = tuple.head(dep.result.succedent)
  const δ: Δ = tuple.tail(dep.result.succedent)
  return ir(sequent(γ, [implication(a, b), ...δ]), deps)
}
export const reverseIR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends IRResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>,
): IR<Γ, A, B, Δ, R, IRDeps<Γ, A, B, Δ>> => {
  const γ: Γ = p.result.antecedent
  const aib: Implication<A, B> = tuple.head(p.result.succedent)
  const a: A = aib.antecedent
  const b: B = aib.consequent
  const δ: Δ = tuple.tail(p.result.succedent)
  return ir(p.result, [premise(sequent([...γ, a], [b, ...δ]))])
}
export const tryReverseIR = <J extends AnySequent>(
  d: Derivation<J>,
): Derivation<J> | null => {
  return isIRResultDerivation(d) ? reverseIR(d) : null
}
export const exampleIR = applyIR(
  premise(sequent([atom('Γ'), atom('A')], [atom('B'), atom('Δ')])),
)

export const ruleIR = {
  id: 'ir',
  isResult: isIRResult,
  isResultDerivation: isIRResultDerivation,
  make: ir,
  apply: applyIR,
  reverse: reverseIR,
  tryReverse: tryReverseIR,
  example: exampleIR,
} satisfies Rule<AnyIRResult>
