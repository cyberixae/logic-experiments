import { RuleId } from '../model/rule'
import { applyEvent, activeSequent, focus } from '../interactive/focus'
import { Event } from '../interactive/event'
import { isProof, premise } from '../model/derivation'
import { head, isNonEmptyArray, last, NonEmptyArray } from '../utils/array'
import { entries, get, keys } from '../utils/record'
import { Focus, applicableRules } from './focus'
import { Configuration } from '../model/challenge'
import { AnySequent } from '../model/sequent'

export type Gaze = { side: 'left' | 'right'; index: number }

export class Workspace<
  K extends string,
  C extends Record<K, Configuration<AnySequent>>,
> {
  private theorems: C
  private conjectures: Partial<{ [P in K]: Focus<C[P]['goal']> }> = {}
  private theoremKeys: NonEmptyArray<K>
  selected: K
  private _gaze: Gaze | null = null

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
    const c = this.conjectures[this.selected]
    if (c) return c
    console.warn(`Conjecture '${this.selected}' not initialized, recovering`)
    const conf = get(this.theorems, this.selected)
    const f = focus(premise(conf.goal))
    this.conjectures[this.selected] = f
    return f
  }

  previousConjectureId(): K {
    const index = this.theoremKeys.findIndex((x) => x === this.selected)
    return this.theoremKeys[index - 1] ?? head(this.theoremKeys)
  }
  nextConjectureId(): K {
    const index = this.theoremKeys.findIndex((x) => x === this.selected)
    return this.theoremKeys[index + 1] ?? last(this.theoremKeys)
  }

  availableRules(): ReadonlyArray<RuleId> {
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
  listConjectures(): Array<[K, Configuration<AnySequent>]> {
    return entries(this.theorems)
  }
  isConjectureId(s: unknown): s is K {
    return typeof s === 'string' && s in this.theorems
  }
  applyEvent(ev: Event) {
    const cursor = this.currentConjecture()
    const update = applyEvent(cursor, ev)
    this.conjectures[this.selected] = update
    this._gaze = null
  }

  gaze(): Gaze {
    if (this._gaze) return this._gaze
    return this.defaultGaze()
  }

  private defaultGaze(): Gaze {
    const seq = activeSequent(this.currentConjecture())
    if (seq.antecedent.length > 0) {
      return { side: 'left', index: seq.antecedent.length - 1 }
    }
    if (seq.succedent.length > 0) {
      return { side: 'right', index: 0 }
    }
    return { side: 'left', index: 0 }
  }

  moveGaze(direction: -1 | 1) {
    const seq = activeSequent(this.currentConjecture())
    const ant = seq.antecedent.length
    const suc = seq.succedent.length
    const total = ant + suc
    if (total === 0) {
      this._gaze = null
      return
    }
    const current = this._gaze ?? this.defaultGaze()
    const linear =
      current.side === 'left' ? current.index : ant + current.index
    const next = (linear + direction + total) % total
    this._gaze =
      next < ant
        ? { side: 'left', index: next }
        : { side: 'right', index: next - ant }
  }
}
