import { splitAt } from './number'

export const split = (x: number) => (): [number, number] => {
  return splitAt(x, Math.random())
}
