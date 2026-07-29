import { createContext, useContext, useMemo } from 'react'
import { useMatches, useTournament, useLookups } from './useTournament'

const DataContext = createContext(null)

/**
 * Kickoff time, then the admin's manual order. Applied here rather than relying
 * on the initial query, because realtime inserts arrive after the sort.
 */
function byKickoff(a, b) {
  if (a.scheduled_at && b.scheduled_at) {
    const diff = new Date(a.scheduled_at) - new Date(b.scheduled_at)
    if (diff !== 0) return diff
  } else if (a.scheduled_at !== b.scheduled_at) {
    return a.scheduled_at ? -1 : 1 // unscheduled games sink to the bottom
  }
  return (a.sort_order ?? 0) - (b.sort_order ?? 0)
}

/**
 * Loads the tournament once and keeps the match table live for the whole app,
 * so switching tabs is instant and every screen shows the same numbers.
 */
export function DataProvider({ children }) {
  const tournament = useTournament()
  const matchData = useMatches()
  const lookups = useLookups(tournament.data)

  const value = useMemo(
    () => ({
      loading: tournament.loading || matchData.loading,
      error: tournament.error || matchData.error,
      reload: () => {
        tournament.reload()
        matchData.reload()
      },
      divisions: tournament.data?.divisions ?? [],
      groups: tournament.data?.groups ?? [],
      teams: tournament.data?.teams ?? [],
      players: tournament.data?.players ?? [],
      matches: [...matchData.matches].sort(byKickoff),
      connected: matchData.connected,
      ...lookups,
    }),
    [tournament, matchData, lookups]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
