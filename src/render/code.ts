import { AnyDerivation, AnyTransformation } from '../model/derivation'
import * as prop from '../model/prop'
import { matchRuleId } from '../model/rule'

export function fromAtom({ value }: prop.Atom<string>): string {
  return `a('${value}')`
}

export function fromFalsum(_falsum: prop.Falsum): string {
  return 'o.p0.falsum'
}

export function fromVerum(_verum: prop.Verum): string {
  return 'o.p0.verum'
}

export function fromNegation({ negand }: prop.Negation<prop.Prop>): string {
  return `o.p1.negation(${fromProp(negand)})`
}

export function fromConjunction({
  leftConjunct,
  rightConjunct,
}: prop.Conjunction<prop.Prop, prop.Prop>): string {
  return `o.p2.conjunction(${fromProp(leftConjunct)},${fromProp(rightConjunct)})`
}

export function fromDisjunction({
  leftDisjunct,
  rightDisjunct,
}: prop.Disjunction<prop.Prop, prop.Prop>): string {
  return `o.p2.disjunction(${fromProp(leftDisjunct)},${fromProp(rightDisjunct)})`
}

export function fromImplication({
  antecedent,
  consequent,
}: prop.Implication<prop.Prop, prop.Prop>): string {
  return `o.p2.implication(${fromProp(antecedent)},${fromProp(consequent)})`
}

export function fromProp(p: prop.Prop): string {
  return prop.matchRaw(p, {
    atom: fromAtom,
    falsum: fromFalsum,
    verum: fromVerum,
    negation: fromNegation,
    conjunction: fromConjunction,
    disjunction: fromDisjunction,
    implication: fromImplication,
  })
}

export function fromTransformation({
  rule,
  deps,
  result,
}: AnyTransformation): string {
  const d = deps.map(fromDerivation)
  return matchRuleId(rule, {
    i: () => `i.i(${fromProp(result.antecedent[0] as prop.Prop)})`,
    f: () => 'i.f()',
    v: () => 'i.v()',
    a1: () => {
      const p2qp = result.succedent[0] as prop.Implication<prop.Prop, prop.Prop>
      const p = p2qp.antecedent
      const q = (p2qp.consequent as prop.Implication<prop.Prop, prop.Prop>).antecedent
      return `i.a1(${fromProp(p)},${fromProp(q)})`
    },
    a2: () => {
      const pqr2pq2pr = result.succedent[0] as prop.Implication<prop.Prop, prop.Prop>
      const p2q2r = pqr2pq2pr.antecedent as prop.Implication<prop.Prop, prop.Prop>
      const p = p2q2r.antecedent
      const q2r = p2q2r.consequent as prop.Implication<prop.Prop, prop.Prop>
      const q = q2r.antecedent
      const r = q2r.consequent
      return `i.a2(${fromProp(p)},${fromProp(q)},${fromProp(r)})`
    },
    a3: () => {
      const np2nq2q2p = result.succedent[0] as prop.Implication<prop.Prop, prop.Prop>
      const np2nq = np2nq2q2p.antecedent as prop.Implication<prop.Prop, prop.Prop>
      const p = (np2nq.antecedent as prop.Negation<prop.Prop>).negand
      const q = (np2nq.consequent as prop.Negation<prop.Prop>).negand
      return `i.a3(${fromProp(p)},${fromProp(q)})`
    },
    ir: () => `z.ir(${d.join(',')})`,
    il: () => `z.il(${d.join(',')})`,
    nl: () => `z.nl(${d.join(',')})`,
    nr: () => `z.nr(${d.join(',')})`,
    cl: () => `z.cl(${d.join(',')})`,
    cr: () => `z.cr(${d.join(',')})`,
    cl1: () => {
      const conj = result.antecedent.at(-1) as prop.Conjunction<prop.Prop, prop.Prop>
      return `z.cl1(${fromProp(conj.rightConjunct)},${d.join(',')})`
    },
    cl2: () => {
      const conj = result.antecedent.at(-1) as prop.Conjunction<prop.Prop, prop.Prop>
      return `z.cl2(${fromProp(conj.leftConjunct)},${d.join(',')})`
    },
    dl: () => `z.dl(${d.join(',')})`,
    dr: () => `z.dr(${d.join(',')})`,
    dr1: () => {
      const disj = result.succedent[0] as prop.Disjunction<prop.Prop, prop.Prop>
      return `z.dr1(${fromProp(disj.rightDisjunct)},${d.join(',')})`
    },
    dr2: () => {
      const disj = result.succedent[0] as prop.Disjunction<prop.Prop, prop.Prop>
      return `z.dr2(${fromProp(disj.leftDisjunct)},${d.join(',')})`
    },
    swl: () =>
      `z.swl(${fromProp(result.antecedent.at(-1) as prop.Prop)},${d.join(',')})`,
    swr: () =>
      `z.swr(${fromProp(result.succedent[0] as prop.Prop)},${d.join(',')})`,
    scl: () => `z.scl(${d.join(',')})`,
    scr: () => `z.scr(${d.join(',')})`,
    sxl: () => `z.sxl(${d.join(',')})`,
    sxr: () => `z.sxr(${d.join(',')})`,
    sRotLF: () => `z.sRotLF(${d.join(',')})`,
    sRotLB: () => `z.sRotLB(${d.join(',')})`,
    sRotRF: () => `z.sRotRF(${d.join(',')})`,
    sRotRB: () => `z.sRotRB(${d.join(',')})`,
    cut: () => `z.cut(${d.join(',')})`,
    mp: () => `z.mp(${d.join(',')})`,
  })
}

export function fromDerivation(derivation: AnyDerivation): string {
  switch (derivation.kind) {
    case 'premise':
      throw new Error('premises not supported')
    case 'transformation':
      return fromTransformation(derivation)
  }
}
