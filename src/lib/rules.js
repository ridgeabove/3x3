/**
 * FIBA 3x3 rules, in one place.
 * https://fiba3x3.com (official rules of the game).
 */
export const RULES = {
  /** Regulation length: 10 minutes of running clock. */
  REGULATION_SECONDS: 600,
  /** First team to 21 wins immediately, even with time left. */
  TARGET_SCORE: 21,
  /** Overtime is untimed in practice: first to 2 points wins. */
  OVERTIME_SECONDS: 120,
  OVERTIME_TARGET: 2,
  /** 12-second shot clock. */
  SHOT_CLOCK_MS: 12000,
  /** One timeout per team. */
  TIMEOUTS_PER_TEAM: 1,
  /** Team fouls 7, 8 and 9 → two free throws. */
  FOUL_PENALTY_FROM: 7,
  /** Team foul 10 and beyond → two free throws + possession. */
  FOUL_PENALTY_PLUS_POSSESSION_FROM: 10,
  /** Group stage points: win 2, loss 1, forfeit 0 (FIBA 3x3 standings). */
  POINTS_WIN: 2,
  POINTS_LOSS: 1,
}

/**
 * What happens on the next foul against a team, given its current team-foul count.
 * Returns a key the UI translates, or null while the team is still under the limit.
 */
export function foulPenalty(fouls) {
  if (fouls >= RULES.FOUL_PENALTY_PLUS_POSSESSION_FROM) return 'ftPlusPossession'
  if (fouls >= RULES.FOUL_PENALTY_FROM) return 'freeThrows'
  return null
}

export const STAGES = ['group', 'qf', 'sf', 'third', 'final']

export const KNOCKOUT_STAGES = ['qf', 'sf', 'third', 'final']
