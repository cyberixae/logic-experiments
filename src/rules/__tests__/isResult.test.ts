import { rules } from '../index'
import { entries } from '../../utils/record'
import { sequent } from '../../model/sequent'
import { atom } from '../../model/prop'

describe('isResult type guards', () => {
  const empty = sequent([], [])

  for (const [id, rule] of entries(rules)) {
    it(`${id}: accepts its own example result`, () => {
      expect(rule.isResult(rule.example.result)).toBe(true)
    })
  }

  const rejectsEmpty: Array<[string, (s: typeof empty) => boolean]> = entries(
    rules,
  )
    .filter(([_, rule]) => !rule.isResult(empty))
    .map(([id, rule]) => [id, rule.isResult])

  for (const [id, isResult] of rejectsEmpty) {
    it(`${id}: rejects an empty sequent`, () => {
      expect(isResult(empty)).toBe(false)
    })
  }

  it('cut: accepts any sequent', () => {
    expect(rules.cut.isResult(empty)).toBe(true)
    expect(rules.cut.isResult(sequent([atom('p')], [atom('q')]))).toBe(true)
  })

  it('fcut: accepts any sequent', () => {
    expect(rules.fcut.isResult(empty)).toBe(true)
    expect(rules.fcut.isResult(sequent([atom('p')], [atom('q')]))).toBe(true)
  })
})
