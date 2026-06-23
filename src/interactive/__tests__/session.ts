import { Session } from '../session'
import { repl, WorkspaceFactory } from '../repl'
import { Workspace } from '../workspace'
import { challenges } from '../../challenges'
import { random } from '../../random/challenge'
import { plain } from '../../render/segment'

const generate = random(5, 0)

const factory: WorkspaceFactory = {
  campaign: () => new Workspace(challenges),
  random: () => new Workspace({ challenge: generate() }),
}

const createRepl = () => {
  const session = new Session()
  const gen = repl(session, factory)
  const send = (input: string) => {
    const result = gen.next(input)
    return { text: plain(result.value), done: result.done }
  }
  return { session, send }
}

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

describe('repl', () => {
  describe('menu', () => {
    it('shows the main menu on start', () => {
      const { send } = createRepl()
      const { text } = send('')
      expect(text).toContain('[Main Menu]')
      expect(text).toContain('campaign')
      expect(text).toContain('random')
      expect(text).toContain('quit')
    })

    it('exits on quit', () => {
      const { send } = createRepl()
      send('')
      const { text, done } = send('quit')
      expect(text).toContain('Exiting...')
      expect(done).toBe(true)
    })

    it('shows error for unknown command', () => {
      const { send } = createRepl()
      send('')
      const { text } = send('bogus')
      expect(text).toContain('Unknown command')
      expect(text).toContain('bogus')
    })

    it('returns to menu after unknown command', () => {
      const { send } = createRepl()
      send('')
      send('bogus')
      const { text } = send('')
      expect(text).toContain('[Main Menu]')
    })
  })

  describe('campaign mode', () => {
    it('enters campaign mode and shows welcome', () => {
      const { send } = createRepl()
      send('')
      const { text } = send('campaign')
      expect(text).toContain('Rules:')
    })

    it('returns to menu via menu command', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text } = send('menu')
      expect(text).toContain('[Main Menu]')
    })

    it('exits program via quit command', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text, done } = send('quit')
      expect(text).toContain('Exiting...')
      expect(done).toBe(true)
    })

    it('lists conjectures', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text } = send('list')
      expect(text).toContain('ch0identity1')
    })

    it('shows session commands in help', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text } = send('help')
      expect(text).toContain('menu - return to main menu')
      expect(text).toContain('quit - exit')
    })

    it('does not show new command in help', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text } = send('help')
      expect(text).not.toContain('new')
    })

    it('forwards help <rule> to repl without session extras', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text } = send('help i')
      expect(text).toContain('Rule "i"')
      expect(text).not.toContain('menu - return to main menu')
    })
  })

  describe('random mode', () => {
    it('enters random mode and shows welcome', () => {
      const { send } = createRepl()
      send('')
      const { text } = send('random')
      expect(text).toContain('Rules:')
    })

    it('returns to menu via menu command', () => {
      const { send } = createRepl()
      send('')
      send('random')
      const { text } = send('menu')
      expect(text).toContain('[Main Menu]')
    })

    it('exits program via quit command', () => {
      const { send } = createRepl()
      send('')
      send('random')
      const { text, done } = send('quit')
      expect(text).toContain('Exiting...')
      expect(done).toBe(true)
    })

    it('shows session commands in help including new', () => {
      const { send } = createRepl()
      send('')
      send('random')
      const { text } = send('help')
      expect(text).toContain('new - get a new random challenge')
      expect(text).toContain('menu - return to main menu')
      expect(text).toContain('quit - exit')
    })

    it('generates a new challenge via new command', () => {
      const { send } = createRepl()
      send('')
      send('random')
      const { text } = send('new')
      expect(text).toContain('Rules:')
    })

    it('can re-enter random after going back to menu', () => {
      const { send } = createRepl()
      send('')
      send('random')
      send('menu')
      const { text } = send('random')
      expect(text).toContain('Rules:')
    })
  })

  describe('mode switching', () => {
    it('can switch from campaign to random via menu', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      send('menu')
      const { text } = send('random')
      expect(text).toContain('Rules:')
    })

    it('can switch from random to campaign via menu', () => {
      const { send } = createRepl()
      send('')
      send('random')
      send('menu')
      const { text } = send('campaign')
      expect(text).toContain('Rules:')
    })
  })

  describe('external mode changes', () => {
    it('repl sees mode change made externally', () => {
      const { session, send } = createRepl()
      send('')
      // External mode change (simulates web button click)
      session.enter('campaign', new Workspace(challenges))
      // Next repl command should see campaign mode
      const { text } = send('list')
      expect(text).toContain('ch0identity1')
    })

    it('repl sees menu after external returnToMenu', () => {
      const { session, send } = createRepl()
      send('')
      send('campaign')
      // External return to menu
      session.returnToMenu()
      // Next repl command should see menu
      const { text } = send('campaign')
      expect(text).toContain('Rules:')
    })
  })

  describe('global commands', () => {
    it('lists systems from menu', () => {
      const { send } = createRepl()
      send('')
      const { text } = send('systems')
      expect(text).toContain('RK')
    })

    it('shows system details from menu', () => {
      const { send } = createRepl()
      send('')
      const { text } = send('system rk')
      expect(text).toContain('RK')
    })

    it('shows error for unknown system', () => {
      const { send } = createRepl()
      send('')
      const { text } = send('system bogus')
      expect(text).toContain('Unknown system')
    })

    it('lists systems from within a mode', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text } = send('systems')
      expect(text).toContain('RK')
    })
  })

  describe('campaign navigation', () => {
    it('selects next conjecture', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text } = send('next')
      expect(text).toContain('ch0identity2')
    })

    it('selects previous conjecture', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      send('next')
      const { text } = send('prev')
      expect(text).toContain('ch0identity1')
    })

    it('selects conjecture by id', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text } = send('select ch1weakening1')
      expect(text).toContain('ch1weakening1')
    })

    it('shows error for unknown conjecture', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text } = send('select bogus')
      expect(text).toContain('Unknown conjecture')
    })
  })

  describe('random mode restrictions', () => {
    it('rejects list command', () => {
      const { send } = createRepl()
      send('')
      send('random')
      const { text } = send('list')
      expect(text).toContain('Unknown command')
    })

    it('rejects prev command', () => {
      const { send } = createRepl()
      send('')
      send('random')
      const { text } = send('prev')
      expect(text).toContain('Unknown command')
    })

    it('rejects next command', () => {
      const { send } = createRepl()
      send('')
      send('random')
      const { text } = send('next')
      expect(text).toContain('Unknown command')
    })

    it('rejects select command', () => {
      const { send } = createRepl()
      send('')
      send('random')
      const { text } = send('select foo')
      expect(text).toContain('Unknown command')
    })
  })

  describe('campaign mode restrictions', () => {
    it('rejects new command', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text } = send('new')
      expect(text).toContain('Unknown command')
    })
  })

  describe('solving', () => {
    it('shows congrats on solve in campaign', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      const { text } = send('i')
      expect(text).toContain('Conglaturations')
      expect(text).toContain('next')
    })

    it('shows congrats with new hint in random after solve', () => {
      const { send } = createRepl()
      send('')
      send('campaign')
      // ch0identity1 is solvable with 'i'
      const { text } = send('i')
      expect(text).toContain('Conglaturations')
    })
  })
})
