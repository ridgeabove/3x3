import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, AlertTriangle, Hand, Timer } from 'lucide-react'
import { useI18n, stageLabel } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { useMatch } from '../hooks/useTournament'
import { RULES, foulPenalty } from '../lib/rules'
import { formatClock, formatShotClock, remainingMs, shotClockMs, useTicker } from '../lib/clock'
import { timeLabel, shortDate } from '../lib/dates'
import { Band, Crest, LiveBadge, Spinner, ErrorState, EmptyState } from '../components/ui'

function Clocks({ match }) {
  const { t } = useI18n()
  const running = match.clock_status === 'running'
  useTicker(running, 100)

  const ms = remainingMs(match)
  const shot = shotClockMs(match)
  const low = ms <= 60000

  if (match.status === 'finished') {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="stamp bg-brand px-2 py-1 text-[12px] leading-none text-brand-ink">
          {t('finished')}
        </span>
        {match.is_overtime && (
          <span className="stamp text-[10px] text-fg-dim">{t('overtime')}</span>
        )}
      </div>
    )
  }

  if (match.status === 'scheduled') {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="stamp text-[22px] leading-none tnum text-fg">
          {timeLabel(match.scheduled_at)}
        </span>
        <span className="stamp text-[10px] text-fg-dim">
          {match.scheduled_at ? shortDate(match.scheduled_at) : t('tbd')}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`stamp text-[30px] leading-none tnum ${low ? 'text-red' : 'text-fg'}`}
        aria-live="off"
      >
        {formatClock(ms, { tenths: false })}
      </span>
      <LiveBadge>{match.is_overtime ? t('overtime') : t('live')}</LiveBadge>
      <span className="stamp mt-0.5 flex items-center gap-1 text-[10px] text-fg-dim">
        <Timer aria-hidden="true" className="h-3 w-3" />
        <span className="tnum">{formatShotClock(shot)}</span>
      </span>
    </div>
  )
}

function TeamColumn({ name, isWinner }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <Crest name={name} size="lg" />
      <span
        className={`stamp line-clamp-2 text-center text-[12px] leading-tight ${
          isWinner ? 'text-brand' : 'text-fg-mid'
        }`}
      >
        {name}
      </span>
    </div>
  )
}

function FoulRow({ label, fouls, timeoutsUsed }) {
  const { t } = useI18n()
  const penalty = foulPenalty(fouls)

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-[13px] text-fg-mid">{label}</span>
      <span className="stamp flex items-center gap-1 text-[12px] text-fg-dim">
        <Hand aria-hidden="true" className="h-3.5 w-3.5" />
        <span className="tnum text-fg">{fouls}</span>
      </span>
      <span className="stamp flex items-center gap-1 text-[12px] text-fg-dim">
        <Clock aria-hidden="true" className="h-3.5 w-3.5" />
        <span className="tnum text-fg">
          {RULES.TIMEOUTS_PER_TEAM - timeoutsUsed}
        </span>
      </span>
      {penalty && (
        <span className="stamp flex items-center gap-1 bg-red px-1.5 py-0.5 text-[10px] leading-none text-white">
          <AlertTriangle aria-hidden="true" className="h-3 w-3" />
          {t(penalty)}
        </span>
      )}
    </div>
  )
}

function EventFeed({ events, teamById, playerById, match }) {
  const { t } = useI18n()

  if (!events.length) {
    return <EmptyState title={t('noEvents')} icon={Clock} />
  }

  return (
    <ul>
      {events.map((e) => {
        const team = teamById.get(e.team_id)
        const player = playerById.get(e.player_id)
        const isHome = e.team_id === match.home_team_id

        const kindLabel =
          e.kind === 'point'
            ? `+${e.points} ${t('addPoint')}`
            : e.kind === 'foul'
              ? t('foul')
              : t('timeout')

        return (
          <li
            key={e.id}
            className="flex items-center gap-2.5 border-b border-line px-3 py-2 text-[13px]"
          >
            <span className="stamp w-11 shrink-0 text-[11px] tnum text-fg-dim">
              {formatClock(e.clock_ms ?? 0, { tenths: false })}
            </span>
            <span
              aria-hidden="true"
              className={`h-6 w-0.5 shrink-0 ${isHome ? 'bg-brand' : 'bg-line-strong'}`}
            />
            <span
              className={`stamp w-14 shrink-0 text-[11px] ${
                e.kind === 'point' ? 'text-brand' : 'text-fg-dim'
              }`}
            >
              {kindLabel}
            </span>
            <span className="min-w-0 flex-1 truncate text-fg-mid">
              {player?.name ?? team?.name ?? '-'}
              {player && team && (
                <span className="ml-1.5 text-[11px] text-fg-dim">({team.name})</span>
              )}
            </span>
            {e.is_overtime && (
              <span className="stamp shrink-0 text-[10px] text-red">OT</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function Roster({ team, players, events }) {
  const { t } = useI18n()
  if (!team) return null

  const pointsByPlayer = new Map()
  for (const e of events) {
    if (e.kind !== 'point' || !e.player_id) continue
    pointsByPlayer.set(e.player_id, (pointsByPlayer.get(e.player_id) ?? 0) + e.points)
  }

  return (
    <div>
      <Band>{team.name}</Band>
      <ul>
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between border-b border-line px-3 py-2 text-[13px]"
          >
            <span className="min-w-0 truncate text-fg-mid">{p.name}</span>
            <span className="stamp shrink-0 text-[12px] tnum text-brand">
              {pointsByPlayer.get(p.id) ?? 0}
              <span className="ml-1 text-[10px] text-fg-dim">{t('points')}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function MatchDetail() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { teamById, groupById, playerById, playersByTeam } = useData()
  const { match, events, loading, error, reload } = useMatch(matchId)

  if (loading) return <Spinner />
  if (error === 'not-found') {
    return <EmptyState title={t('noData')} action={<Link to="/" className="stamp mt-3 text-brand">{t('back')}</Link>} />
  }
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!match) return null

  const home = teamById.get(match.home_team_id)
  const away = teamById.get(match.away_team_id)
  const homeName = home?.name ?? match.home_label ?? t('tbd')
  const awayName = away?.name ?? match.away_label ?? t('tbd')
  const group = groupById.get(match.group_id)

  const homeWon = match.status === 'finished' && match.winner_team_id === match.home_team_id
  const awayWon = match.status === 'finished' && match.winner_team_id === match.away_team_id
  const isLive = match.status === 'live'

  return (
    <>
      {/* context bar */}
      <div className="flex items-center gap-2 border-b-2 border-line bg-panel px-2 py-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('back')}
          className="press flex min-h-11 min-w-11 items-center justify-center text-fg-mid"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="stamp truncate text-[12px] text-fg">
            {stageLabel(t, match.stage)}
            {group && ` · ${t('group')} ${group.name}`}
            {match.slot_label && ` · ${match.slot_label}`}
          </p>
          <p className="flex items-center gap-2 text-[11px] text-fg-dim">
            {match.court && (
              <span className="flex items-center gap-1">
                <MapPin aria-hidden="true" className="h-3 w-3" />
                {match.court}
              </span>
            )}
            {match.scheduled_at && (
              <span className="tnum">
                {shortDate(match.scheduled_at)} {timeLabel(match.scheduled_at)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* scoreboard */}
      <section
        className={`border-b-2 px-3 py-4 ${isLive ? 'border-red bg-panel' : 'border-line bg-panel'}`}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <TeamColumn name={homeName} align="" isWinner={homeWon} />
          <Clocks match={match} />
          <TeamColumn name={awayName} align="" isWinner={awayWon} />
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <span
            className={`stamp text-center text-[46px] leading-none tnum ${
              homeWon ? 'text-brand' : isLive ? 'text-fg' : 'text-fg-mid'
            }`}
          >
            {match.home_score}
          </span>
          <span aria-hidden="true" className="stamp text-[20px] text-line-strong">
            :
          </span>
          <span
            className={`stamp text-center text-[46px] leading-none tnum ${
              awayWon ? 'text-brand' : isLive ? 'text-fg' : 'text-fg-mid'
            }`}
          >
            {match.away_score}
          </span>
        </div>

        {match.status !== 'finished' && (
          <p className="mt-2 text-center text-[11px] text-fg-dim">
            {t('firstTo')} {match.target_score} · {Math.round(match.duration_seconds / 60)}′
          </p>
        )}
      </section>

      {/* fouls + timeouts */}
      <Band>{t('teamFouls')}</Band>
      <div className="divide-y divide-line border-b-2 border-line">
        <FoulRow
          label={homeName}
          fouls={match.home_fouls}
          timeoutsUsed={match.home_timeouts_used}
        />
        <FoulRow
          label={awayName}
          fouls={match.away_fouls}
          timeoutsUsed={match.away_timeouts_used}
        />
      </div>

      {/* play by play */}
      <Band right={String(events.length)}>{t('playByPlay')}</Band>
      <EventFeed events={events} teamById={teamById} playerById={playerById} match={match} />

      {/* rosters */}
      <div className="mt-3">
        <Roster team={home} players={playersByTeam.get(match.home_team_id) ?? []} events={events} />
        <Roster team={away} players={playersByTeam.get(match.away_team_id) ?? []} events={events} />
      </div>
    </>
  )
}
