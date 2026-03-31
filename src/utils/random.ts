export const split = (x: number) => (): [number, number] => {
  const rand = Math.random()
  const y = Math.floor(rand * x)
  return [y, x - y]
}
