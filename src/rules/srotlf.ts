import { refineDerivation, Transformation, Derivation, transformation, AnyDerivation, premise } from '../model/derivation';
import { Prop, atom } from '../model/prop';
import { Formulas, Sequent, AnySequent, sequent } from '../model/sequent';
import { Refinement } from '../utils/generic';
import * as tuple from '../utils/tuple';

// Permutation

export type SRotLFResult<
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas
> = Sequent<[A, ...Γ, B], Δ>;
export type AnySRotLFResult = SRotLFResult<Prop, Formulas, Prop, Formulas>;
export const isSRotLFResult: Refinement<AnySequent, AnySRotLFResult> = (
  s
): s is AnySRotLFResult => {
  return s.antecedent.length > 1;
};
export const isSRotLFResultDerivation = refineDerivation(isSRotLFResult);
export type SRotLF<
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotLFResult<A, Γ, B, Δ>
> = Transformation<R, [Derivation<Sequent<[...Γ, B, A], Δ>>], 'SRotLF'>;
export type AnySRotLF = SRotLF<Prop, Formulas, Prop, Formulas, AnySRotLFResult>;
export const sRotLF = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotLFResult<A, Γ, B, Δ>,
>(
  result: R,
  deps: [Derivation<Sequent<[...Γ, B, A], Δ>>]
): SRotLF<A, Γ, B, Δ, R> => {
  return transformation(result, deps, 'SRotLF');
};
export type ApplySRotLF<S extends AnyDerivation> = S extends Derivation<
  Sequent<
    [...infer Γ extends Formulas, infer B extends Prop, infer A extends Prop], infer Δ
  >
> ? SRotLF<A, Γ, B, Δ, SRotLFResult<A, Γ, B, Δ>> : never;
export const applySRotLF = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
>(
  s: Derivation<Sequent<[...Γ, B, A], Δ>>
): ApplySRotLF<Derivation<Sequent<[...Γ, B, A], Δ>>> => {
  const γ: Γ = tuple.init(tuple.init(s.result.antecedent));
  const a: A = tuple.last(s.result.antecedent);
  const b: B = tuple.last(tuple.init(s.result.antecedent));
  const δ: Δ = s.result.succedent;
  return sRotLF(sequent([a, ...γ, b], δ), [s]);
};
export const reverseSRotLF = <
  A extends Prop,
  Γ extends Formulas,
  B extends Prop,
  Δ extends Formulas,
  R extends SRotLFResult<A, Γ, B, Δ>,
>(
  p: Derivation<R>
): SRotLF<A, Γ, B, Δ, R> => {
  const γ: Γ = tuple.init(tuple.tail(p.result.antecedent));
  const a: A = tuple.head(p.result.antecedent);
  const b: B = tuple.last(p.result.antecedent);
  const δ: Δ = p.result.succedent;
  return sRotLF(p.result, [premise(sequent([...γ, b, a], δ))]);
};
export const tryReverseSRotLF = <J extends AnySequent>(
  d: Derivation<J>
): Derivation<J> | null => {
  return isSRotLFResultDerivation(d) ? reverseSRotLF(d) : null;
};
export const exampleSRotLF = applySRotLF(
  premise(sequent([atom('Γ'), atom('B'), atom('A')], [atom('Δ')]))
);
