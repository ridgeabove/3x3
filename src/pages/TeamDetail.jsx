import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { supabase } from '../lib/supabase'
import { Band, Crest, EmptyState } from '../components/ui'
import { TeamDetailSkeleton } from '../components/Skeletons'
import MatchList from '../components/MatchList'

/** Total points each player has scored across the whole tournament. */
function usePlayerPoints(teamId) {
  const [points, setPoints] = useState(new Map())

  useEffect(() => {
    let alive = true
    if (!teamId) return

    supabase
      .from('match_events')
      .select('player_id, points')
      .eq('team_id', teamId)
      .eq('kind', 'point')
      .then(({ data }) => {
        if (!alive || !data) return
        const map = new Map()
        for (const row of data) {
          if (!row.player_id) continue
          map.set(row.player_id, (map.get(row.player_id) ?? 0) + row.points)
        }
        setPoints(map)
      })

    return () => {
      alive = false
    }
  }, [teamId])

  return points
}

function StatBox({ label, value, tone = 'default' }) {
  return (
    <div className="flex flex-col items-center gap-0.5 border-2 border-line bg-panel px-2 py-2.5">
      <span
        className={`stamp text-[20px] leading-none tnum ${
          tone === 'brand' ? 'text-brand' : 'text-fg'
        }`}
      >
        {value}
      </span>
      <span className="stamp text-[10px] leading-none text-fg-dim">{label}</span>
    </div>
  )
}

export default function TeamDetail() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { t, pick } = useI18n()
  const { teamById, groupById, divisionById, playersByTeam, matches, loading } = useData()
  const playerPoints = usePlayerPoints(teamId)

  if (loading) return <TeamDetailSkeleton />

  const team = teamById.get(teamId)
  if (!team) return <EmptyState title={t('noData')} />

  const group = groupById.get(team.group_id)
  const division = divisionById.get(team.division_id)
  const roster = playersByTeam.get(team.id) ?? []
  const teamMatches = matches.filter(
    (m) => m.home_team_id === team.id || m.away_team_id === team.id
  )

  const finished = teamMatches.filter((m) => m.status === 'finished')
  const won = finished.filter((m) => m.winner_team_id === team.id).length
  const scored = finished.reduce(
    (sum, m) => sum + (m.home_team_id === team.id ? m.home_score : m.away_score),
    0
  )
  const against = finished.reduce(
    (sum, m) => sum + (m.home_team_id === team.id ? m.away_score : m.home_score),
    0
  )

  return (
    <>
      <div className="flex items-center gap-2 border-b-2 border-line bg-panel px-2 py-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('back')}
          className="press flex min-h-11 min-w-11 items-center justify-center text-fg-mid"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <span className="stamp truncate text-[12px] text-fg-dim">
          {division ? pick(division, 'name') : ''}
        </span>
      </div>

      <section className="flex items-center gap-3 border-b-2 border-brand bg-panel px-3 py-4">
        <Crest name={team.name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-[20px] text-fg">{team.name}</h1>
          <p className="text-[12px] text-fg-dim">
            {group ? `${t('group')} ${group.name}` : t('noGroup')} · {roster.length}{' '}
            {t('players')}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-2 p-3">
        <StatBox label={t('standingsPlayed')} value={finished.length} />
        <StatBox label={t('standingsWon')} value={won} tone="brand" />
        <StatBox label={t('standingsScored')} value={scored} />
        <StatBox label={t('standingsAgainst')} value={against} />
      </div>

      <Band right={`${roster.length}`}>{t('roster')}</Band>
      <ul>
        {roster.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between border-b border-line px-3 py-2.5"
          >
            <span className="min-w-0 truncate text-[14px] text-fg-mid">{p.name}</span>
            <span className="stamp shrink-0 text-[13px] tnum text-brand">
              {playerPoints.get(p.id) ?? 0}
              <span className="ml-1 text-[10px] text-fg-dim">{t('points')}</span>
            </span>
          </li>
        ))}
      </ul>

      {teamMatches.length > 0 && (
        <div className="mt-3">
          <Band tone="brand">{t('teamMatches')}</Band>
          <MatchList matches={teamMatches} showDivisionBand={false} />
        </div>
      )}
    </>
  )
}
