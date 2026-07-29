import { Loader2, AlertTriangle, Inbox } from 'lucide-react'
import { useI18n } from '../lib/i18n'

/** Section band — the yellow/black poster stripe used to head every list. */
export function Band({ children, tone = 'dark', right = null, className = '' }) {
  const tones = {
    dark: 'bg-panel-2 text-fg-mid border-line',
    brand: 'bg-brand-grit text-brand-ink border-brand',
    red: 'bg-red text-white border-red',
  }
  return (
    <div
      className={`flex items-center justify-between gap-3 border-y-2 px-3 py-2 ${tones[tone]} ${className}`}
    >
      <span className="stamp truncate text-[13px] leading-tight">{children}</span>
      {right != null && <span className="stamp shrink-0 text-[13px] tnum">{right}</span>}
    </div>
  )
}

/** Team identity tile. No team crests exist, so we stamp the initials. */
export function Crest({ name, size = 'md', className = '' }) {
  const initials = (name ?? '?')
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const sizes = {
    sm: 'h-7 w-7 text-[11px]',
    md: 'h-9 w-9 text-[13px]',
    lg: 'h-14 w-14 text-xl',
  }

  return (
    <span
      aria-hidden="true"
      className={`stamp inline-flex shrink-0 items-center justify-center border-2 border-line-strong bg-panel-2 text-brand ${sizes[size]} ${className}`}
    >
      {initials}
    </span>
  )
}

export function LiveBadge({ children }) {
  const { t } = useI18n()
  return (
    <span className="stamp inline-flex items-center gap-1.5 bg-red px-1.5 py-0.5 text-[11px] leading-none text-white">
      <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
      {children ?? t('live')}
    </span>
  )
}

export function Chip({ active = false, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`press stamp min-h-11 shrink-0 border-2 px-3 text-[12px] ${
        active
          ? 'border-brand bg-brand text-brand-ink'
          : 'border-line bg-panel text-fg-mid hover:border-line-strong'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}

const BUTTON_VARIANTS = {
  primary: 'border-brand bg-brand text-brand-ink hover:bg-brand-dark',
  ghost: 'border-line bg-panel text-fg hover:border-line-strong',
  danger: 'border-red bg-red text-white hover:bg-red-dark',
  quiet: 'border-transparent bg-transparent text-fg-mid hover:text-fg',
}

const BUTTON_SIZES = {
  sm: 'min-h-11 px-3 text-[12px]',
  md: 'min-h-11 px-4 text-[13px]',
  lg: 'min-h-14 px-5 text-[15px]',
}

/** Shared button styling, so a <Link> can look like a <Button> without nesting one inside the other. */
export function buttonCls({ variant = 'primary', size = 'md', className = '' } = {}) {
  return `press stamp inline-flex items-center justify-center gap-2 border-2 disabled:cursor-not-allowed disabled:opacity-40 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button type="button" className={buttonCls({ variant, size, className })} {...props}>
      {children}
    </button>
  )
}

export function Spinner({ label }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-fg-dim" role="status">
      <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-brand" />
      <span className="stamp text-[12px]">{label ?? t('loading')}</span>
    </div>
  )
}

export function EmptyState({ title, hint, icon: Icon = Inbox, action = null }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <Icon aria-hidden="true" className="mb-1 h-8 w-8 text-line-strong" />
      <h3 className="text-[15px] text-fg">{title}</h3>
      {hint && <p className="max-w-[40ch] text-[13px] text-fg-dim">{hint}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center" role="alert">
      <AlertTriangle aria-hidden="true" className="h-8 w-8 text-red" />
      <h3 className="text-[15px]">{t('loadError')}</h3>
      <p className="max-w-[46ch] break-words text-[13px] text-fg-dim">{message}</p>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          {t('retry')}
        </Button>
      )}
    </div>
  )
}

/** Shown when .env has no Supabase keys yet, so the app never dead-ends. */
export function NotConfigured() {
  const { t } = useI18n()
  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <AlertTriangle aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-brand" />
      <h2 className="mb-2 text-lg">{t('notConfigured')}</h2>
      <p className="mb-5 text-[13px] leading-relaxed text-fg-dim">{t('notConfiguredHint')}</p>
      <pre className="overflow-x-auto border-2 border-line bg-panel p-3 text-left text-[11px] text-fg-mid">
        {`VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...`}
      </pre>
    </div>
  )
}

/** Labelled form field. Visible label, error under the input. */
export function Field({ label, error, hint, children, required = false }) {
  return (
    <label className="block">
      <span className="stamp mb-1.5 block text-[11px] text-fg-dim">
        {label}
        {required && <span className="ml-1 text-red">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] text-fg-dim">{hint}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-[11px] text-red">
          {error}
        </span>
      )}
    </label>
  )
}

const controlCls =
  'w-full min-h-12 border-2 border-line bg-panel px-3 text-[15px] text-fg placeholder:text-fg-dim focus:border-brand'

export function Input({ className = '', ...props }) {
  return <input className={`${controlCls} ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${controlCls} ${className}`} {...props}>
      {children}
    </select>
  )
}
