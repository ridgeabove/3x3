import { Trophy } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { useDivision } from '../hooks/useDivision'
import StandingsTable from '../components/StandingsTable'
import Bracket from '../components/Bracket'
import { Band, Spinner, ErrorState, EmptyState } from '../components/ui'

export default function Standings() {
  const { t, pick } = useI18n()
  const { divisions, groups, teams, matches, loading, error, reload } = useData()
  const { division } = useDivision()

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const shown = divisions.filter((d) => division === 'all' || d.id === division)
  const anyGroups = groups.length > 0

  if (!anyGroups) {
    return (
      <EmptyState icon={Trophy} title={t('standingsEmpty')} hint={t('standingsEmptyHint')} />
    )
  }

  return (
    <>
      {shown.map((d) => {
        const divGroups = groups.filter((g) => g.division_id === d.id)
        const divMatches = matches.filter((m) => m.division_id === d.id)

        return (
          <section key={d.id}>
            <Band tone="brand">{pick(d, 'name')}</Band>

            {divGroups.map((g) => {
              const groupTeams = teams.filter((tm) => tm.group_id === g.id)
              const groupMatches = divMatches.filter((m) => m.group_id === g.id)
              if (!groupTeams.length) return null

              return (
                <div key={g.id} className="mb-1">
                  <Band right={`${groupTeams.length}`}>{`${t('group')} ${g.name}`}</Band>
                  <StandingsTable teams={groupTeams} matches={groupMatches} />
                </div>
              )
            })}

            <Bracket matches={divMatches} />
          </section>
        )
      })}

      <div className="px-3 py-4 text-[11px] leading-relaxed text-fg-dim">
        <p>{t('legendPlayed')} · {t('legendWon')} · {t('legendLost')}</p>
        <p>{t('legendScored')} · {t('legendAgainst')}</p>
        <p>{t('legendPoints')}</p>
      </div>
    </>
  )
}
