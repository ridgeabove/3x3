import { Link } from 'react-router-dom'
import { useI18n, stageLabel } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { KNOCKOUT_STAGES } from '../lib/rules'
import { timeLabel } from '../lib/dates'
import { Band } from './ui'

function Side({ name, score, isWinner, decided }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <span
        className={`min-w-0 flex-1 truncate text-[13px] ${
          isWinner ? 'font-semibold text-brand' : decided ? 'text-fg-dim' : 'text-fg-mid'
        }`}
      >
        {name}
      </span>
      <span className={`stamp shrink-0 text-[13px] tnum ${isWinner ? 'text-brand' : 'text-fg-dim'}`}>
        {score}
      </span>
    </div>
  )
}

function BracketMatch({ match }) {
  const { t } = useI18n()
  const { teamById } = useData()

  const home = teamById.get(match.home_team_id)
  const away = teamById.get(match.away_team_id)
  const decided = match.status === 'finished'
  const showScore = match.status !== 'scheduled'

  return (
    <Link
      to={`/match/${match.id}`}
      className={`press block border-2 bg-panel hover:border-line-strong ${
        match.status === 'live' ? 'border-red' : 'border-line'
      }`}
    >
      <div className="flex items-center justify-between border-b border-line px-2 py-1">
        <span className="stamp text-[10px] text-fg-dim">
          {match.slot_label || stageLabel(t, match.stage)}
        </span>
        <span className="stamp text-[10px] tnum text-fg-dim">
          {match.status === 'live' ? t('live') : timeLabel(match.scheduled_at)}
        </span>
      </div>
      <Side
        name={home?.name ?? match.home_label ?? t('tbd')}
        score={showScore ? match.home_score : '-'}
        isWinner={decided && match.winner_team_id === match.home_team_id}
        decided={decided}
      />
      <Side
        name={away?.name ?? match.away_label ?? t('tbd')}
        score={showScore ? match.away_score : '-'}
        isWinner={decided && match.winner_team_id === match.away_team_id}
        decided={decided}
      />
    </Link>
  )
}

/**
 * Knockout rounds as stacked columns. On a phone a real tree with connector
 * lines is unreadable, so each round gets its own labelled block instead.
 */
export default function Bracket({ matches }) {
  const { t } = useI18n()

  const rounds = KNOCKOUT_STAGES.map((stage) => ({
    stage,
    matches: matches.filter((m) => m.stage === stage),
  })).filter((r) => r.matches.length)

  if (!rounds.length) return null

  return (
    <div>
      <Band tone="brand">{t('knockout')}</Band>
      {rounds.map(({ stage, matches: list }) => (
        <div key={stage} className="border-b-2 border-line px-3 py-3">
          <h3 className="mb-2 text-[12px] text-fg-dim">{stageLabel(t, stage)}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {list.map((m) => (
              <BracketMatch key={m.id} match={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
