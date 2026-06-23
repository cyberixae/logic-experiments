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
    ir: () => `z.ir(${d.join(',')})`,
    il: () => `z.il(${d.join(',')})`,
    nl: () => `z.nl(${d.join(',')})`,
    nr: () => `z.nr(${d.join(',')})`,
    cl: () => `z.cl(${d.join(',')})`,
    cr: () => `z.cr(${d.join(',')})`,
    dl: () => `z.dl(${d.join(',')})`,
    dr: () => `z.dr(${d.join(',')})`,
    swl: ({ result }) =>
      `z.swl(${fromProp(tuple.last(result.antecedent))},${d.join(',')})`,
    swr: ({ result }) =>
      `z.swr(${fromProp(tuple.head(result.succedent))},${d.join(',')})`,
    sRotLB: () => `z.sRotLB(${d.join(',')})`,
    sRotRB: () => `z.sRotRB(${d.join(',')})`,
    cut: () => `z.cut(${d.join(',')})`,
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
