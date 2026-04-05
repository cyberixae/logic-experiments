import { of, active, ansi, html, trim } from '../segment'

describe('segment module', () => {
  describe('ansi', () => {
    it('inactive segment unchanged', () => {
      expect(ansi([of('hello')])).toBe('hello')
    })

    it('active segment gets bold', () => {
      expect(ansi([active('∧')])).toBe('\x1b[1m∧\x1b[0m')
    })

    it('mixed segments', () => {
      expect(ansi([of('a'), active('∧'), of('b')])).toBe('a\x1b[1m∧\x1b[0mb')
    })
  })

  describe('html', () => {
    it('inactive segment unchanged', () => {
      expect(html([of('hello')])).toBe('hello')
    })

    it('active segment gets span', () => {
      expect(html([active('∧')])).toBe(
        '<span class="connective-active">∧</span>',
      )
    })

    it('mixed segments', () => {
      expect(html([of('a'), active('∧'), of('b')])).toBe(
        'a<span class="connective-active">∧</span>b',
      )
    })

    it('inactive segment text is escaped', () => {
      expect(html([of('<b>bold</b>')])).toBe('&lt;b&gt;bold&lt;/b&gt;')
    })

    it('active segment text is escaped', () => {
      expect(html([active('<b>')])).toBe(
        '<span class="connective-active">&lt;b&gt;</span>',
      )
    })

    it('ampersands are escaped', () => {
      expect(html([of('a & b')])).toBe('a &amp; b')
    })
  })

  describe('trim', () => {
    it('trims leading whitespace from first segment', () => {
      expect(trim([of('  a'), of('b')])).toEqual([of('a'), of('b')])
    })

    it('trims trailing whitespace from last segment', () => {
      expect(trim([of('a'), of('b  ')])).toEqual([of('a'), of('b')])
    })

    it('skips empty leading segments', () => {
      expect(trim([of('  '), of('  a')])).toEqual([of(''), of('a')])
    })

    it('does not modify original segments', () => {
      const segments = [of('  a  ')]
      trim(segments)
      expect(segments).toEqual([of('  a  ')])
    })
  })
})
