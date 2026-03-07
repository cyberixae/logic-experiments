import { parseEvent } from './interactive/event';
import { focus, applyEvent, Focus, activePath } from './interactive/focus';
import { premise, isProof } from './model/derivation';
import { AnyJudgement } from './model/judgement';
import { fromFocus } from './render/print';
import { revs } from './systems/lk';
import { head } from './utils/tuple';

export function* repl(goal: AnyJudgement): Generator<string, void, string> {
  let state = focus(premise(goal));
  while (!isProof(state.derivation)) {
    const cmd = yield status(state);
    if (cmd === 'quit') {
      return;
    }
    const ev = parseEvent(cmd);
    if (!ev) {
      continue;
    }
    state = applyEvent(state, ev);
  }
  yield status(state);
}
const status = (s: Focus<AnyJudgement>): string => '\n\n' +
  fromFocus(s) +
  '\n\n' +
  revs(s.derivation, activePath(s)).map(head).join(', ') +
  '\n';
