import { AnyChallenge } from '../model/challenge'
import { ttrCh0_1 } from './ttr-ch0-axiom-1'
import { ttrCh1_1 } from './ttr-ch1-symbols-1'
import { ttrCh1_2 } from './ttr-ch1-symbols-2'
import { ttrCh1_3 } from './ttr-ch1-symbols-3'
import { ttrCh1_4 } from './ttr-ch1-symbols-4'
import { ttrCh1_5 } from './ttr-ch1-symbols-5'
import { ttrCh1_6 } from './ttr-ch1-symbols-6'
import { ttrCh2_1 } from './ttr-ch2-formulas-1'
import { ttrCh2_2 } from './ttr-ch2-formulas-2'
import { ttrCh2_3 } from './ttr-ch2-formulas-3'
import { ttrCh2_4 } from './ttr-ch2-formulas-4'
import { ttrCh2_5 } from './ttr-ch2-formulas-5'
import { ttrCh2_6 } from './ttr-ch2-formulas-6'
import { ttrCh3_1 } from './ttr-ch3-sequences-1'
import { ttrCh3_2 } from './ttr-ch3-sequences-2'
import { ttrCh3_3 } from './ttr-ch3-sequences-3'
import { ttrCh3_4 } from './ttr-ch3-sequences-4'
import { ttrCh3_5 } from './ttr-ch3-sequences-5'
import { ttrCh3_6 } from './ttr-ch3-sequences-6'

export const ttrChallenges = {
  'ttr-ch0-1': ttrCh0_1,
  'ttr-ch1-1': ttrCh1_1,
  'ttr-ch1-2': ttrCh1_2,
  'ttr-ch1-3': ttrCh1_3,
  'ttr-ch1-4': ttrCh1_4,
  'ttr-ch1-5': ttrCh1_5,
  'ttr-ch1-6': ttrCh1_6,
  'ttr-ch2-1': ttrCh2_1,
  'ttr-ch2-2': ttrCh2_2,
  'ttr-ch2-3': ttrCh2_3,
  'ttr-ch2-4': ttrCh2_4,
  'ttr-ch2-5': ttrCh2_5,
  'ttr-ch2-6': ttrCh2_6,
  'ttr-ch3-1': ttrCh3_1,
  'ttr-ch3-2': ttrCh3_2,
  'ttr-ch3-3': ttrCh3_3,
  'ttr-ch3-4': ttrCh3_4,
  'ttr-ch3-5': ttrCh3_5,
  'ttr-ch3-6': ttrCh3_6,
} satisfies Record<string, AnyChallenge>

export type TtrChallengeKey = keyof typeof ttrChallenges
