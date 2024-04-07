import { tree, center, treeAuto, align } from '../block'

describe('block module', () => {
  describe('center function', () => {
    it('equal', () => {
      expect(center(1)('abc')).toBe('abc')
      expect(center(3)('abc')).toBe('abc')
      expect(center(5)('abc')).toBe(' abc ')
    })
  })
  describe('align function', () => {
    it('no match', () => {
      expect(align('abc\n   ', '   \nbcd')).toBe(null)
      expect(align('abc\n b ', ' c \nbcd')).toBe(null)
    })
    it('offset', () => {
      expect('\n' + align('abcd\n  c ', ' c  \nbcde') + '\n').toBe(`
abcd 
  c  
 bcde
`)
    })
  })
  describe('tree function', () => {
    it('no branches', () => {
      expect('\n' + tree('bar', [], 'omg', 3) + '\n').toBe(`
       
――― omg
bar    
`)
    })
    it('equal', () => {
      expect('\n' + tree('bar', ['foo'], 'omg', 3) + '\n').toBe(`
foo    
――― omg
bar    
`)
    })
    it('big top', () => {
      expect('\n' + tree('bar', ['foobs'], 'omg', 5) + '\n').toBe(`
foobs    
――――― omg
 bar     
`)
    })
    it('big bottom', () => {
      expect('\n' + tree('barbs', ['foo'], 'omg', 5) + '\n').toBe(`
 foo     
――――― omg
barbs    
`)
    })
    it('double flat', () => {
      expect(
        '\n' + tree('qux', [tree('bar', ['foo'], 'omg', 3)], 'omg', 3) + '\n',
      ).toBe(`
foo    
――― omg
bar    
――― omg
qux    
`)
    })
    it('double big top', () => {
      expect(
        '\n' + tree('qux', [tree('bar', ['foobs'], 'omg', 5)], 'omg', 3) + '\n',
      ).toBe(`
foobs    
――――― omg
 bar     
 ――― omg 
 qux     
`)
    })
  })

  describe('treeAuto function', () => {
    it('no branches', () => {
      expect('\n' + treeAuto('bar', [], 'omg') + '\n').toBe(`
         
――――― omg
 bar     
`)
    })
    it('equal', () => {
      expect('\n' + treeAuto('bar', ['foo'], 'omg') + '\n').toBe(`
 foo     
――――― omg
 bar     
`)
    })
    it('two', () => {
      expect('\n' + treeAuto('qux', ['foo', 'bar'], 'omg') + '\n').toBe(`
 foo  bar     
―――――――――― omg
   qux        
`)
    })
    it('big top', () => {
      expect('\n' + treeAuto('bar', ['foobs'], 'omg') + '\n').toBe(`
 foobs     
――――――― omg
  bar      
`)
    })
    it('big bottom', () => {
      expect('\n' + treeAuto('barbs', ['foo'], 'omg') + '\n').toBe(`
  foo      
――――――― omg
 barbs     
`)
    })
    it('double flat', () => {
      expect(
        '\n' + treeAuto('qux', [treeAuto('bar', ['foo'], 'omg')], 'omg') + '\n',
      ).toBe(`
 foo     
――――― omg
 bar     
――――― omg
 qux     
`)
    })
    it('double big top', () => {
      expect(
        '\n' +
          treeAuto('qux', [treeAuto('bar', ['foobs'], 'omg')], 'omg') +
          '\n',
      ).toBe(`
 foobs     
――――――― omg
  bar      
 ――――― omg 
  qux      
`)
    })
  })
})
