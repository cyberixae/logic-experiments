import * as readline from 'readline'
import { repl } from './interactive/repl'
import { challenges } from './challenges'
import { Workspace } from './interactive/workspace'

const main = () => {
  const workspace = new Workspace(challenges)
  const rl = readline.createInterface({ input: process.stdin })
  const gen = repl(workspace)
  process.stdout.write(gen.next('').value ?? '')
  process.stdout.write('\n> ')
  rl.on('line', (line) => {
    const { value, done } = gen.next(line.trim())
    if (value) process.stdout.write(value)
    if (done) rl.close()
    process.stdout.write('\n> ')
  })
  rl.on('SIGINT', () => {
    rl.close()
    process.exit(0)
  })
}
main()
