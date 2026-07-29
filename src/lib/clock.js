import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './supabase'

/**
 * The clock is server-authoritative. A running match stores when it was started
 * (server time) plus how much was left at that moment; every client derives the
 * countdown locally. That keeps the DB quiet and all screens in sync.
 *
 * The one catch: a phone with a wrong system clock would render the wrong time,
 * so we measure the offset between this device and the database once per load.
 */
let serverOffsetMs = 0
let offsetPromise = null

export function syncServerTime() {
  if (!isConfigured) return Promise.resolve(0)
  if (offsetPromise) return offsetPromise

  offsetPromise = (async () => {
    const t0 = Date.now()
    const { data, error } = await supabase.rpc('server_now')
    if (error || !data) return serverOffsetMs
    const roundTrip = Date.now() - t0
    // assume the response took half the round trip to reach us
    serverOffsetMs = new Date(data).getTime() - (t0 + roundTrip / 2)
    return serverOffsetMs
  })()

  return offsetPromise
}

/** Server "now" in ms, corrected for this device's clock drift. */
export function serverNow() {
  return Date.now() + serverOffsetMs
}

/** Milliseconds left on the game clock for a match row. */
export function remainingMs(match) {
  if (!match) return 0
  if (match.clock_status === 'running' && match.clock_started_at) {
    const started = new Date(match.clock_started_at).getTime()
    return Math.max(0, match.clock_remaining_ms - (serverNow() - started))
  }
  return Math.max(0, match.clock_remaining_ms ?? 0)
}

/** Milliseconds left on the 12-second shot clock. */
export function shotClockMs(match) {
  if (!match) return 0
  if (match.shot_clock_status === 'running' && match.shot_clock_started_at) {
    const started = new Date(match.shot_clock_started_at).getTime()
    return Math.max(0, match.shot_clock_remaining_ms - (serverNow() - started))
  }
  return Math.max(0, match.shot_clock_remaining_ms ?? 0)
}

/** 125000 -> "2:05". Under a minute it switches to tenths: "9.4". */
export function formatClock(ms, { tenths = true } = {}) {
  const total = Math.max(0, ms)
  if (tenths && total < 60000) {
    return (Math.ceil(total / 100) / 10).toFixed(1)
  }
  const secs = Math.ceil(total / 1000)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** "12.0" for the shot clock — always one decimal, no minutes. */
export function formatShotClock(ms) {
  return (Math.ceil(Math.max(0, ms) / 100) / 10).toFixed(1)
}

/**
 * Re-renders `intervalMs` at a time, but only while the match clock is actually
 * running — a paused or finished game costs nothing.
 */
export function useTicker(active, intervalMs = 100) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])
}
