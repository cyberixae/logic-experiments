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
import { ch0identity9 } from './ch0-identity-9'

import { ch1weakening1 } from './ch1-weakening-1'
import { ch1weakening2 } from './ch1-weakening-2'
import { ch1weakening3 } from './ch1-weakening-3'
import { ch1weakening4 } from './ch1-weakening-4'
import { ch1weakening5 } from './ch1-weakening-5'
import { ch1weakening6 } from './ch1-weakening-6'
import { ch1weakening7 } from './ch1-weakening-7'
import { ch1weakening8 } from './ch1-weakening-8'
import { ch1weakening9 } from './ch1-weakening-9'

export const theorems = {
  ch0identity1,
  ch0identity2,
  ch0identity3,
  ch0identity4,
  ch0identity5,
  ch0identity6,
  ch0identity7,
  ch0identity8,
  ch0identity9,

  ch1weakening1,
  ch1weakening2,
  ch1weakening3,
  ch1weakening4,
  ch1weakening5,
  ch1weakening6,
  ch1weakening7,
  ch1weakening8,
  ch1weakening9,

  harmaaPuolukkaTiikeri,
  violettiLuumuBiisoni,
  syaaniPaprikaKettu,
}
export type Theorems = typeof theorems
export const isTheoremKey = (k: string): k is keyof Theorems => k in theorems
