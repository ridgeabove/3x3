import { NavLink, Link, useLocation } from 'react-router-dom'
import { CalendarDays, Radio, Users, Trophy, Info, ShieldCheck, Languages } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { useDivision } from '../hooks/useDivision'
import { Chip } from './ui'

const TABS = [
  { to: '/', key: 'navMatches', icon: CalendarDays, end: true },
  { to: '/live', key: 'navLive', icon: Radio },
  { to: '/teams', key: 'navTeams', icon: Users },
  { to: '/standings', key: 'navStandings', icon: Trophy },
  { to: '/info', key: 'navInfo', icon: Info },
]

function Header({ liveCount }) {
  const { t, lang, toggle } = useI18n()

  return (
    <header className="safe-top sticky top-0 z-40 border-b-2 border-brand bg-ink">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-2">
        <Link to="/" className="press flex items-center gap-2.5" aria-label="3x3 Albania">
          <img
            src="/logos/3x3-320.png"
            alt="3x3 Albania"
            width="52"
            height="35"
            className="h-[35px] w-[52px] border-2 border-brand object-cover"
          />
          <span className="leading-none">
            <span className="stamp block text-[15px] text-fg">3x3 Albania</span>
            <span className="block text-[10px] tracking-[0.18em] text-fg-dim">SHKODER</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5">
          {liveCount > 0 && (
            <Link
              to="/live"
              className="press stamp flex min-h-11 items-center gap-1.5 border-2 border-red bg-red px-2 text-[12px] text-white"
            >
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" />
              <span className="tnum">{liveCount}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={toggle}
            aria-label={lang === 'sq' ? 'Switch to English' : 'Kalo ne shqip'}
            className="press stamp flex min-h-11 min-w-11 items-center justify-center gap-1 border-2 border-line px-2 text-[12px] text-fg-mid"
          >
            <Languages aria-hidden="true" className="h-4 w-4" />
            {lang.toUpperCase()}
          </button>

          <Link
            to="/admin"
            aria-label={t('admin')}
            className="press flex min-h-11 min-w-11 items-center justify-center border-2 border-line text-fg-mid"
          >
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}

/** U18 / Women / All: the one filter that applies to most of the app. */
export function DivisionFilter({ divisions }) {
  const { t, pick } = useI18n()
  const { division, setDivision } = useDivision()

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto border-b-2 border-line bg-ink px-3 py-2">
      <Chip active={division === 'all'} onClick={() => setDivision('all')}>
        {t('all')}
      </Chip>
      {divisions.map((d) => (
        <Chip key={d.id} active={division === d.id} onClick={() => setDivision(d.id)}>
          {pick(d, 'name')}
        </Chip>
      ))}
    </div>
  )
}

function BottomNav() {
  const { t } = useI18n()

  return (
    <nav
      aria-label={t('navMatches')}
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-ink"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {TABS.map(({ to, key, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `press flex min-h-14 flex-col items-center justify-center gap-1 py-1.5 ${
                  isActive ? 'text-brand' : 'text-fg-dim'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    aria-hidden="true"
                    className="h-[22px] w-[22px]"
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  <span className="stamp text-[10px] leading-none">{t(key)}</span>
                  <span
                    aria-hidden="true"
                    className={`h-0.5 w-6 ${isActive ? 'bg-brand' : 'bg-transparent'}`}
                  />
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function AppShell({ children, liveCount = 0, filter = null }) {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <div className="min-h-dvh bg-ink bg-grit">
      {!isAdmin && <Header liveCount={liveCount} />}
      {!isAdmin && filter}
      {/* leave room for the fixed bottom bar */}
      <main className={`mx-auto max-w-3xl ${isAdmin ? 'pb-8' : 'pb-24'}`}>{children}</main>
      {!isAdmin && <BottomNav />}
    </div>
  )
}
