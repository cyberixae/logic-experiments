import { RuleId } from '../model/rule'
import { applyEvent as applyFocusEvent, focus } from '../interactive/focus'
import { Event } from '../interactive/event'
import { isProof, premise } from '../model/derivation'
import { head, isNonEmptyArray, last, NonEmptyArray } from '../utils/array'
import { entries, get, keys } from '../utils/record'
import { Focus } from './focus'
import { Configuration } from '../model/theorem'
import { AnySequent } from '../model/sequent'

export class Workspace<K extends string, C extends Record<K, Configuration<AnySequent>>> {
  private theorems: C
  private conjectures: Partial<{ [P in K]: Focus<C[P]['goal']> }> = {}
  private theoremKeys: NonEmptyArray<K>
  selected: K

  isSolved(): boolean {
    return isProof(this.currentConjecture().derivation)
  }

  constructor(challenges: C) {
    this.theorems = challenges
    const theoremKeys = keys(challenges)
    if (!isNonEmptyArray(theoremKeys)) {
      throw new Error('no challenges')
    }
    this.theoremKeys = theoremKeys
    this.selected = theoremKeys[0]
    this.selectConjecture(this.selected)
  }

  currentConjecture(): Focus<AnySequent> {
    return this.conjectures[this.selected] as Focus<AnySequent>
  }

  previousConjectureId(): K {
    const index = this.theoremKeys.findIndex((x) => x === this.selected)
    return this.theoremKeys[index - 1] ?? head(this.theoremKeys)
  }
  nextConjectureId(): K {
    const index = this.theoremKeys.findIndex((x) => x === this.selected)
    return this.theoremKeys[index + 1] ?? last(this.theoremKeys)
  }

  availableRules(): Array<RuleId> {
    return get(this.theorems, this.selected).rules
  }
  selectConjecture(id: K) {
    if (!(id in this.conjectures)) {
      const conf = get(this.theorems, id)
      this.conjectures[id] = focus(premise(conf.goal))
    }
    this.selected = id
  }
  listConjectures(): Array<[K, Configuration<AnySequent>]> {
    return entries(this.theorems)
  }
  isConjectureId(s: unknown): s is K {
    return typeof s === 'string' && s in this.theorems
  }
  applyEvent(ev: Event) {
    const cursor = this.currentConjecture()
    const update = applyFocusEvent(cursor, ev)
    this.conjectures[this.selected] = update
  }
}
