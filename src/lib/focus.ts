import * as array from './array'
import {
  Derivation,
  Edit,
  editDerivation,
  lsDerivation,
  Path,
  premise,
} from './derivation'
import { AnyJudgement } from './judgement'

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
