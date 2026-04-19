import { AnyDerivation, AnyTransformation } from '../model/derivation'
import * as prop from '../model/prop'
import { matchRuleRaw } from '../model/rule'
import * as tuple from '../utils/tuple'

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

export function fromTransformation(t: AnyTransformation): string {
  const d = t.deps.map(fromDerivation)
  return matchRuleRaw(t, {
    i: ({ result }) => `i.i(${fromProp(result.antecedent[0])})`,
    f: () => 'i.f()',
    v: () => 'i.v()',
    a1: ({ result }) => {
      const p2qp = result.succedent[0]
      const p = p2qp.antecedent
      const q = p2qp.consequent.antecedent
      return `i.a1(${fromProp(p)},${fromProp(q)})`
    },
    a2: ({ result }) => {
      const pqr2pq2pr = result.succedent[0]
      const p2q2r = pqr2pq2pr.antecedent
      const p = p2q2r.antecedent
      const q2r = p2q2r.consequent
      const q = q2r.antecedent
      const r = q2r.consequent
      return `i.a2(${fromProp(p)},${fromProp(q)},${fromProp(r)})`
    },
    a3: ({ result }) => {
      const np2nq2q2p = result.succedent[0]
      const np2nq = np2nq2q2p.antecedent
      const p = np2nq.antecedent.negand
      const q = np2nq.consequent.negand
      return `i.a3(${fromProp(p)},${fromProp(q)})`
    },
    ir: () => `z.ir(${d.join(',')})`,
    il: () => `z.il(${d.join(',')})`,
    nl: () => `z.nl(${d.join(',')})`,
    nr: () => `z.nr(${d.join(',')})`,
    cl: () => `z.cl(${d.join(',')})`,
    cr: () => `z.cr(${d.join(',')})`,
    cl1: ({ result }) => {
      const conj = tuple.last(result.antecedent)
      return `z.cl1(${fromProp(conj.rightConjunct)},${d.join(',')})`
    },
    cl2: ({ result }) => {
      const conj = tuple.last(result.antecedent)
      return `z.cl2(${fromProp(conj.leftConjunct)},${d.join(',')})`
    },
    dl: () => `z.dl(${d.join(',')})`,
    dr: () => `z.dr(${d.join(',')})`,
    dr1: ({ result }) => {
      const disj = tuple.head(result.succedent)
      return `z.dr1(${fromProp(disj.rightDisjunct)},${d.join(',')})`
    },
    dr2: ({ result }) => {
      const disj = tuple.head(result.succedent)
      return `z.dr2(${fromProp(disj.leftDisjunct)},${d.join(',')})`
    },
    swl: ({ result }) =>
      `z.swl(${fromProp(tuple.last(result.antecedent))},${d.join(',')})`,
    swr: ({ result }) =>
      `z.swr(${fromProp(tuple.head(result.succedent))},${d.join(',')})`,
    scl: () => `z.scl(${d.join(',')})`,
    scr: () => `z.scr(${d.join(',')})`,
    sxl: () => `z.sxl(${d.join(',')})`,
    sxr: () => `z.sxr(${d.join(',')})`,
    sRotLF: () => `z.sRotLF(${d.join(',')})`,
    sRotLB: () => `z.sRotLB(${d.join(',')})`,
    sRotRF: () => `z.sRotRF(${d.join(',')})`,
    sRotRB: () => `z.sRotRB(${d.join(',')})`,
    cut: () => `z.cut(${d.join(',')})`,
    fcut: () => `z.fcut(${d.join(',')})`,
    fcr: () => `z.fcr(${d.join(',')})`,
    fdl: () => `z.fdl(${d.join(',')})`,
    fil: () => `z.fil(${d.join(',')})`,
    mp: () => `z.mp(${d.join(',')})`,
    tip: () => `ttr.tip()`,
    tiq: () => `ttr.tiq()`,
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
