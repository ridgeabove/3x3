import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { computeStandings } from '../lib/standings'

/**
 * Group table. Horizontally scrollable inside its own container so the page
 * body never scrolls sideways on a 375px screen.
 */
export default function StandingsTable({ teams, matches, qualifyCount = 2 }) {
  const { t } = useI18n()
  const rows = computeStandings(teams, matches)

  if (!rows.length) return null

  const head = [
    t('standingsPlayed'),
    t('standingsWon'),
    t('standingsLost'),
    t('standingsScored'),
    t('standingsAgainst'),
    t('standingsDiff'),
    t('standingsPoints'),
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[340px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b-2 border-line bg-panel-2 text-fg-dim">
            <th scope="col" className="stamp w-7 px-2 py-1.5 text-left text-[10px] font-normal">
              #
            </th>
            <th scope="col" className="stamp px-1 py-1.5 text-left text-[10px] font-normal">
              {t('standingsTeam')}
            </th>
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="stamp w-8 px-1 py-1.5 text-center text-[10px] font-normal"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const qualified = r.rank <= qualifyCount
            return (
              <tr key={r.team.id} className="border-b border-line">
                <td className="px-2 py-2">
                  <span
                    className={`stamp inline-flex h-5 w-5 items-center justify-center text-[11px] tnum ${
                      qualified ? 'bg-brand text-brand-ink' : 'text-fg-dim'
                    }`}
                  >
                    {r.rank}
                  </span>
                </td>
                <td className="max-w-[130px] px-1 py-2">
                  <Link
                    to={`/team/${r.team.id}`}
                    className="block truncate text-fg hover:text-brand"
                  >
                    {r.team.name}
                  </Link>
                </td>
                <td className="px-1 py-2 text-center tnum text-fg-mid">{r.played}</td>
                <td className="px-1 py-2 text-center tnum text-fg">{r.won}</td>
                <td className="px-1 py-2 text-center tnum text-fg-mid">{r.lost}</td>
                <td className="px-1 py-2 text-center tnum text-fg-mid">{r.scored}</td>
                <td className="px-1 py-2 text-center tnum text-fg-mid">{r.against}</td>
                <td className="px-1 py-2 text-center tnum text-fg-mid">
                  {r.diff > 0 ? `+${r.diff}` : r.diff}
                </td>
                <td className="stamp px-1 py-2 text-center tnum text-brand">{r.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
