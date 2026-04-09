export const splitAt = (x: number, fraction: number): [number, number] => {
  const y = Math.floor(fraction * x)
  return [y, x - y]
}
