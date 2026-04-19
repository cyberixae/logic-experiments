import { parseEvent } from './event'
import { isProof } from '../model/derivation'
import { basic, fromDerivation, fromFocus, fromSequent } from '../render/print'
import { of, type Segments } from '../render/segment'
import { activeSequent } from './focus'
import { isRuleId } from '../model/rule'
import { split } from '../utils/string'
import { includes } from '../utils/array'
import { rules } from '../rules'
import { helpSystems, isHelpSystemId, renderSystemHelp } from '../help'
import { Session } from './session'
import { GameMode, gameModes } from '../model/mode'
import { AnyWorkspace } from './workspace'

export type WorkspaceFactory = {
  [K in GameMode]: () => AnyWorkspace
}

export function* repl(
  session: Session,
  factory: WorkspaceFactory,
): Generator<Segments, Segments, string> {
  let output: Segments = menuPrompt()
  while (true) {
    const input = yield [...output, of('\n')]
    if (input.trim() === '') {
      output = session.mode === null ? menuPrompt() : modeStatus(session)
      continue
    }
    const [cmd, ...args] = split(input, ' ')
    const global = handleGlobal(cmd, args)
    if (global) {
      output = global
      continue
    }
    if (session.mode === null) {
      const result = handleMenu(session, factory, cmd)
      if (result === null) return [of('\nExiting...')]
      output = result
      continue
    }
    const result = handleMode(session, factory, cmd, args)
    if (result === null) return [of('\nExiting...')]
    output = result
  }
}

const menuPrompt = (): Segments => [
  of(
    '\n[Main Menu]\n' +
      gameModes
        .map(
          (m) =>
            '\n  ' +
            m +
            ' - ' +
            m.charAt(0).toUpperCase() +
            m.slice(1) +
            ' mode',
        )
        .join('') +
      '\n  quit - Exit',
  ),
]

const handleGlobal = (cmd: string, args: string[]): Segments | null => {
  switch (cmd) {
    case 'systems':
      return [
        of(
          '\nSystems:\n' +
            Object.values(helpSystems)
              .map((s) => '  ' + s.id + ' - ' + s.name)
              .join('\n'),
        ),
      ]
    case 'system': {
      const [arg] = args
      if (arg == null || !isHelpSystemId(arg)) {
        return [of('\nUnknown system "' + arg + '"')]
      }
      return [of('\n' + renderSystemHelp(arg))]
    }
    default:
      return null
  }
}

const handleMenu = (
  session: Session,
  factory: WorkspaceFactory,
  cmd: string,
): Segments | null => {
  if (cmd === 'quit') return null
  if (includes(gameModes, cmd)) {
    session.enter(cmd, factory[cmd]())
    return modeStatus(session)
  }
  return [of('\nUnknown command "' + cmd + '"')]
}

const handleMode = (
  session: Session,
  factory: WorkspaceFactory,
  cmd: string,
  args: string[],
): Segments | null => {
  switch (cmd) {
    case 'quit':
      return null
    case 'menu':
      session.returnToMenu()
      return menuPrompt()
    case 'new': {
      if (session.mode !== 'random') {
        return [of('\nUnknown command "new"')]
      }
      session.replaceWorkspace(factory['random']())
      return modeStatus(session)
    }
    case 'help': {
      const [arg] = args
      if (arg == null) {
        return modeHelp(session)
      }
      if (isRuleId(arg)) {
        return [
          of('\nRule "' + arg + '":\n\n' + fromDerivation(rules[arg].example)),
        ]
      }
      return [of('\nUnknown rule "' + arg + '"')]
    }
    case 'list': {
      if (session.mode !== 'campaign') {
        return [of('\nUnknown command "list"')]
      }
      return [
        of(
          '\nConjectures:\n' +
            session.workspace
              .listConjectures()
              .map(
                ([id]) =>
                  (id === session.workspace.selected ? '*' : ' ') + ' ' + id,
              )
              .join('\n'),
        ),
      ]
    }
    case 'prev': {
      if (session.mode !== 'campaign') {
        return [of('\nUnknown command "prev"')]
      }
      session.workspace.selectConjecture(
        session.workspace.previousConjectureId(),
      )
      return modeStatus(session)
    }
    case 'next': {
      if (session.mode !== 'campaign') {
        return [of('\nUnknown command "next"')]
      }
      session.workspace.selectConjecture(session.workspace.nextConjectureId())
      return modeStatus(session)
    }
    case 'select': {
      if (session.mode !== 'campaign') {
        return [of('\nUnknown command "select"')]
      }
      const [conjectureId] = args
      if (!session.workspace.isConjectureId(conjectureId)) {
        return [of('\nUnknown conjecture "' + conjectureId + '"')]
      }
      session.workspace.selectConjecture(conjectureId)
      return modeStatus(session)
    }
    default: {
      const ev = parseEvent(cmd)
      if (!ev) {
        return [of('\nUnknown command "' + cmd + '"')]
      }
      session.workspace.applyEvent(ev)
      return modeStatus(session)
    }
  }
}

const modeHelp = (session: Session): Segments => {
  let text = '\nCommands:'
  text += '\n  help - display this manual'
  text += '\n  help <rule> - display rule description'
  text += '\n  undo - undo applied rule'
  text += '\n  reset - undo all applied rules'
  if (session.mode === 'random') {
    text += '\n  new - get a new random challenge'
  }
  text += '\n  menu - return to main menu'
  text += '\n  quit - exit'
  return [of(text)]
}

const modeStatus = (session: Session): Segments => {
  const ws = session.workspace
  const s = ws.currentConjecture()
  const solved = isProof(s.derivation)
  const availableRules = ws.applicableRules()

  let title = ''
  if (session.mode === 'campaign') {
    title = '\n[Campaign: ' + ws.selected + ']'
  } else if (session.mode === 'random') {
    title = '\n[Random]'
  } else if (session.mode === 'tutorial') {
    title = '\n[Tutorial: ' + ws.selected + ']'
  }

  const commands = ['help', 'undo', 'reset']
  if (session.mode === 'random') commands.push('new')
  commands.push('menu')

  const result: Segments = [
    of(title + '\n\n'),
    ...fromSequent(activeSequent(s))(basic),
    of('\n\n' + fromFocus(s)),
    of('\n\nRules: ' + availableRules.join(', ')),
    of('\nCommands: ' + commands.join(', ')),
  ]

  if (solved) {
    result.push(of('\n\nConglaturations!\n'))
    if (session.mode === 'campaign') {
      result.push(of('\nType "next" to continue'))
    }
    if (session.mode === 'random') {
      result.push(of('\nType "new" for a new challenge'))
    }
  }

  return result
}
