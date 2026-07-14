import { plain, html } from '../segment'
import { basic } from '../print'
import { fromDraft } from '../draft'
import {
  Draft,
  hole,
  draftNegation,
  draftImplication,
  draftConjunction,
  draftDisjunction,
  fillLeftmost,
  toProp,
  isComplete,
} from '../../model/draft'
import {
  atom,
  falsum,
  verum,
  implication,
  conjunction,
  equals,
} from '../../model/prop'

const fill = (d: Draft, filler: Draft): Draft => {
  const next = fillLeftmost(d, filler)
  if (next === null) throw new Error('expected a hole to fill')
  return next
}

describe('draft rendering', () => {
  it('renders a bare hole', () => {
    expect(plain(fromDraft(hole)(basic))).toBe('▢')
  })

  it('renders negation of a hole', () => {
    expect(plain(fromDraft(draftNegation(hole))(basic))).toBe('¬▢')
  })

  it('renders implication of holes', () => {
    expect(plain(fromDraft(draftImplication(hole, hole))(basic))).toBe('▢→▢')
  })

  it('renders leaves like the finished formula', () => {
    expect(plain(fromDraft(atom('p'))(basic))).toBe('🐧')
    expect(plain(fromDraft(falsum)(basic))).toBe('⊥')
    expect(plain(fromDraft(verum)(basic))).toBe('⊤')
  })

  it('parenthesizes like the finished formula', () => {
    const d = draftConjunction(atom('p'), draftImplication(hole, hole))
    expect(plain(fromDraft(d)(basic))).toBe('🐧∧(▢→▢)')
  })

  it('does not parenthesize a hole operand', () => {
    const d = draftDisjunction(draftNegation(hole), hole)
    expect(plain(fromDraft(d)(basic))).toBe('¬▢∨▢')
  })

  it('marks holes in html output', () => {
    expect(html(fromDraft(hole)(basic))).toBe('<span class="hole">▢</span>')
  })
})

describe('draft editing', () => {
  it('builds implication of p and q by filling leftmost holes', () => {
    let d: Draft = hole
    d = fill(d, draftImplication(hole, hole))
    d = fill(d, atom('p'))
    d = fill(d, atom('q'))
    const p = toProp(d)
    expect(p !== null && equals(p, implication(atom('p'), atom('q')))).toBe(
      true,
    )
  })

  it('fills strictly left to right', () => {
    let d: Draft = draftConjunction(hole, hole)
    d = fill(d, atom('p'))
    expect(plain(fromDraft(d)(basic))).toBe('🐧∧▢')
    d = fill(d, atom('q'))
    const p = toProp(d)
    expect(p !== null && equals(p, conjunction(atom('p'), atom('q')))).toBe(
      true,
    )
  })

  it('descends into the leftmost hole before later ones', () => {
    let d: Draft = draftImplication(draftNegation(hole), hole)
    d = fill(d, atom('p'))
    expect(plain(fromDraft(d)(basic))).toBe('¬🐧→▢')
  })

  it('returns null when no hole remains', () => {
    expect(fillLeftmost(atom('p'), verum)).toBeNull()
  })

  it('toProp is null while holes remain', () => {
    expect(toProp(draftImplication(atom('p'), hole))).toBeNull()
  })

  it('isComplete flips when the last hole is filled', () => {
    const open = draftNegation(hole)
    expect(isComplete(open)).toBe(false)
    expect(isComplete(fill(open, atom('q')))).toBe(true)
  })
})
