import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { useAuth } from '../hooks/useAuth'
import { errMsg } from '../lib/supabase'
import { Button, Field, Input, Spinner } from '../components/ui'
import AdminBar from './AdminBar'

export default function AdminLogin() {
  const { t } = useI18n()
  const { user, ready, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (!ready) return <Spinner />
  if (user) return <Navigate to={location.state?.from ?? '/admin'} replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await signIn(email.trim(), password)
    setBusy(false)
    if (err) setError(errMsg(err))
    else navigate(location.state?.from ?? '/admin', { replace: true })
  }

  return (
    <>
      <AdminBar title={t('adminPanel')} back="/" />

      <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 px-4 py-8">
        <div className="mb-6 text-center">
          <ShieldCheck aria-hidden="true" className="mx-auto mb-3 h-9 w-9 text-brand" />
          <h2 className="text-[18px]">{t('signIn')}</h2>
          <p className="mt-1 text-[12px] text-fg-dim">{t('signInHint')}</p>
        </div>

        <Field label={t('email')} required>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@3x3albania.al"
          />
        </Field>

        <Field label={t('password')} required>
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-14"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="press absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-fg-dim"
            >
              {showPw ? (
                <EyeOff aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Eye aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>

        {error && (
          <p role="alert" className="border-2 border-red bg-panel px-3 py-2 text-[12px] text-red">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? t('signingIn') : t('signIn')}
        </Button>
      </form>
    </>
  )
}
