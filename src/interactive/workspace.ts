import { RuleId } from '../model/rule'
import { applyEvent, focus } from '../interactive/focus'
import { Event } from '../interactive/event'
import { isProof, premise } from '../model/derivation'
import { head, isNonEmptyArray, last, NonEmptyArray } from '../utils/array'
import { entries, get, keys } from '../utils/record'
import { Focus, applicableRules } from './focus'
import { Configuration } from '../model/theorem'
import { AnySequent, conclusion } from '../model/sequent'
import { randomTautology } from '../model/prop'

export class Workspace<
  K extends string,
  C extends Record<K, Configuration<AnySequent>>,
> {
  private theorems: C
  private conjectures: Partial<{ [P in K]: Focus<C[P]['goal']> }> = {}
  private theoremKeys: NonEmptyArray<K>
  private custom: Focus<AnySequent> | null = null
  selected: K | null

  isSolved(): boolean {
    const well = isProof(this.currentConjecture().derivation)
    if (!this.selected && well) {
      this.selectCustom()
    }
    return well
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
    if (!this.selected) {
      return this.custom as Focus<AnySequent>
    }
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
    if (!this.selected) {
      return [
        'i',
        'f',
        'v',
        'swl',
        'swr',
        'sRotLF',
        'sRotRF',
        'sRotLB',
        'sRotRB',
        'nl',
        'nr',
        'cl',
        'cr',
        'dl',
        'dr',
        'il',
        'ir',
      ]
    }
    return get(this.theorems, this.selected).rules
  }
  applicableRules(): Array<RuleId> {
    const available = this.availableRules()
    const appplicable = applicableRules(this.currentConjecture())
    return available.filter((rule) => appplicable.includes(rule))
  }
  selectConjecture(id: K) {
    if (!(id in this.conjectures)) {
      const conf = get(this.theorems, id)
      this.conjectures[id] = focus(premise(conf.goal))
    }
    this.selected = id
  }
  selectCustom() {
    this.custom = focus(premise(conclusion(randomTautology())))
    this.selected = null
  }
  listConjectures(): Array<[K, Configuration<AnySequent>]> {
    return entries(this.theorems)
  }
  isConjectureId(s: unknown): s is K {
    return typeof s === 'string' && s in this.theorems
  }
  applyEvent(ev: Event) {
    const cursor = this.currentConjecture()
    const update = applyEvent(cursor, ev)
    if (!this.selected) {
      this.custom = update
    } else {
      this.conjectures[this.selected] = update
    }
  }
}
