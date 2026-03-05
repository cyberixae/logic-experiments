export type NonEmptyArray<A> = Array<A> & { 0: A }

export const isNonEmptyArray = <A>(a: Array<A>): a is NonEmptyArray<A> => {
  return a.hasOwnProperty(0)
}

export const init = <T>(arr: NonEmptyArray<T>): Array<T> =>
  arr.slice(0, -1) as Array<T>

export const zip = <A, B>(a: Array<A>, b: Array<B>): Array<[A, B]> => {
  return Array.from({ length: Math.min(a.length, b.length) }).map(
    (_, i) => [a.at(i), b.at(i)] as [A, B],
  )
}

export const mod = <T>(arr: NonEmptyArray<T>, index: number): T => {
  return arr[Math.floor(index) % arr.length] as T
}

export const replaceItem = <T>(
  arr: Array<T>,
  index: number,
  item: T,
): Array<T> | null => {
  const before = arr.slice(0, index)
  const after = arr.slice(index + 1)
  const tmp = [...before, item, ...after]
  if (tmp.length !== arr.length) {
    return null
  }
  return tmp
}
