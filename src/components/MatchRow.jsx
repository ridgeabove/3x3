import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { formatClock, remainingMs, useTicker } from '../lib/clock'
import { timeLabel } from '../lib/dates'
import { Crest } from './ui'

/** Live game clock that ticks on its own, wherever it's dropped. */
export function RunningClock({ match, className = '' }) {
  const running = match.clock_status === 'running'
  useTicker(running, 200)
  const ms = remainingMs(match)

  return (
    <span className={`tnum stamp ${className}`}>
      {formatClock(ms, { tenths: false })}
      {running && <span className="live-dot ml-0.5 text-red">'</span>}
    </span>
  )
}

function StatusCell({ match }) {
  const { t } = useI18n()

  if (match.status === 'live') {
    return (
      <div className="flex w-14 shrink-0 flex-col items-center gap-0.5">
        <RunningClock match={match} className="text-[13px] text-red" />
        <span className="stamp text-[9px] leading-none text-red">
          {match.is_overtime ? t('overtime') : t('live')}
        </span>
      </div>
    )
  }

  if (match.status === 'finished') {
    return (
      <div className="flex w-14 shrink-0 flex-col items-center gap-0.5">
        <span className="stamp text-[12px] text-fg-dim">{timeLabel(match.scheduled_at)}</span>
        <span className="stamp text-[9px] leading-none text-fg-dim">
          {match.is_overtime ? t('overtime') : t('finished').slice(0, 4)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex w-14 shrink-0 flex-col items-center">
      <span className="stamp text-[13px] tnum text-fg-mid">{timeLabel(match.scheduled_at)}</span>
    </div>
  )
}

function TeamLine({ name, score, isWinner, isLive, showScore }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Crest name={name} size="sm" />
      <span
        className={`min-w-0 flex-1 truncate text-[14px] ${
          isWinner ? 'font-semibold text-fg' : 'text-fg-mid'
        }`}
      >
        {name}
      </span>
      {showScore && (
        <span
          className={`stamp w-7 shrink-0 text-right text-[15px] tnum ${
            isLive ? 'text-brand' : isWinner ? 'text-fg' : 'text-fg-mid'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  )
}

/**
 * One row in the match list. Whole row is a link (48px+ tall), the score column
 * is right-aligned and tabular so digits never shift the layout.
 */
export default function MatchRow({ match, teamById }) {
  const { t } = useI18n()

  const home = teamById.get(match.home_team_id)
  const away = teamById.get(match.away_team_id)
  const homeName = home?.name ?? match.home_label ?? t('tbd')
  const awayName = away?.name ?? match.away_label ?? t('tbd')

  const showScore = match.status !== 'scheduled'
  const isLive = match.status === 'live'
  const homeWon = match.status === 'finished' && match.winner_team_id === match.home_team_id
  const awayWon = match.status === 'finished' && match.winner_team_id === match.away_team_id

  return (
    <Link
      to={`/match/${match.id}`}
      className={`press flex items-stretch gap-2 border-b border-line px-3 py-2.5 hover:bg-panel ${
        isLive ? 'bg-panel' : ''
      }`}
    >
      <div className="flex items-center border-r-2 border-line pr-2">
        <StatusCell match={match} />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <TeamLine
          name={homeName}
          score={match.home_score}
          isWinner={homeWon}
          isLive={isLive}
          showScore={showScore}
        />
        <TeamLine
          name={awayName}
          score={match.away_score}
          isWinner={awayWon}
          isLive={isLive}
          showScore={showScore}
        />
      </div>

      {isLive && <span aria-hidden="true" className="w-1 shrink-0 self-stretch bg-red" />}
    </Link>
  )
}
