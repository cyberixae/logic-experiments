import { harmaaPuolukkaTiikeri } from './harmaa-puolukka-tiikeri'
import { violettiLuumuBiisoni } from './violetti-luumu-biisoni'
import { syaaniPaprikaKettu } from './syaani-paprika-kettu'
import { ch0identity1 } from './ch0-identity-1'
import { ch0identity2 } from './ch0-identity-2'
import { ch0identity3 } from './ch0-identity-3'
import { ch0identity4 } from './ch0-identity-4'
import { ch0identity5 } from './ch0-identity-5'
import { ch0identity6 } from './ch0-identity-6'
import { ch0identity7 } from './ch0-identity-7'
import { ch0identity8 } from './ch0-identity-8'

export const theorems = {
  ch0identity1,
  ch0identity2,
  ch0identity3,
  ch0identity4,
  ch0identity5,
  ch0identity6,
  ch0identity7,
  ch0identity8,
  harmaaPuolukkaTiikeri,
  violettiLuumuBiisoni,
  syaaniPaprikaKettu,
}
export type Theorems = typeof theorems
export const isTheoremKey = (k: string): k is keyof Theorems => k in theorems
