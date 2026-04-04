export const uniq = <T>(arr: Iterable<T>): Iterable<T> =>
  (function* () {
    const skip = new Set()
    const it = arr[Symbol.iterator]()
    while (true) {
      const { done, value } = it.next()
      if (done) {
        return
      }
      if (skip.has(value)) {
        continue
      }
      yield value
      skip.add(value)
    }
  })()
