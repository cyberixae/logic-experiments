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

import { ch2permutation1 } from './ch2-permutation-1'
import { ch2permutation2 } from './ch2-permutation-2'
import { ch2permutation3 } from './ch2-permutation-3'
import { ch2permutation4 } from './ch2-permutation-4'
import { ch2permutation5 } from './ch2-permutation-5'
import { ch2permutation6 } from './ch2-permutation-6'
import { ch2permutation7 } from './ch2-permutation-7'
import { ch2permutation8 } from './ch2-permutation-8'
import { ch2permutation9 } from './ch2-permutation-9'

import { ch3negation1 } from './ch3-negation-1'
import { ch3negation2 } from './ch3-negation-2'
import { ch3negation3 } from './ch3-negation-3'
import { ch3negation4 } from './ch3-negation-4'
import { ch3negation5 } from './ch3-negation-5'
import { ch3negation6 } from './ch3-negation-6'
import { ch3negation7 } from './ch3-negation-7'
import { ch3negation8 } from './ch3-negation-8'
import { ch3negation9 } from './ch3-negation-9'

import { ch4theorem1 } from './ch4-theorem-1'
import { ch4theorem2 } from './ch4-theorem-2'
import { ch4theorem3 } from './ch4-theorem-3'
import { ch4theorem4 } from './ch4-theorem-4'
import { ch4theorem5 } from './ch4-theorem-5'
import { ch4theorem6 } from './ch4-theorem-6'
import { ch4theorem7 } from './ch4-theorem-7'
import { ch4theorem8 } from './ch4-theorem-8'
import { ch4theorem9 } from './ch4-theorem-9'

import { ch5composition1 } from './ch5-composition-1'
import { ch5composition2 } from './ch5-composition-2'
import { ch5composition3 } from './ch5-composition-3'
import { ch5composition4 } from './ch5-composition-4'
import { ch5composition5 } from './ch5-composition-5'
import { ch5composition6 } from './ch5-composition-6'
import { ch5composition7 } from './ch5-composition-7'
import { ch5composition8 } from './ch5-composition-8'
import { ch5compositionC } from './ch5-composition-c'
import { ch5compositionE } from './ch5-composition-e'

import { ch6branching1 } from './ch6-branching-1'

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

  ch2permutation1,
  ch2permutation2,
  ch2permutation3,
  ch2permutation4,
  ch2permutation5,
  ch2permutation6,
  ch2permutation7,
  ch2permutation8,
  ch2permutation9,

  ch3negation1,
  ch3negation2,
  ch3negation3,
  ch3negation4,
  ch3negation5,
  ch3negation6,
  ch3negation7,
  ch3negation8,
  ch3negation9,

  ch4theorem1,
  ch4theorem2,
  ch4theorem3,
  ch4theorem4,
  ch4theorem5,
  ch4theorem6,
  ch4theorem7,
  ch4theorem8,
  ch4theorem9,

  ch5composition1,
  ch5composition2,
  ch5composition3,
  ch5composition4,
  ch5composition5,
  ch5composition6,
  ch5composition7,
  ch5composition8,

  ch6branching1,

  // ch5compositionC,
  // ch5compositionE,
  // harmaaPuolukkaTiikeri,
  // violettiLuumuBiisoni,
  // syaaniPaprikaKettu,
}
export type Theorems = typeof theorems
export const isTheoremKey = (k: string): k is keyof Theorems => k in theorems
