import { refineDerivation, Introduction, introduction, Derivation } from '../model/derivation';
import { Prop, equals, atom } from '../model/prop';
import { Sequent, AnySequent, sequent } from '../model/sequent';
import { Refinement } from '../utils/generic';
import * as tuple from '../utils/tuple';
import { Rule } from '../model/rule';

export type IResult<A extends Prop> = Sequent<[A], [A]>;
export type AnyIResult = IResult<Prop>;
export const isIResult: Refinement<AnySequent, AnyIResult> = (
  s
): s is AnyIResult => {
  return (
    tuple.isTupleOf1(s.antecedent) &&
    tuple.isTupleOf1(s.succedent) &&
    equals(s.antecedent[0], s.succedent[0])
  );
};
export const isIResultDerivation = refineDerivation(isIResult);
export type I<A extends Prop, R extends IResult<A>> = Introduction<R, 'i'>;
export type AnyI = I<Prop, AnyIResult>;
export const i = <A extends Prop, R extends IResult<A>>(result: R): I<A, R> => introduction(result, 'i');
export type ApplyI<A extends Prop> = I<A, IResult<A>>;
export const applyI = <A extends Prop>(a: A): ApplyI<A> => i(sequent([a], [a]));
export const reverseI = <A extends Prop, R extends IResult<A>>(
  p: Derivation<R>
): I<A, R> => {
  return i(p.result);
};
export const tryReverseI = <J extends AnySequent>(
  d: Derivation<J>
): Derivation<J> | null => {
  return isIResultDerivation(d) ? reverseI(d) : null;
};
export const exampleI = applyI(atom('A'));

export const ruleI = {
  isResult: isIResult,
  isResultDerivation: isIResultDerivation,
  make: i,
  apply: applyI,
  reverse: reverseI,
  tryReverse: tryReverseI,
  example: exampleI,
} satisfies Rule<AnyIResult>