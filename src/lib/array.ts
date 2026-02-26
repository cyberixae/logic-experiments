export type NonEmptyArray<A> = Array<A> & { 0: A }
export const isNonEmptyArray = <A>(a: Array<A>): a is NonEmptyArray<A> => {
  return a.hasOwnProperty(0)
}

export const head = <H>(a: [H, ...Array<unknown>]): H => {
  const [h] = a
  return h
}

export const tail = <T extends Array<unknown>>(a: [unknown, ...T]): T => {
  const [_h, ...t] = a
  return t
}

export const init = <I extends Array<unknown>>(a: [...I, unknown]): I => {
  return a.slice(0, -1) as I
}

export const last = <L>(a: [...NonEmptyArray<unknown>, L]): L => {
  return a[a.length - 1] as L
}
export const zip = <A, B>(a: Array<A>, b: Array<B>): Array<[A, B]> => {
  return Array.from({ length: Math.min(a.length, b.length) }).map(
    (_, i) => [a.at(i), b.at(i)] as [A, B],
  )
}

export const isTupleOf1 = <A>(arr: Array<A>): arr is [A] => arr.length === 1

export const replaceItem = <T>(
  arr: Array<T>,
  index: number,
  item: T,
): Array<T> | null => {
  const before = arr.slice(0, index - 1)
  const after = arr.slice(index)
  const tmp = [...before, item, ...after]
  if (tmp.length !== arr.length) {
    return null
  }
  return tmp
}
