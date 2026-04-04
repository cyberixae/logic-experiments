import {
  parseEvent,
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

  describe('parseEvent', () => {
    it('parses undo', () => {
      expect(parseEvent('undo')).toEqual({ kind: 'undo' })
    })

    it('parses reset', () => {
      expect(parseEvent('reset')).toEqual({ kind: 'reset' })
    })

    it('parses a reverse0 rule id', () => {
      expect(parseEvent('ir')).toEqual({ kind: 'reverse0', rev: 'ir' })
    })

    it('returns null for an unknown command', () => {
      expect(parseEvent('unknown')).toBeNull()
    })

    it('returns null for a reverse1 rule (not yet implemented)', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
      expect(parseEvent('cut')).toBeNull()
      expect(spy).toHaveBeenCalledWith('TBD, parse:[]')
      spy.mockRestore()
    })
  })
})
