const DAY_SHORT = {
  sq: ['DIE', 'HEN', 'MAR', 'MER', 'ENJ', 'PRE', 'SHT'],
  en: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
}

/** Local calendar day as YYYY-MM-DD, which is what we group matches by. */
export function dayKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** The Flashscore-style day strip: three days back, three forward. */
export function dayStrip(centre = new Date(), before = 3, after = 3) {
  const days = []
  for (let i = -before; i <= after; i++) {
    const d = addDays(centre, i)
    days.push({ date: d, key: dayKey(d), offset: i })
  }
  return days
}

export function shortDayName(date, lang) {
  return DAY_SHORT[lang]?.[date.getDay()] ?? DAY_SHORT.en[date.getDay()]
}

/** "30.07." — the compact form used on the day strip. */
export function shortDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`
}

/** "18:30" in the viewer's own timezone. */
export function timeLabel(iso) {
  if (!iso) return '--:--'
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** "30.07.2026 18:30" for admin lists. */
export function dateTimeLabel(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${shortDate(d)}${d.getFullYear()} ${timeLabel(iso)}`
}

/** Value for <input type="datetime-local">, which wants local time, no zone. */
export function toDateTimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`
}

export function fromDateTimeLocal(value) {
  return value ? new Date(value).toISOString() : null
}
