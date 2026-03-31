import { isNonEmptyArray } from './array'
import { Option } from './option'

export type Seq<T> = () => Generator<T, void, undefined>

export const empty = <T = never>(): Seq<T> => function* () {}

export const of = <A>(a: A): Seq<A> =>
  function* () {
    yield a
  }

export const map = <A, B>(s: Seq<A>, f: (a: A) => B): Seq<B> =>
  function* () {
    const g = s()
    while (true) {
      const { done, value } = g.next()
      if (done === true) {
        return
      }
      yield f(value)
    }
  }

export const flatMap = <A, B>(s: Seq<A>, f: (a: A) => Seq<B>): Seq<B> =>
  function* () {
    const g = s()
    while (true) {
      const { done, value } = g.next()
      if (done === true) {
        return
      }
      yield* f(value)()
    }
  }

export const filter = <A>(s: Seq<A>, f: (a: A) => boolean): Seq<A> =>
  function* () {
    const g = s()
    while (true) {
      const { done, value } = g.next()
      if (done === true) {
        return
      }
      if (f(value)) {
        yield value
      }
    }
  }

export const isEmpty = <A>(s: Seq<A>): boolean => {
  const g = s()
  const { done } = g.next()
  if (done === true) {
    return true
  }
  return false
}

export const fromNullable = <A>(a: A): Seq<NonNullable<A>> =>
  function* () {
    if (a === null) {
      return
    }
    if (typeof a === 'undefined') {
      return
    }
    yield a
  }

export const sequence = <T>(seqs: Array<Seq<T>>): Seq<Array<T>> =>
  function* () {
    if (!isNonEmptyArray(seqs)) {
      yield []
      return
    }
    const [first, ...rest] = seqs
    for (const t of first()) {
      for (const ts of sequence(rest)()) {
        yield [t, ...ts]
      }
    }
  }

export const head = <A>(s: Seq<A>): Option<A> => {
  const g = s()
  const { done, value } = g.next()
  if (done === true) {
    return []
  }
  return [value]
}

export const sequenceT = <A, B>(t: [Seq<A>, Seq<B>]): Seq<[A, B]> =>
  sequence(t as Array<Seq<A | B>>) as Seq<[A, B]>
