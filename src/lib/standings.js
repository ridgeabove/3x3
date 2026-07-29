import { RULES } from './rules'

/**
 * FIBA 3x3 group standings: 2 points for a win, 1 for a loss.
 * Ties break on head-to-head, then point difference, then points scored.
 */
export function computeStandings(teams, matches) {
  const rows = new Map(
    teams.map((team) => [
      team.id,
      {
        team,
        played: 0,
        won: 0,
        lost: 0,
        scored: 0,
        against: 0,
        points: 0,
        beat: new Set(),
      },
    ])
  )

  for (const m of matches) {
    if (m.status !== 'finished') continue
    const home = rows.get(m.home_team_id)
    const away = rows.get(m.away_team_id)
    if (!home || !away) continue

    home.played += 1
    away.played += 1
    home.scored += m.home_score
    home.against += m.away_score
    away.scored += m.away_score
    away.against += m.home_score

    const homeWon = m.winner_team_id
      ? m.winner_team_id === m.home_team_id
      : m.home_score > m.away_score

    if (homeWon) {
      home.won += 1
      away.lost += 1
      home.points += RULES.POINTS_WIN
      away.points += RULES.POINTS_LOSS
      home.beat.add(away.team.id)
    } else {
      away.won += 1
      home.lost += 1
      away.points += RULES.POINTS_WIN
      home.points += RULES.POINTS_LOSS
      away.beat.add(home.team.id)
    }
  }

  return [...rows.values()]
    .map((r) => ({ ...r, diff: r.scored - r.against }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      // head to head, only meaningful when exactly two teams are level
      if (a.beat.has(b.team.id) && !b.beat.has(a.team.id)) return -1
      if (b.beat.has(a.team.id) && !a.beat.has(b.team.id)) return 1
      if (b.diff !== a.diff) return b.diff - a.diff
      if (b.scored !== a.scored) return b.scored - a.scored
      return a.team.name.localeCompare(b.team.name)
    })
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

/** Round-robin fixture list: every team plays every other team once. */
export function roundRobin(teamIds) {
  const pairs = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairs.push([teamIds[i], teamIds[j]])
    }
  }
  return pairs
}
