import { last } from "./lib/array"
import { Derivation } from "./lib/derivation"
import { AnyJudgement as AnySequent, conclusion, Formulas, Judgement as Sequent, judgement as sequent } from "./lib/judgement"
import { lk, Prop, SWL } from './systems/lk'

type Goal<J extends AnySequent> = {
  rule: 'goal'
  state: J
  op: Draft<AnySequent> | null
}
const fromGoal = <J extends AnySequent>(goal: Goal<J>): Derivation<J> | null => fromDraft(goal)

type WL<J extends Sequent<[...Formulas, Prop], Formulas>> =
  J extends Sequent<[...infer Γ extends Formulas, Prop], infer Δ>
?
{
  rule: 'wl'
  state: J
  op: Draft<Sequent<Γ, Δ>> | null
}
    : never
const fromWL = <A extends Prop, Γ extends Formulas, Δ extends Formulas>(wl: WL<Sequent<[...Γ, A], Δ>>): SWL<A, Derivation<Sequent<Γ, Δ>>> | null => {
  if (!wl.op) {
    return null
  } 
  const subProof = fromDraft(wl.op)
  if (!subProof) {
    return null
  }
  const a: A = last(wl.state.antecedent)
  return lk.z.swl(a, subProof)
}

type IR<J extends AnySequent> = {
  rule: 'ir'
  state: J
  op: Draft<AnySequent> | null
}
const fromIR = <J extends AnySequent>(ir: IR<J>): Derivation<J> | null => lk.z.ir(fromDraft(ir.op))

type I<J extends AnySequent> = {
  rule: 'I'
  state: J
}
const fromI = <J extends AnySequent>(i: I<J>): Derivation<J> | null => lk.i.i(i.state.antecedent[0])

type Draft<J extends AnySequent> =  Goal<J> | IR<J> | WL<J> | I<J>  

const fromDraft = <J extends AnySequent>(draft: Draft<J>): Derivation<J> | null => {
  switch(draft.rule) {
    case 'I':
      return fromI(draft)
    case 'ir':
      return fromIR(draft)
    case 'wl':
      return fromWL(draft)
    case 'goal':
      return fromGoal(draft)
  }
}

const example: Draft<AnySequent> = {
  rule: 'goal' as const,
  state: conclusion( lk.o.p2.implication(lk.o.p2.implication(lk.a('p'), lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p')))), lk.o.p2.implication(lk.a('p'), lk.a('p')))),
  op: {
    rule: 'ir' as const,
    state: sequent([lk.o.p2.implication(lk.a('p'), lk.o.p2.implication(lk.a('q'), lk.o.p1.negation(lk.a('p'))))], [lk.o.p2.implication(lk.a('p'), lk.a('p'))]),
    op: {
      rule: 'wl' as const,
      state: sequent([], [lk.o.p2.implication(lk.a('p'), lk.a('p'))]),
      op: {
        rule: 'ir' as const,
        state: sequent([lk.a('p')], [lk.a('p')]),
        op: {
          rule: 'I' as const,
          state: lk.a('p'),
        }
      }
    }
  }
}

const derivation = fromDraft(example)