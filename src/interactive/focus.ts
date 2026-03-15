import * as array from '../utils/array'
import {
  Derivation,
  Edit,
  editDerivation,
  branches,
  Path,
  premise,
  equalsDerivation,
  subDerivation,
  openBranches,
} from '../model/derivation'
import { AnySequent, Sequent } from '../model/sequent'
import { rev } from '../systems/lk'
import { Event } from './event'

export type Focus<J extends AnySequent> = {
  derivation: Derivation<J>
  branch: number
}
export const focus = <J extends AnySequent>(
  derivation: Derivation<J>,
  branch: number = 0,
): Focus<J> => ({
  derivation,
  branch,
})
export type AnyFocus = Focus<AnySequent>

export const next = <J extends AnySequent>(s: Focus<J>): Focus<J> =>
  focus(s.derivation, s.branch + 1)

export const prev = <J extends AnySequent>(s: Focus<J>): Focus<J> =>
  focus(s.derivation, s.branch - 1)

export const activePath = <J extends AnySequent>(s: Focus<J>): Path => {
  const paths = branches(s.derivation)
  return array.mod(paths, s.branch)
}

export const activeSequent = (s: AnyFocus): AnySequent => {
  const path = activePath(s)
  const derivation = subDerivation(s.derivation, path)
  return (derivation ?? s.derivation).result
}

export const apply = <J extends AnySequent>(
  s: Focus<J>,
  edit: Edit,
): Focus<J> => {
  const path = activePath(s)
  const derivation = editDerivation(s.derivation, path, edit)
  if (!derivation) {
    return s
  }
  const cursor = focus(derivation, s.branch)
  const openBefore = openBranches(s.derivation).length
  const openAfter = openBranches(derivation).length
  if (openAfter < openBefore) {
    return next(cursor)
  }
  return cursor
}

export const undo = <J extends AnySequent>(s: Focus<J>): Focus<J> => {
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

export const reset = <J extends AnySequent>(s: Focus<J>): Focus<J> => {
  return focus(premise(s.derivation.result))
}

export const applyEvent = <J extends AnySequent>(
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
