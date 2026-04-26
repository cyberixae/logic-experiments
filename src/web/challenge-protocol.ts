import { Configuration } from '../model/challenge'
import { RandomConfig } from '../random/config'
import { RuleId } from '../model/rule'
import { AnySequent } from '../model/sequent'

export type ChallengeResult = {
  challenge: Configuration<AnySequent, ReadonlyArray<RuleId>>
  nonStructuralCount: number
  bypassed: boolean
  formulasTried: number
}

export type StatsMessage = {
  type: 'stats'
  formulasTried: number
  tautologiesFound: number
  solved: number
}

export type ChallengeMessage =
  | { type: 'challenge'; result: ChallengeResult }
  | StatsMessage

export type ControlMessage =
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'configure'; config: RandomConfig }
  | { type: 'timeout'; ms: number }

export const serializeConfig = (config: RandomConfig): RandomConfig => config

export const deserializeConfig = (config: RandomConfig): RandomConfig => config
