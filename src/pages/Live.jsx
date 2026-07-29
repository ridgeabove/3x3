import { Radio, Wifi, WifiOff } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { useDivision } from '../hooks/useDivision'
import MatchList from '../components/MatchList'
import { Spinner, ErrorState, EmptyState, Band } from '../components/ui'

export default function Live() {
  const { t } = useI18n()
  const { matches, loading, error, reload, connected } = useData()
  const { matches: filterDivision } = useDivision()

  const scoped = filterDivision(matches)
  const live = scoped.filter((m) => m.status === 'live')
  const next = scoped
    .filter((m) => m.status === 'scheduled' && m.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    .slice(0, 5)

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <>
      <div className="flex items-center justify-between border-b-2 border-line bg-panel px-3 py-2">
        <span className="stamp text-[12px] text-fg-mid">{t('liveNow')}</span>
        <span
          className="stamp flex items-center gap-1.5 text-[11px] text-fg-dim"
          title={connected ? 'realtime connected' : 'reconnecting'}
        >
          {connected ? (
            <Wifi aria-hidden="true" className="h-3.5 w-3.5 text-ok" />
          ) : (
            <WifiOff aria-hidden="true" className="h-3.5 w-3.5 text-fg-dim" />
          )}
          {connected ? 'REALTIME' : 'OFFLINE'}
        </span>
      </div>

      {live.length > 0 ? (
        <MatchList matches={live} />
      ) : (
        <EmptyState icon={Radio} title={t('noLiveMatches')} hint={t('noLiveMatchesHint')} />
      )}

      {next.length > 0 && (
        <section className="mt-2">
          <Band>{t('scheduled')}</Band>
          <MatchList matches={next} showDivisionBand={false} />
        </section>
      )}
    </>
  )
}
