import { refineDerivation, Transformation, Derivation, transformation, AnyDerivation, premise } from '../model/derivation';
import { Prop, Implication, isImplication, implication, atom } from '../model/prop';
import { Formulas, Sequent, AnySequent, refineActiveR, sequent } from '../model/sequent';
import { Refinement } from '../utils/generic';
import * as tuple from '../utils/tuple';
import { IResult } from './i';
import { Rule } from '../model/rule';


export type IRResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas
> = Sequent<Γ, [Implication<A, B>, ...Δ]>;
export type AnyIRResult = IRResult<Formulas, Prop, Prop, Formulas>;
export const isIRResult: Refinement<AnySequent, AnyIRResult> = refineActiveR(isImplication);
export const isIRResultDerivation = refineDerivation(isIRResult);
export type IR<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends IRResult<Γ, A, B, Δ>
> = Transformation<R, [Derivation<Sequent<[...Γ, A], [B, ...Δ]>>], 'ir'>;
export type AnyIR = IR<Formulas, Prop, Prop, Formulas, AnyIRResult>;
export const ir = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends IRResult<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A], [B, ...Δ]>>]
): IR<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'ir');
};
export type ApplyIR<S extends AnyDerivation> = S extends Derivation<
  Sequent<
    [...infer Γ extends Formulas, infer A extends Prop], [infer B extends Prop, ...infer Δ extends Formulas]
  >
> ? IR<Γ, A, B, Δ, IRResult<Γ, A, B, Δ>> : never;
export const applyIR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[...Γ, A], [B, ...Δ]>>
): ApplyIR<Derivation<Sequent<[...Γ, A], [B, ...Δ]>>> => {
  const γ: Γ = tuple.init(s.result.antecedent);
  const a: A = tuple.last(s.result.antecedent);
  const b: B = tuple.head(s.result.succedent);
  const δ: Δ = tuple.tail(s.result.succedent);
  return ir(sequent(γ, [implication(a, b), ...δ]), [s]);
};
export const reverseIR = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends IRResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>
): IR<Γ, A, B, Δ, R> => {
  const γ: Γ = p.result.antecedent;
  const aib: Implication<A, B> = tuple.head(p.result.succedent);
  const a: A = aib.antecedent;
  const b: B = aib.consequent;
  const δ: Δ = tuple.tail(p.result.succedent);
  return ir(p.result, [premise(sequent([...γ, a], [b, ...δ]))]);
};
export const tryReverseIR = <J extends AnySequent>(
  d: Derivation<J>
): Derivation<J> | null => {
  return isIRResultDerivation(d) ? reverseIR(d) : null;
};
export const exampleIR = applyIR(
  premise(sequent([atom('Γ'), atom('A')], [atom('B'), atom('Δ')]))
);

export const ruleIR = {
  isResult: isIRResult,
  isResultDerivation: isIRResultDerivation,
  make: ir,
  apply: applyIR,
  reverse: reverseIR,
  tryReverse: tryReverseIR,
  example: exampleIR,
} satisfies Rule<AnyIRResult>
