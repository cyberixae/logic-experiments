import { ttrCh11 } from './ttr-ch1-1'
import { ttrCh12 } from './ttr-ch1-2'
import { ttrCh13 } from './ttr-ch1-3'
import { ttrCh14 } from './ttr-ch1-4'
import { AnyChallenge } from '../model/challenge'

export const ttrChallenges = {
  ttrCh11,
  ttrCh12,
  ttrCh13,
  ttrCh14,
} satisfies Record<string, AnyChallenge>

export type TtrChallengeKey = keyof typeof ttrChallenges
