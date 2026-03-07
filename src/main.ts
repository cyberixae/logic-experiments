import * as readline from 'readline';
import { repl } from './repl';
import { example } from './theorems/example';

const main = () => {

  const rl = readline.createInterface({ input: process.stdin });
  const gen = repl(example.goal);
  process.stdout.write(gen.next('').value ?? '');
  rl.on('line', line => {
    const { value, done } = gen.next(line.trim());
    if (value) process.stdout.write(value);
    if (done) rl.close();
  });
  rl.on('SIGINT', () => { rl.close(); process.exit(0); });
};
main();
