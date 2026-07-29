import { useEffect, useMemo, useRef } from 'react'
import { useI18n } from '../lib/i18n'
import { dayKey, dayStrip, shortDate, shortDayName } from '../lib/dates'

/**
 * Horizontal day picker, the Flashscore pattern: swipe through dates, the
 * selected one underlined in brand yellow. Counts show how many games that day.
 */
export default function DateStrip({ selected, onSelect, counts }) {
  const { t, lang } = useI18n()
  const scroller = useRef(null)
  const activeRef = useRef(null)

  const days = useMemo(() => dayStrip(new Date(), 3, 4), [])
  const todayKey = dayKey(new Date())

  // keep the selected day in view without yanking the whole page around
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [selected])

  return (
    <div
      ref={scroller}
      role="tablist"
      aria-label={t('navMatches')}
      className="no-scrollbar flex overflow-x-auto border-b-2 border-line bg-panel"
    >
      {days.map(({ date, key }) => {
        const active = key === selected
        const isToday = key === todayKey
        const count = counts?.[key] ?? 0

        return (
          <button
            key={key}
            ref={active ? activeRef : null}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onSelect(key)}
            className={`press relative flex min-h-[62px] min-w-[74px] flex-1 flex-col items-center justify-center gap-0.5 px-2 ${
              active ? 'text-brand' : 'text-fg-dim'
            }`}
          >
            <span className="stamp text-[10px] leading-none">
              {isToday ? t('today') : shortDayName(date, lang)}
            </span>
            <span className="stamp text-[13px] leading-none tnum">{shortDate(date)}</span>
            <span
              className={`stamp text-[10px] leading-none tnum ${
                count ? 'text-fg-mid' : 'text-transparent'
              }`}
            >
              {count || '0'}
            </span>
            <span
              aria-hidden="true"
              className={`absolute inset-x-2 bottom-0 h-0.5 ${active ? 'bg-brand' : 'bg-transparent'}`}
            />
          </button>
        )
      })}
    </div>
  )
}
