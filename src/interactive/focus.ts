import * as array from '../utils/array'
import {
  Derivation,
  Edit,
  editDerivation,
  lsDerivation,
  Path,
  premise,
  equalsDerivation,
} from '../model/derivation'
import { AnyJudgement } from '../model/judgement'
import { rev } from '../systems/lk'
import { Event } from './event'

export type Focus<J extends AnyJudgement> = {
  derivation: Derivation<J>
  branch: number
}
export const focus = <J extends AnyJudgement>(
  derivation: Derivation<J>,
  branch: number = 0,
): Focus<J> => ({
  derivation,
  branch,
})

export const next = <J extends AnyJudgement>(s: Focus<J>): Focus<J> =>
  focus(s.derivation, s.branch + 1)

export const prev = <J extends AnyJudgement>(s: Focus<J>): Focus<J> =>
  focus(s.derivation, s.branch - 1)

export const activePath = <J extends AnyJudgement>(s: Focus<J>): Path => {
  const paths = lsDerivation(s.derivation)
  return array.mod(paths, s.branch)
}

export const apply = <J extends AnyJudgement>(
  s: Focus<J>,
  edit: Edit,
): Focus<J> => {
  const path = activePath(s)
  const derivation = editDerivation(s.derivation, path, edit)
  if (!derivation) {
    return s
  }
  return focus(derivation, s.branch)
}

export const undo = <J extends AnyJudgement>(s: Focus<J>): Focus<J> => {
  const path = activePath(s)
  if (array.isNonEmptyArray(path)) {
    const parentPath = array.init(path)
    const derivation = editDerivation(s.derivation, parentPath, (parent) =>
      premise(parent.result),
    )
    if (!derivation) {
      return s
    }
    return focus(derivation, s.branch)
  }
  return s
}

export const reset = <J extends AnyJudgement>(s: Focus<J>): Focus<J> => {
  return focus(premise(s.derivation.result))
}

export const applyEvent = <J extends AnyJudgement>(
  state: Focus<J>,
  ev: Event,
): Focus<J> => {
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
    case 'reset':
      state = reset(state)
      break
    case 'next':
      state = next(state)
      break
    case 'prev':
      state = prev(state)
      break
  }
  return state
}
