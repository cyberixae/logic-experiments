import * as readline from 'readline'
import { repl } from './interactive/repl'
import { Session } from './interactive/session'
import { Workspace } from './interactive/workspace'
import { challenges } from './challenges'
import { random } from './random/challenge'
import { ansi } from './render/segment'

const generate = random(5, 0)

const main = () => {
  const session = new Session()
  const factory = {
    campaign: () => new Workspace(challenges),
    random: () => new Workspace({ challenge: generate() }),
    quiz: () => new Workspace(challenges),
  }
  const rl = readline.createInterface({ input: process.stdin })
  const gen = repl(session, factory)
  process.stdout.write(ansi(gen.next('').value ?? []))
  process.stdout.write('\n> ')
  rl.on('line', (line) => {
    const { value, done } = gen.next(line.trim())
    if (value != null) process.stdout.write(ansi(value))
    if (done === true) rl.close()
    process.stdout.write('\n> ')
  })
  rl.on('SIGINT', () => {
    rl.close()
    process.exit(0)
  })
}
main()
