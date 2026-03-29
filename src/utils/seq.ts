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
