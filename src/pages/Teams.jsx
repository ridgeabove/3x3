import { Link } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { useDivision } from '../hooks/useDivision'
import { Band, Crest, ErrorState, EmptyState } from '../components/ui'
import { TeamsSkeleton } from '../components/Skeletons'

export default function Teams() {
  const { t, pick } = useI18n()
  const { divisions, teams, groupById, playersByTeam, loading, error, reload } = useData()
  const { division } = useDivision()

  if (loading) return <TeamsSkeleton />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const shown = divisions.filter((d) => division === 'all' || d.id === division)

  if (!teams.length) {
    return <EmptyState icon={Users} title={t('noData')} hint={t('standingsEmptyHint')} />
  }

  return (
    <>
      {shown.map((d) => {
        const list = teams.filter((tm) => tm.division_id === d.id)
        return (
          <section key={d.id}>
            <Band tone="brand" right={`${list.length} ${t('teamsCount')}`}>
              {pick(d, 'name')}
            </Band>
            <ul>
              {list.map((team) => {
                const group = groupById.get(team.group_id)
                const roster = playersByTeam.get(team.id) ?? []
                return (
                  <li key={team.id}>
                    <Link
                      to={`/team/${team.id}`}
                      className="press flex items-center gap-3 border-b border-line px-3 py-3 hover:bg-panel"
                    >
                      <Crest name={team.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-fg">{team.name}</span>
                        <span className="block text-[11px] text-fg-dim">
                          {group ? `${t('group')} ${group.name}` : t('noGroup')} ·{' '}
                          {roster.length} {t('players')}
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-line-strong" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </>
  )
}
