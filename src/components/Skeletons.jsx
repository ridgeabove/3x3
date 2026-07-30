import { useI18n } from '../lib/i18n'

/**
 * Loading placeholders shaped like the real screens, so a slow connection shows
 * the page settling into place instead of a spinner that tells you nothing.
 * Every block here must match the real layout's spacing, or the content jumps
 * when the data lands.
 */

/** One grey block. Sizing comes from the caller, same as any Tailwind box. */
export function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />
}

/**
 * Wraps a placeholder screen. Screen readers get "loading" once; sighted users
 * get the blocks, which are all aria-hidden.
 */
function Loading({ children }) {
  const { t } = useI18n()
  return (
    <div role="status" aria-busy="true" aria-label={t('loading')}>
      {children}
    </div>
  )
}

/** Fake widths, so a list of placeholders does not look like graph paper. */
const NAME_W = ['w-32', 'w-40', 'w-24', 'w-36', 'w-28', 'w-44']
const nameW = (i) => NAME_W[i % NAME_W.length]

function BandSkeleton({ tone = 'dark', right = true }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-y-2 bg-panel-2 px-3 py-2 ${
        tone === 'brand' ? 'border-brand' : 'border-line'
      }`}
    >
      <Skeleton className="h-3.5 w-28" />
      {right && <Skeleton className="h-3.5 w-12" />}
    </div>
  )
}

function TeamLineSkeleton({ width }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Skeleton className="h-7 w-7 shrink-0" />
      <Skeleton className={`h-3.5 ${width}`} />
      <Skeleton className="ml-auto h-4 w-7 shrink-0" />
    </div>
  )
}

/** Mirrors MatchRow: fixed status column, two team lines, 2px divider. */
function MatchRowSkeleton({ i = 0 }) {
  return (
    <div className="flex items-stretch gap-2 border-b border-line px-3 py-2.5">
      <div className="flex items-center border-r-2 border-line pr-2">
        <div className="flex w-14 shrink-0 flex-col items-center gap-1">
          <Skeleton className="h-3.5 w-9" />
          <Skeleton className="h-2 w-6" />
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <TeamLineSkeleton width={nameW(i)} />
        <TeamLineSkeleton width={nameW(i + 3)} />
      </div>
    </div>
  )
}

export function MatchListSkeleton({ rows = 5, showDivisionBand = true }) {
  return (
    <div>
      {showDivisionBand && <BandSkeleton tone="brand" />}
      <BandSkeleton right={false} />
      {Array.from({ length: rows }, (_, i) => (
        <MatchRowSkeleton key={i} i={i} />
      ))}
    </div>
  )
}

/** Matches page: day picker on top, then the day's games. */
export function MatchesSkeleton() {
  return (
    <Loading>
      <div className="no-scrollbar flex overflow-x-auto border-b-2 border-line bg-panel">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex min-h-[62px] min-w-[74px] flex-1 flex-col items-center justify-center gap-1 px-2"
          >
            <Skeleton className="h-2.5 w-8" />
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-2.5 w-4" />
          </div>
        ))}
      </div>
      <MatchListSkeleton rows={6} />
    </Loading>
  )
}

/** Live page: the realtime status strip, then live games. */
export function LiveSkeleton() {
  return (
    <Loading>
      <div className="flex items-center justify-between border-b-2 border-line bg-panel px-3 py-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-20" />
      </div>
      <MatchListSkeleton rows={3} />
    </Loading>
  )
}

export function TeamsSkeleton({ rows = 8 }) {
  return (
    <Loading>
      <BandSkeleton tone="brand" />
      <ul>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-3 border-b border-line px-3 py-3">
            <Skeleton className="h-9 w-9 shrink-0" />
            <span className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className={`h-3.5 ${nameW(i)}`} />
              <Skeleton className="h-2.5 w-24" />
            </span>
            <Skeleton className="h-4 w-4 shrink-0" />
          </li>
        ))}
      </ul>
    </Loading>
  )
}

/** One group table: the header row plus placeholder standings rows. */
function StandingsTableSkeleton({ rows = 4 }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[340px]">
        <div className="flex items-center gap-1 border-b-2 border-line bg-panel-2 px-2 py-1.5">
          <Skeleton className="h-2.5 w-4 shrink-0" />
          <Skeleton className="h-2.5 w-16 shrink-0" />
          <div className="ml-auto flex gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-2.5 w-6 shrink-0" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center gap-1 border-b border-line px-2 py-2">
            <Skeleton className="h-5 w-5 shrink-0" />
            <Skeleton className={`h-3.5 shrink-0 ${r % 2 ? 'w-24' : 'w-20'}`} />
            <div className="ml-auto flex gap-1">
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-3.5 w-6 shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StandingsSkeleton() {
  return (
    <Loading>
      <BandSkeleton tone="brand" right={false} />
      {Array.from({ length: 2 }, (_, g) => (
        <div key={g} className="mb-1">
          <BandSkeleton />
          <StandingsTableSkeleton />
        </div>
      ))}
    </Loading>
  )
}

export function TeamDetailSkeleton() {
  return (
    <Loading>
      <div className="flex items-center gap-2 border-b-2 border-line bg-panel px-2 py-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-3 w-28" />
      </div>

      <section className="flex items-center gap-3 border-b-2 border-brand bg-panel px-3 py-4">
        <Skeleton className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-32" />
        </div>
      </section>

      <div className="grid grid-cols-4 gap-2 p-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 border-2 border-line bg-panel px-2 py-2.5"
          >
            <Skeleton className="h-5 w-7" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        ))}
      </div>

      <BandSkeleton />
      <ul>
        {Array.from({ length: 4 }, (_, i) => (
          <li
            key={i}
            className="flex items-center justify-between border-b border-line px-3 py-2.5"
          >
            <Skeleton className={`h-3.5 ${nameW(i)}`} />
            <Skeleton className="h-3.5 w-10 shrink-0" />
          </li>
        ))}
      </ul>
    </Loading>
  )
}

export function MatchDetailSkeleton() {
  return (
    <Loading>
      <div className="flex items-center gap-2 border-b-2 border-line bg-panel px-2 py-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-3 w-36" />
      </div>

      {/* scoreboard: crests and clock on one row, the big score under it */}
      <section className="border-b-2 border-line bg-panel px-3 py-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <div className="flex min-w-0 flex-col items-center gap-1.5">
            <Skeleton className="h-14 w-14" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex min-w-0 flex-col items-center gap-1.5">
            <Skeleton className="h-14 w-14" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Skeleton className="mx-auto h-11 w-16" />
          <Skeleton className="h-4 w-1.5" />
          <Skeleton className="mx-auto h-11 w-16" />
        </div>
      </section>

      <BandSkeleton right={false} />
      <ul>
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-2.5 border-b border-line px-3 py-2">
            <Skeleton className="h-3 w-11 shrink-0" />
            <Skeleton className="h-6 w-0.5 shrink-0" />
            <Skeleton className="h-3 w-14 shrink-0" />
            <Skeleton className={`h-3.5 ${nameW(i)}`} />
          </li>
        ))}
      </ul>
    </Loading>
  )
}
