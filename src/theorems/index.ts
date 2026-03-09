import { harmaaPuolukkaTiikeri } from './harmaa-puolukka-tiikeri'
import { violettiLuumuBiisoni } from './violetti-luumu-biisoni'

export const theorems = {
  harmaaPuolukkaTiikeri ,
  violettiLuumuBiisoni ,
}
export type Theorems = typeof theorems
export const isTheoremKey = (k: string): k is keyof Theorems => k in theorems
