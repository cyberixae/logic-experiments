export type NonEmptyArray<A> = ReadonlyArray<A> & { 0: A }
export const isNonEmptyArray = <A>(
  a: ReadonlyArray<A>,
): a is NonEmptyArray<A> => {
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
