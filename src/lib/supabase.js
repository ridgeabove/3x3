import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True once .env holds real credentials. Until then the app still renders and
 * explains what to do instead of throwing a blank white screen at you.
 */
export const isConfigured = Boolean(url && key && !url.includes('YOUR-PROJECT'))

export const supabase = isConfigured
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null

/** Surface a readable message from any Supabase/Postgres error. */
export function errMsg(error) {
  if (!error) return null
  return error.message || error.error_description || String(error)
}
