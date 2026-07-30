import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Settings, Pencil, PlayCircle, ListOrdered } from 'lucide-react'
import { useI18n, stageLabel } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { dayKey, shortDate, timeLabel } from '../lib/dates'
import {
  Band,
  Chip,
  Spinner,
  ErrorState,
  EmptyState,
  LiveBadge,
  buttonCls,
} from '../components/ui'
import AdminBar from './AdminBar'

function StatusTag({ match }) {
  const { t } = useI18n()
  if (match.status === 'live') return <LiveBadge />
  if (match.status === 'finished') {
    return (
      <span className="stamp bg-panel-2 px-1.5 py-0.5 text-[10px] leading-none text-fg-dim">
        {t('finished')}
      </span>
    )
  }
  return (
    <span className="stamp border border-line px-1.5 py-0.5 text-[10px] leading-none text-fg-dim">
      {t('scheduled')}
    </span>
  )
}

function AdminMatchRow({ match }) {
  const { t } = useI18n()
  const { teamById } = useData()
  const home = teamById.get(match.home_team_id)?.name ?? match.home_label ?? t('tbd')
  const away = teamById.get(match.away_team_id)?.name ?? match.away_label ?? t('tbd')

  return (
    <div className="flex items-center gap-2 border-b border-line px-2 py-2">
      <div className="w-12 shrink-0 text-center">
        <span className="stamp block text-[12px] tnum text-fg-mid">
          {timeLabel(match.scheduled_at)}
        </span>
        {match.court && <span className="block text-[9px] text-fg-dim">{match.court}</span>}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-fg">
          {home} <span className="text-fg-dim">v</span> {away}
        </p>
        <p className="flex items-center gap-2 text-[10px] text-fg-dim">
          <StatusTag match={match} />
          <span className="stamp tnum">
            {match.home_score}:{match.away_score}
          </span>
          <span className="truncate">{stageLabel(t, match.stage)}</span>
        </p>
      </div>

      <Link
        to={`/admin/match/${match.id}`}
        aria-label={t('editMatch')}
        className="press flex min-h-11 min-w-11 items-center justify-center border-2 border-line text-fg-mid"
      >
        <Pencil aria-hidden="true" className="h-4 w-4" />
      </Link>
      <Link
        to={`/admin/console/${match.id}`}
        aria-label={t('openConsole')}
        className="press flex min-h-11 min-w-11 items-center justify-center border-2 border-brand bg-brand text-brand-ink"
      >
        <PlayCircle aria-hidden="true" className="h-4 w-4" />
      </Link>
    </div>
  )
}

export default function AdminHome() {
  const { t, pick } = useI18n()
  const { matches, divisions, loading, error, reload } = useData()
  const [div, setDiv] = useState('all')

  const grouped = useMemo(() => {
    const rows = div === 'all' ? matches : matches.filter((m) => m.division_id === div)
    const live = rows.filter((m) => m.status === 'live')

    const byDay = new Map()
    for (const m of rows) {
      const key = m.scheduled_at ? dayKey(m.scheduled_at) : 'tbd'
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key).push(m)
    }
    const days = [...byDay.entries()].sort(([a], [b]) => {
      if (a === 'tbd') return 1
      if (b === 'tbd') return -1
      return a.localeCompare(b)
    })
    return { live, days, total: rows.length }
  }, [matches, div])

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <>
      <AdminBar title={t('adminPanel')} back={null} showSignOut />

      <div className="grid grid-cols-2 gap-2 p-3">
        <Link to="/admin/setup" className={buttonCls({ variant: 'ghost', size: 'lg' })}>
          <Settings aria-hidden="true" className="h-4 w-4" />
          {t('adminSetup')}
        </Link>
        <Link to="/admin/match/new" className={buttonCls({ size: 'lg' })}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          {t('newMatch')}
        </Link>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-y-2 border-line px-3 py-2">
        <Chip active={div === 'all'} onClick={() => setDiv('all')}>
          {t('all')}
        </Chip>
        {divisions.map((d) => (
          <Chip key={d.id} active={div === d.id} onClick={() => setDiv(d.id)}>
            {pick(d, 'name')}
          </Chip>
        ))}
      </div>

      {grouped.live.length > 0 && (
        <>
          <Band tone="red" right={String(grouped.live.length)}>
            {t('liveNow')}
          </Band>
          {grouped.live.map((m) => (
            <AdminMatchRow key={`live-${m.id}`} match={m} />
          ))}
        </>
      )}

      {grouped.total === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title={t('noData')}
          hint={t('standingsEmptyHint')}
          action={
            <Link
              to="/admin/setup"
              className={buttonCls({ variant: 'ghost', className: 'mt-3' })}
            >
              {t('adminSetup')}
            </Link>
          }
        />
      ) : (
        grouped.days.map(([day, list]) => (
          <div key={day}>
            <Band right={String(list.length)}>
              {day === 'tbd' ? t('tbd') : shortDate(new Date(`${day}T12:00:00`))}
            </Band>
            {list.map((m) => (
              <AdminMatchRow key={m.id} match={m} />
            ))}
          </div>
        ))
      )}
    </>
  )
}
