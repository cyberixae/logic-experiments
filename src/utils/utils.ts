export const assertEqual = <A, B>(a: A, b: B): A & B => {
  if (JSON.stringify(a) === JSON.stringify(b)) {
    return a as A & B
  }
  return assertNever(b as never)
}

export function assertNever<N extends never>(
  _n: N,
  s: string = 'Unexpected value',
): N {
  throw new Error(s)
}
