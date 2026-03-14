import { refineDerivation, Transformation, Derivation, transformation, AnyDerivation, premise } from '../model/derivation';
import { Prop, Conjunction, isConjunction, conjunction, atom } from '../model/prop';
import { Formulas, Sequent, AnySequent, refineActiveL, sequent } from '../model/sequent';
import { Refinement } from '../utils/generic';
import * as tuple from '../utils/tuple';

export type CLResult<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas
> = Sequent<[...Γ, Conjunction<A, B>], Δ>;
export type AnyCLResult = CLResult<Formulas, Prop, Prop, Formulas>;
export const isCLResult: Refinement<AnySequent, AnyCLResult> = refineActiveL(isConjunction);
export const isCLResultDerivation = refineDerivation(isCLResult);
export type CL<
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CLResult<Γ, A, B, Δ>
> = Transformation<R, [Derivation<Sequent<[...Γ, A, B], Δ>>], 'cl'>;
export type AnyCL = CL<Formulas, Prop, Prop, Formulas, AnyCLResult>;
export const cl = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CLResult<Γ, A, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A, B], Δ>>]
): CL<Γ, A, B, Δ, R> => {
  return transformation(result, deps, 'cl');
};
export type ApplyCL<S extends AnyDerivation> = S extends Derivation<
  Sequent<[...infer Γ extends Formulas, infer A extends Prop, infer B extends Prop], infer Δ>
> ? CL<Γ, A, B, Δ, CLResult<Γ, A, B, Δ>> : never;
export const applyCL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[...Γ, A, B], Δ>>
): ApplyCL<Derivation<Sequent<[...Γ, A, B], Δ>>> => {
  const γ: Γ = tuple.init(tuple.init(s.result.antecedent));
  const a: A = tuple.last(tuple.init(s.result.antecedent));
  const b: B = tuple.last(s.result.antecedent);
  const δ: Δ = s.result.succedent;
  return cl(sequent([...γ, conjunction(a, b)], δ), [s]);
};
export const reverseCL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends CLResult<Γ, A, B, Δ>,
>(
  p: Derivation<R>
): CL<Γ, A, B, Δ, R> => {
  const γ: Γ = tuple.init(p.result.antecedent);
  const acb: Conjunction<A, B> = tuple.last(p.result.antecedent);
  const a: A = acb.leftConjunct;
  const b: B = acb.rightConjunct;
  const δ: Δ = p.result.succedent;
  return cl(p.result, [premise(sequent([...γ, a, b], δ))]);
};
export const tryReverseCL = <J extends AnySequent>(
  d: Derivation<J>
): Derivation<J> | null => {
  return isCLResultDerivation(d) ? reverseCL(d) : null;
};
export const exampleCL = applyCL(
  premise(sequent([atom('Γ'), atom('A'), atom('B')], [atom('Δ')]))
);
