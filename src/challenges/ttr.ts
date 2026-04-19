import { AnyChallenge } from '../model/challenge'

export const ttrChallenges = {} satisfies Record<string, AnyChallenge>

export type TtrChallengeKey = keyof typeof ttrChallenges
