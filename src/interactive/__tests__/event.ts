import {
  reverse0,
  reverse1,
  undo,
  reset,
  level,
  nextBranch,
  prevBranch,
} from '../event'
import { atom } from '../../model/prop'

describe('event', () => {
  describe('constructors', () => {
    it('reverse0', () => {
      expect(reverse0('ir')).toEqual({ kind: 'reverse0', rev: 'ir' })
    })

    it('reverse1', () => {
      expect(reverse1('cut', atom('p'))).toEqual({
        kind: 'reverse1',
        rev: 'cut',
        a: atom('p'),
      })
    })

    it('undo', () => {
      expect(undo()).toEqual({ kind: 'undo' })
    })

    it('reset', () => {
      expect(reset()).toEqual({ kind: 'reset' })
    })

    it('level', () => {
      expect(level()).toEqual({ kind: 'level' })
    })

    it('nextBranch', () => {
      expect(nextBranch()).toEqual({ kind: 'nextBranch' })
    })

    it('prevBranch', () => {
      expect(prevBranch()).toEqual({ kind: 'prevBranch' })
    })
  })
})
