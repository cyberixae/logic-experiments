import { isProof, premise } from '../model/derivation'
import { Focus, focus, apply, undo, next, prev } from './focus'
import { AnyJudgement } from '../model/judgement'
import { rev } from '../systems/lk'
import { Event } from './event'

type Search<J extends AnyJudgement> = () => Generator<Focus<J>, void, Event>

export const search = <J extends AnyJudgement>(goal: J): Search<J> =>
  function* () {
    let state = focus(premise(goal))
    while (!isProof(state.derivation)) {
      const ev = yield state
      switch (ev.kind) {
        case 'reverse':
          const edit = rev[ev.rev]
          if (!edit) {
            break
          }
          state = apply(state, edit)
          break
        case 'undo':
          state = undo(state)
          break
        case 'next':
          state = next(state)
          break
        case 'prev':
          state = prev(state)
          break
      }
    }
    yield state
  }
