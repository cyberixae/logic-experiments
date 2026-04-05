import * as array from '../utils/array'
import {
  Derivation,
  Edit,
  editDerivation,
  branches,
  Path,
  premise,
  subDerivation,
  openBranches,
} from '../model/derivation'
import { AnySequent } from '../model/sequent'
import {
  applicableRules as applicableRulesSequent,
  reverse0,
  reverse1,
} from '../rules'
import { Event } from './event'
import { RuleId } from '../model/rule'

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
  if (!derivation) {
    console.warn(
      'activeSequent: path not found in derivation, falling back to root',
    )
  }
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
  const current = subDerivation(s.derivation, path)
  if (current?.kind === 'transformation') {
    // Active path points to a closed axiom — undo it directly
    const derivation = editDerivation(s.derivation, path, (d) =>
      premise(d.result),
    )
    if (!derivation) {
      return s
    }
    return focus(derivation, s.branch)
  }
  if (array.isNonEmptyArray(path)) {
    // Active path points to an open premise — undo the rule that introduced it
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
    case 'reverse0': {
      const rule = reverse0[ev.rev]
      state = apply(state, rule.tryReverse)
      break
    }
    case 'reverse1': {
      const rule = reverse1[ev.rev]
      state = apply(state, rule.tryReverse(ev.a))
      break
    }
    case 'undo':
      state = undo(state)
      break
    case 'reset':
      state = reset(state)
      break
    case 'nextBranch':
      state = next(state)
      break
    case 'prevBranch':
      state = prev(state)
      break
  }
  return state
}
export const applicableRules = <J extends AnySequent>(
  state: Focus<J>,
): Array<RuleId> => {
  const p = activePath(state)
  const d = subDerivation(state.derivation, p)
  if (!d) {
    return []
  }
  return applicableRulesSequent(d.result)
}
