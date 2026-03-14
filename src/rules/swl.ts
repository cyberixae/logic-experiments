import { refineDerivation, Transformation, Derivation, transformation, AnyDerivation, premise } from '../model/derivation';
import { Prop, atom } from '../model/prop';
import { Formulas, Sequent, AnySequent, sequent } from '../model/sequent';
import { Refinement } from '../utils/generic';
import * as tuple from '../utils/tuple';

// Weakening

export type SWLResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas
> = Sequent<[...Γ, A], Δ>;
export type AnySWLResult = SWLResult<Formulas, Prop, Formulas>;
export const isSWLResult: Refinement<AnySequent, AnySWLResult> = (
  s
): s is AnySWLResult => {
  return s.antecedent.length > 0;
};
export const isSWLResultDerivation = refineDerivation(isSWLResult);
export type SWL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWLResult<Γ, A, Δ>
> = Transformation<R, [Derivation<Sequent<Γ, Δ>>], 'swl'>;
export type AnySWL = SWL<Formulas, Prop, Formulas, AnySWLResult>;
export const swl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWLResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<Γ, Δ>>]
): SWL<Γ, A, Δ, R> => {
  return transformation(result, deps, 'swl');
};
export type ApplySWL<A extends Prop, S extends AnyDerivation> = S extends Derivation<Sequent<infer Γ, infer Δ>> ? SWL<Γ, A, Δ, SWLResult<Γ, A, Δ>> : never;
export const applySWL = <
  A extends Prop,
  Γ extends Formulas,
  Δ extends Formulas,
>(
  a: A,
  s: Derivation<Sequent<Γ, Δ>>
): ApplySWL<A, Derivation<Sequent<Γ, Δ>>> => {
  const γ: Γ = s.result.antecedent;
  const δ: Δ = s.result.succedent;
  return swl(sequent([...γ, a], δ), [s]);
};
export const reverseSWL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SWLResult<Γ, A, Δ>,
>(
  p: Derivation<R>
): SWL<Γ, A, Δ, R> => {
  const γ: Γ = tuple.init(p.result.antecedent);
  const δ: Δ = p.result.succedent;
  return swl(p.result, [premise(sequent(γ, δ))]);
};
export const tryReverseSWL = <J extends AnySequent>(
  d: Derivation<J>
): Derivation<J> | null => {
  return isSWLResultDerivation(d) ? reverseSWL(d) : null;
};
export const exampleSWL = applySWL(
  atom('A'),
  premise(sequent([atom('Γ')], [atom('Δ')]))
);
