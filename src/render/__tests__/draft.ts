import { plain, html } from '../segment'
import { basic } from '../print'
import { fromDraft, lemmaGhostPremises } from '../draft'
import { sequent } from '../../model/sequent'
import {
  Draft,
  hole,
  draftNegation,
  draftImplication,
  draftConjunction,
  draftDisjunction,
  fillLeftmost,
  fillOrWrap,
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

describe('lemma ghost premises', () => {
  it('splices the draft into both reverse-cut premises', () => {
    const goal = sequent([atom('p')], [atom('q')])
    const [proveIt, useIt] = lemmaGhostPremises(
      goal,
      draftImplication(hole, hole),
    )
    expect(plain(proveIt(basic))).toBe('🐧 ⊢ 🦜,▢→▢')
    expect(plain(useIt(basic))).toBe('▢→▢,🐧 ⊢ 🦜')
  })

  it('handles an empty succedent', () => {
    const goal = sequent([atom('p')], [])
    const [proveIt, useIt] = lemmaGhostPremises(goal, hole)
    expect(plain(proveIt(basic))).toBe('🐧 ⊢ ▢')
    expect(plain(useIt(basic))).toBe('▢,🐧 ⊢')
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

describe('wrapping a complete draft', () => {
  const wrap = (d: Draft, piece: Draft): Draft => {
    const next = fillOrWrap(d, piece)
    if (next === null) throw new Error('expected fill or wrap to succeed')
    return next
  }

  it('an operator on a complete draft wraps it as the left operand', () => {
    const d = wrap(atom('p'), draftImplication(hole, hole))
    expect(plain(fromDraft(d)(basic))).toBe('🐧→▢')
  })

  it('negation wraps a complete draft', () => {
    const d = wrap(atom('p'), draftNegation(hole))
    expect(plain(fromDraft(d)(basic))).toBe('¬🐧')
  })

  it('an atom on a complete draft still fails', () => {
    expect(fillOrWrap(atom('p'), atom('q'))).toBeNull()
  })

  it('fills a hole in preference to wrapping', () => {
    const d = wrap(draftImplication(hole, hole), draftNegation(hole))
    expect(plain(fromDraft(d)(basic))).toBe('¬▢→▢')
  })

  it('supports pure left-to-right entry', () => {
    let d: Draft = hole
    for (const piece of [
      atom('p'),
      draftConjunction(hole, hole),
      atom('q'),
      draftImplication(hole, hole),
      atom('r'),
    ]) {
      d = wrap(d, piece)
    }
    expect(plain(fromDraft(d)(basic))).toBe('🐧∧🦜→🦃')
    const p = toProp(d)
    expect(
      p !== null &&
        equals(p, implication(conjunction(atom('p'), atom('q')), atom('r'))),
    ).toBe(true)
  })
})
