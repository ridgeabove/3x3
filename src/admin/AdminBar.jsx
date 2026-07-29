import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, ExternalLink } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../hooks/useAuth'

/** Sticky admin header: back, title, and the one destructive action kept apart. */
export default function AdminBar({ title, back = '/admin', right = null, showSignOut = false }) {
  const { t } = useI18n()
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="safe-top sticky top-0 z-40 border-b-2 border-brand bg-ink">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-2 py-2">
        {back ? (
          <Link
            to={back}
            aria-label={t('back')}
            className="press flex min-h-11 min-w-11 items-center justify-center text-fg-mid"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
        ) : (
          <span className="w-1" />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] text-brand">{title}</h1>
          {user && <p className="truncate text-[10px] text-fg-dim">{user.email}</p>}
        </div>

        {right}

        <Link
          to="/"
          aria-label="Site"
          className="press flex min-h-11 min-w-11 items-center justify-center text-fg-dim"
        >
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
        </Link>

        {showSignOut && (
          <button
            type="button"
            onClick={async () => {
              await signOut()
              navigate('/admin/login', { replace: true })
            }}
            aria-label={t('signOut')}
            className="press flex min-h-11 min-w-11 items-center justify-center border-2 border-red text-red"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  )
}
