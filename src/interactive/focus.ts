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
import {
  AnySequent,
  applicableRules as applicableRulesSequent,
} from '../model/sequent'
import { Event } from './event'
import { RuleId, TryReverse0, TryReverse1 } from '../model/rule'
import { ruleCL } from '../rules/cl'
import { ruleCL1 } from '../rules/cl1'
import { ruleCL2 } from '../rules/cl2'
import { ruleCR } from '../rules/cr'
import { ruleCut } from '../rules/cut'
import { ruleDL } from '../rules/dl'
import { ruleDR } from '../rules/dr'
import { ruleDR1 } from '../rules/dr1'
import { ruleDR2 } from '../rules/dr2'
import { ruleI } from '../rules/i'
import { ruleIL } from '../rules/il'
import { ruleIR } from '../rules/ir'
import { ruleNL } from '../rules/nl'
import { ruleNR } from '../rules/nr'
import { ruleSCL } from '../rules/scl'
import { ruleSCR } from '../rules/scr'
import { ruleSRotLB } from '../rules/srotlb'
import { ruleSRotLF } from '../rules/srotlf'
import { ruleSRotRB } from '../rules/srotrb'
import { ruleSRotRF } from '../rules/srotrf'
import { ruleSWL } from '../rules/swl'
import { ruleSWR } from '../rules/swr'
import { ruleSXL } from '../rules/sxl'
import { ruleSXR } from '../rules/sxr'

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

export const rev1 = {
  cut: ruleCut.tryReverse,
} satisfies Partial<Record<RuleId, TryReverse1>>

export const rev0 = {
  i: ruleI.tryReverse,
  cl: ruleCL.tryReverse,
  dr: ruleDR.tryReverse,
  cl1: ruleCL1.tryReverse,
  dr1: ruleDR1.tryReverse,
  cl2: ruleCL2.tryReverse,
  dr2: ruleDR2.tryReverse,
  dl: ruleDL.tryReverse,
  cr: ruleCR.tryReverse,
  il: ruleIL.tryReverse,
  ir: ruleIR.tryReverse,
  nl: ruleNL.tryReverse,
  nr: ruleNR.tryReverse,
  swl: ruleSWL.tryReverse,
  swr: ruleSWR.tryReverse,
  scl: ruleSCL.tryReverse,
  scr: ruleSCR.tryReverse,
  sRotLF: ruleSRotLF.tryReverse,
  sRotLB: ruleSRotLB.tryReverse,
  sRotRF: ruleSRotRF.tryReverse,
  sRotRB: ruleSRotRB.tryReverse,
  sxl: ruleSXL.tryReverse,
  sxr: ruleSXR.tryReverse,
} satisfies Partial<Record<RuleId, TryReverse0>>

export const revses = {
  rev0,
  rev1,
}

export const applyEvent = <J extends AnySequent>(
  state: Focus<J>,
  ev: Event,
): Focus<J> => {
  switch (ev.kind) {
    case 'reverse': {
      if (ev.rev === 'a1') {
        break
      }
      if (ev.rev === 'a2') {
        break
      }
      if (ev.rev === 'a3') {
        break
      }
      if (ev.rev === 'mp') {
        break
      }
      if (ev.rev === 'cut') {
        break
      }
      const edit = rev0[ev.rev]
      if (!edit) {
        break
      }
      state = apply(state, edit)
      break
    }
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
