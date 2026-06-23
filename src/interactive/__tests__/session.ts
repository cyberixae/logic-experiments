import { Session } from '../session'
import { Workspace } from '../workspace'
import { challenges } from '../../challenges'

describe('Session', () => {
  it('starts with no mode', () => {
    const session = new Session()
    expect(session.mode).toBe(null)
  })

  it('enters a mode', () => {
    const session = new Session()
    const ws = new Workspace(challenges)
    session.enter('campaign', ws)
    expect(session.mode).toBe('campaign')
    expect(session.workspace).toBe(ws)
  })

  it('returns to menu', () => {
    const session = new Session()
    session.enter('campaign', new Workspace(challenges))
    session.returnToMenu()
    expect(session.mode).toBe(null)
  })

  it('throws when accessing workspace without mode', () => {
    const session = new Session()
    expect(() => session.workspace).toThrow()
  })

  it('replaces workspace', () => {
    const session = new Session()
    const ws1 = new Workspace(challenges)
    const ws2 = new Workspace(challenges)
    session.enter('campaign', ws1)
    session.replaceWorkspace(ws2)
    expect(session.workspace).toBe(ws2)
  })
})
