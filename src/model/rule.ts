import { AnyDerivation, Derivation } from './derivation';
import { AnySequent } from './sequent';
import { Refinement } from '../utils/generic';

export interface Rule<R extends AnySequent> {
  isResult: Refinement<AnySequent, R>;
  isResultDerivation: Refinement<AnyDerivation, Derivation<R>>;
  make: unknown;
  apply: unknown;
  reverse: unknown;
  tryReverse: <J extends AnySequent>(d: Derivation<J>) => Derivation<J> | null;
  example: Derivation<R>;
}
