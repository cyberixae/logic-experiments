import { harmaaPuolukkaTiikeri } from './harmaa-puolukka-tiikeri'
import { violettiLuumuBiisoni } from './violetti-luumu-biisoni'
import { syaaniPaprikaKettu } from './syaani-paprika-kettu'

export const theorems = {
  harmaaPuolukkaTiikeri,
  violettiLuumuBiisoni,
  syaaniPaprikaKettu,
}
export type Theorems = typeof theorems
export const isTheoremKey = (k: string): k is keyof Theorems => k in theorems
