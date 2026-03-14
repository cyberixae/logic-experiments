import { refineDerivation, Transformation, Derivation, transformation, premise } from '../model/derivation';
import { Prop, atom } from '../model/prop';
import { Formulas, Sequent, AnySequent, sequent } from '../model/sequent';
import { Refinement } from '../utils/generic';
import * as tuple from '../utils/tuple';

export type SCLResult<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas
> = Sequent<[...Γ, A], Δ>;
export type AnySCLResult = SCLResult<Formulas, Prop, Formulas>;
export const isSCLResult: Refinement<AnySequent, AnySCLResult> = (
  s
): s is AnySCLResult => {
  return s.antecedent.length > 0;
};
export const isSCLResultDerivation = refineDerivation(isSCLResult);
export type SCL<
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCLResult<Γ, A, Δ>
> = Transformation<R, [Derivation<Sequent<[...Γ, A, A], Δ>>], 'scl'>;
export type AnySCL = SCL<Formulas, Prop, Formulas, AnySCLResult>;
export const scl = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCLResult<Γ, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A, A], Δ>>]
): SCL<Γ, A, Δ, R> => {
  return transformation(result, deps, 'scl');
};
export type ApplySCL<
  S extends Derivation<Sequent<[...Formulas, Prop, Prop], Formulas>>
> = S extends Derivation<
  Sequent<
    [...infer Γ extends Formulas, infer A extends Prop, infer A extends Prop], infer Δ
  >
> ? SCL<Γ, A, Δ, SCLResult<Γ, A, Δ>> : never;
export const applySCL = <
  Γ extends Formulas,
  Δ extends Formulas,
  A extends Prop,
>(
  s: Derivation<Sequent<[...Γ, A, A], Δ>>
): ApplySCL<Derivation<Sequent<[...Γ, A, A], Δ>>> => {
  const γ: Γ = tuple.init(tuple.init(s.result.antecedent));
  const a: A = tuple.last(s.result.antecedent);
  const δ: Δ = s.result.succedent;
  return scl(sequent([...γ, a], δ), [s]);
};
export const reverseSCL = <
  Γ extends Formulas,
  A extends Prop,
  Δ extends Formulas,
  R extends SCLResult<Γ, A, Δ>,
>(
  p: Derivation<R>
): SCL<Γ, A, Δ, R> => {
  const γ: Γ = tuple.init(p.result.antecedent);
  const a: A = tuple.last(p.result.antecedent);
  const δ: Δ = p.result.succedent;
  return scl(p.result, [premise(sequent([...γ, a, a], δ))]);
};
export const tryReverseSCL = <J extends AnySequent>(
  d: Derivation<J>
): Derivation<J> | null => {
  return isSCLResultDerivation(d) ? reverseSCL(d) : null;
};
export const exampleSCL = applySCL(
  premise(sequent([atom('Γ'), atom('A'), atom('A')], [atom('Δ')]))
);
