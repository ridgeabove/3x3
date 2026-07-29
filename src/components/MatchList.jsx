import { useI18n, stageLabel } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { Band } from './ui'
import MatchRow from './MatchRow'

/**
 * Matches grouped the way Flashscore groups them: a band per competition
 * (here: per tournament), then a sub-band per group / knockout round.
 */
export default function MatchList({ matches, showDivisionBand = true }) {
  const { t, pick } = useI18n()
  const { divisions, groupById, teamById } = useData()

  const shown = divisions
    .map((division) => {
      const rows = matches.filter((m) => m.division_id === division.id)
      if (!rows.length) return null

      // one section per group (A, B, …) or per knockout round
      const sections = new Map()
      for (const m of rows) {
        const key = m.stage === 'group' ? `g:${m.group_id ?? 'none'}` : `s:${m.stage}`
        if (!sections.has(key)) sections.set(key, [])
        sections.get(key).push(m)
      }

      const ordered = [...sections.entries()]
        .map(([key, list]) => {
          let label
          let order
          if (key.startsWith('g:')) {
            const g = groupById.get(list[0].group_id)
            label = g ? `${t('group')} ${g.name}` : t('stageGroup')
            order = g ? g.sort_order : 99
          } else {
            label = stageLabel(t, list[0].stage)
            order = 100 + ['qf', 'sf', 'third', 'final'].indexOf(list[0].stage)
          }
          return { key, label, order, matches: list }
        })
        .sort((a, b) => a.order - b.order)

      return { division, sections: ordered, count: rows.length }
    })
    .filter(Boolean)

  return (
    <div>
      {shown.map(({ division, sections, count }) => (
        <section key={division.id}>
          {showDivisionBand && (
            <Band tone="brand" right={`${count} ${t('matchCount')}`}>
              {pick(division, 'name')}
            </Band>
          )}
          {sections.map((section) => (
            <div key={section.key}>
              <Band>{section.label}</Band>
              {section.matches.map((m) => (
                <MatchRow key={m.id} match={m} teamById={teamById} />
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
