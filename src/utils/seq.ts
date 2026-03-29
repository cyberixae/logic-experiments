export type Seq<T> = () => Generator<T, void, undefined>

export const map = <A, B>(s: Seq<A>, f: (a: A) => B): Seq<B> =>
  function* () {
    const g = s()
    while (true) {
      const { done, value } = g.next()
      if (done) {
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
      if (done) {
        return
      }
      if (f(value)) {
        yield value
      }
    }
  }
