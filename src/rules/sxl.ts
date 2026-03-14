import { refineDerivation, Transformation, Derivation, transformation, premise } from '../model/derivation';
import { Prop, atom } from '../model/prop';
import { Formulas, Sequent, AnySequent, sequent } from '../model/sequent';
import { Refinement } from '../utils/generic';
import * as tuple from '../utils/tuple';


export type SXLResult<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas
> = Sequent<[...Γ, B, A], Δ>;
export type AnySXLResult = SXLResult<Formulas, Prop, Prop, Formulas>;
export const isSXLResult: Refinement<AnySequent, AnySXLResult> = (
  s
): s is AnySXLResult => {
  return s.antecedent.length > 1;
};
export const isSXLResultDerivation = refineDerivation(isSXLResult);
export type SXL<
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXLResult<Γ, B, A, Δ>
> = Transformation<R, [Derivation<Sequent<[...Γ, A, B], Δ>>], 'sxl'>;
export type AnySXL = SXL<Formulas, Prop, Prop, Formulas, AnySXLResult>;
export const sxl = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
  R extends SXLResult<Γ, B, A, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, A, B], Δ>>]
): SXL<Γ, B, A, Δ, R> => {
  return transformation(result, deps, 'sxl');
};
export type ApplySXL<
  S extends Derivation<Sequent<[...Formulas, Prop, Prop], Formulas>>
> = S extends Derivation<
  Sequent<
    [...infer Γ extends Formulas, infer A extends Prop, infer B extends Prop], infer Δ
  >
> ? SXL<Γ, B, A, Δ, SXLResult<Γ, B, A, Δ>> : never;
export const applySXL = <
  Γ extends Formulas,
  A extends Prop,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[...Γ, A, B], Δ>>
): ApplySXL<Derivation<Sequent<[...Γ, A, B], Δ>>> => {
  const γ: Γ = tuple.init(tuple.init(s.result.antecedent));
  const b: B = tuple.last(s.result.antecedent);
  const a: A = tuple.last(tuple.init(s.result.antecedent));
  const δ: Δ = s.result.succedent;
  return sxl(sequent([...γ, b, a], δ), [s]);
};
export const reverseSXL = <
  Γ extends Formulas,
  B extends Prop,
  A extends Prop,
  Δ extends Formulas,
  R extends SXLResult<Γ, B, A, Δ>,
>(
  p: Derivation<R>
): SXL<Γ, B, A, Δ, R> => {
  const γ: Γ = tuple.init(tuple.init(p.result.antecedent));
  const a: A = tuple.last(p.result.antecedent);
  const b: B = tuple.last(tuple.init(p.result.antecedent));
  const δ: Δ = p.result.succedent;
  return sxl(p.result, [premise(sequent([...γ, a, b], δ))]);
};
export const tryReverseSXL = <J extends AnySequent>(
  d: Derivation<J>
): Derivation<J> | null => {
  return isSXLResultDerivation(d) ? reverseSXL(d) : null;
};
export const exampleSXL = applySXL(
  premise(sequent([atom('Γ'), atom('A'), atom('B')], [atom('Δ')]))
);
