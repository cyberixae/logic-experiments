import { RuleId, Rule } from '../model/rule';
import { AnySequent } from '../model/sequent';
import { ruleA1 } from './a1';
import { ruleA2 } from './a2';
import { ruleA3 } from './a3';
import { ruleCL } from './cl';
import { ruleCL1 } from './cl1';
import { ruleCL2 } from './cl2';
import { ruleCR } from './cr';
import { ruleCut } from './cut';
import { ruleDL } from './dl';
import { ruleDR } from './dr';
import { ruleDR1 } from './dr1';
import { ruleDR2 } from './dr2';
import { ruleI } from './i';
import { ruleIL } from './il';
import { ruleIR } from './ir';
import { ruleMP } from './mp';
import { ruleNL } from './nl';
import { ruleNR } from './nr';
import { ruleSCL } from './scl';
import { ruleSCR } from './scr';
import { ruleSRotLB } from './srotlb';
import { ruleSRotLF } from './srotlf';
import { ruleSRotRB } from './srotrb';
import { ruleSRotRF } from './srotrf';
import { ruleSWL } from './swl';
import { ruleSWR } from './swr';
import { ruleSXL } from './sxl';
import { ruleSXR } from './sxr';

export const rules: {
  [K in RuleId]: Rule<AnySequent, K>;
} = {
  i: ruleI,
  cut: ruleCut,
  cl: ruleCL,
  dr: ruleDR,
  cl1: ruleCL1,
  dr1: ruleDR1,
  cl2: ruleCL2,
  dr2: ruleDR2,
  dl: ruleDL,
  cr: ruleCR,
  il: ruleIL,
  ir: ruleIR,
  nl: ruleNL,
  nr: ruleNR,
  swl: ruleSWL,
  swr: ruleSWR,
  scl: ruleSCL,
  scr: ruleSCR,
  sRotLF: ruleSRotLF,
  sRotLB: ruleSRotLB,
  sRotRF: ruleSRotRF,
  sRotRB: ruleSRotRB,
  sxl: ruleSXL,
  sxr: ruleSXR,
  a1: ruleA1 ,
  a2: ruleA2,
  a3: ruleA3,
  mp: ruleMP,
};
