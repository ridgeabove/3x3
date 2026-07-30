import { useMemo, useState } from 'react'
import { CalendarX } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { useDivision } from '../hooks/useDivision'
import { dayKey } from '../lib/dates'
import DateStrip from '../components/DateStrip'
import MatchList from '../components/MatchList'
import { ErrorState, EmptyState, Band } from '../components/ui'
import { MatchesSkeleton } from '../components/Skeletons'

export default function Matches() {
  const { t } = useI18n()
  const { matches, loading, error, reload } = useData()
  const { matches: filterDivision } = useDivision()
  const [day, setDay] = useState(() => dayKey(new Date()))

  const scoped = filterDivision(matches)

  // day -> number of games, for the counters on the date strip
  const counts = useMemo(() => {
    const out = {}
    for (const m of scoped) {
      if (!m.scheduled_at) continue
      const k = dayKey(m.scheduled_at)
      out[k] = (out[k] ?? 0) + 1
    }
    return out
  }, [scoped])

  const dayMatches = scoped.filter((m) => m.scheduled_at && dayKey(m.scheduled_at) === day)
  const unscheduled = scoped.filter((m) => !m.scheduled_at)

  if (loading) return <MatchesSkeleton />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <>
      <DateStrip selected={day} onSelect={setDay} counts={counts} />

      {/* Live games stay inline in the day list, highlighted, same as Flashscore.
          The LIVE tab and the header badge cover "what's on right now". */}
      {dayMatches.length > 0 ? (
        <MatchList matches={dayMatches} />
      ) : (
        <EmptyState
          icon={CalendarX}
          title={t('noMatchesDay')}
          hint={t('noMatchesDayHint')}
        />
      )}

      {unscheduled.length > 0 && (
        <section className="mt-4">
          <Band right={String(unscheduled.length)}>{t('tbd')}</Band>
          <MatchList matches={unscheduled} showDivisionBand={false} />
        </section>
      )}
    </>
  )
}
