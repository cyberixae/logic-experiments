import * as readline from 'readline'
import { repl } from './interactive/repl'
import { challenges } from './challenges'
import { Workspace } from './interactive/workspace'
import { ansi } from './render/segment'

const main = () => {
  const workspace = new Workspace(challenges)
  const rl = readline.createInterface({ input: process.stdin })
  const gen = repl(workspace)
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
