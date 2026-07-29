import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const KEY = '3x3-division'
const DivisionContext = createContext(null)

/**
 * Which tournament the viewer is looking at. Kept app-wide (and remembered)
 * so switching from Matches to Standings doesn't lose your place.
 */
export function DivisionProvider({ children }) {
  const [division, setDivision] = useState(() => localStorage.getItem(KEY) || 'all')

  useEffect(() => {
    localStorage.setItem(KEY, division)
  }, [division])

  const value = useMemo(
    () => ({
      division,
      setDivision,
      /** Filter any row that carries division_id. */
      matches: (rows) =>
        division === 'all' ? rows : rows.filter((r) => r.division_id === division),
    }),
    [division]
  )

  return <DivisionContext.Provider value={value}>{children}</DivisionContext.Provider>
}

export function useDivision() {
  const ctx = useContext(DivisionContext)
  if (!ctx) throw new Error('useDivision must be used inside <DivisionProvider>')
  return ctx
}
