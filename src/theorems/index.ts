import { example } from './example'
import { imp } from './imp'

export const theorems = {
  example,
  imp,
}
export type Theorems = typeof theorems
export const isTheoremKey = (k: string): k is keyof Theorems => k in theorems
