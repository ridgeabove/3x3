import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, isConfigured, errMsg } from '../lib/supabase'
import { syncServerTime } from '../lib/clock'

/**
 * One shared load of the slow-moving data (divisions, groups, teams, players).
 * It changes only when the admin edits the draw, so a single fetch plus a manual
 * refresh is plenty. No need to keep a socket open for it.
 */
export function useTournament() {
  const [state, setState] = useState({ loading: true, error: null, data: null })

  const load = useCallback(async () => {
    if (!isConfigured) {
      setState({ loading: false, error: 'not-configured', data: null })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))

    const [divisions, groups, teams, players] = await Promise.all([
      supabase.from('divisions').select('*').order('sort_order'),
      supabase.from('groups').select('*').order('sort_order'),
      supabase.from('teams').select('*').order('sort_order'),
      supabase.from('players').select('*').order('sort_order'),
    ])

    const failed = [divisions, groups, teams, players].find((r) => r.error)
    if (failed) {
      setState({ loading: false, error: errMsg(failed.error), data: null })
      return
    }

    setState({
      loading: false,
      error: null,
      data: {
        divisions: divisions.data,
        groups: groups.data,
        teams: teams.data,
        players: players.data,
      },
    })
  }, [])

  useEffect(() => {
    load()
    syncServerTime()
  }, [load])

  return { ...state, reload: load }
}

/**
 * Every match, kept live over a realtime channel. The whole app runs off this:
 * the day list, the live tab, the standings and the bracket all read the same
 * rows, so a score typed on the admin's phone lands everywhere at once.
 */
export function useMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false)
      setError('not-configured')
      return
    }
    const { data, error: err } = await supabase
      .from('matches')
      .select('*')
      .order('scheduled_at', { nullsFirst: false })
      .order('sort_order')

    if (!mounted.current) return
    if (err) setError(errMsg(err))
    else {
      setMatches(data ?? [])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    mounted.current = true
    load()
    return () => {
      mounted.current = false
    }
  }, [load])

  useEffect(() => {
    if (!isConfigured) return

    const channel = supabase
      .channel('matches-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
        setMatches((prev) => {
          if (payload.eventType === 'DELETE') {
            return prev.filter((m) => m.id !== payload.old.id)
          }
          const row = payload.new
          const idx = prev.findIndex((m) => m.id === row.id)
          if (idx === -1) return [...prev, row]
          const next = [...prev]
          next[idx] = row
          return next
        })
      })
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'))

    return () => supabase.removeChannel(channel)
  }, [])

  return { matches, loading, error, connected, reload: load }
}

/** A single match plus its event log, both live. Used by the detail page and the console. */
export function useMatch(matchId) {
  const [match, setMatch] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!isConfigured || !matchId) {
      setLoading(false)
      setError(isConfigured ? null : 'not-configured')
      return
    }
    const [m, ev] = await Promise.all([
      supabase.from('matches').select('*').eq('id', matchId).maybeSingle(),
      supabase
        .from('match_events')
        .select('*')
        .eq('match_id', matchId)
        .order('id', { ascending: false }),
    ])

    if (m.error) setError(errMsg(m.error))
    else if (!m.data) setError('not-found')
    else {
      setMatch(m.data)
      setError(null)
    }
    if (!ev.error) setEvents(ev.data ?? [])
    setLoading(false)
  }, [matchId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    if (!isConfigured || !matchId) return

    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => setMatch(payload.new)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_events', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setEvents((prev) => {
            if (payload.eventType === 'DELETE') return prev.filter((e) => e.id !== payload.old.id)
            if (payload.eventType === 'INSERT') return [payload.new, ...prev]
            return prev.map((e) => (e.id === payload.new.id ? payload.new : e))
          })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [matchId])

  return { match, events, loading, error, reload: load }
}

/** Fast lookups by id, rebuilt only when the tournament data changes. */
export function useLookups(data) {
  return useMemo(() => {
    const teamById = new Map((data?.teams ?? []).map((t) => [t.id, t]))
    const groupById = new Map((data?.groups ?? []).map((g) => [g.id, g]))
    const divisionById = new Map((data?.divisions ?? []).map((d) => [d.id, d]))
    const playerById = new Map((data?.players ?? []).map((p) => [p.id, p]))

    const playersByTeam = new Map()
    for (const p of data?.players ?? []) {
      if (!playersByTeam.has(p.team_id)) playersByTeam.set(p.team_id, [])
      playersByTeam.get(p.team_id).push(p)
    }

    return { teamById, groupById, divisionById, playerById, playersByTeam }
  }, [data])
}
