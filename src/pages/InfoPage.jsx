import { Target, Zap, Instagram } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { Band } from '../components/ui'

const RULE_KEYS = ['rule1', 'rule2', 'rule3', 'rule4', 'rule5']

const PARTNERS = [
  { src: '/logos/bashkiashkoder.jpeg', alt: 'Bashkia Shkoder' },
  { src: '/logos/fshb.jpeg', alt: 'Federata Shqiptare e Basketbollit' },
]

function ContestCard({ icon: Icon, title, prizeLabel }) {
  return (
    <div className="flex flex-col items-center gap-2 border-2 border-brand bg-panel px-3 py-5 text-center">
      <Icon aria-hidden="true" className="h-7 w-7 text-brand" />
      <h3 className="text-[13px] leading-tight text-fg">{title}</h3>
      <span className="stamp text-[10px] text-fg-dim">{prizeLabel}</span>
      <span className="stamp text-[26px] leading-none text-brand tnum">100€</span>
    </div>
  )
}

export default function InfoPage() {
  const { t } = useI18n()

  return (
    <>
      {/* poster hero */}
      <section className="bg-brand-grit px-4 py-6 text-center">
        <img
          src="/logos/3x3-900.png"
          alt="3x3 Albania — Shkoder"
          width="900"
          height="600"
          className="mx-auto mb-4 w-full max-w-[300px] border-2 border-brand-ink object-contain"
        />
        <h1 className="text-[26px] leading-none text-brand-ink">{t('aboutTitle')}</h1>
        <p className="mx-auto mt-2 max-w-[34ch] text-[13px] leading-snug text-brand-ink/80">
          {t('aboutTagline')}
        </p>
        <span className="stamp mt-3 inline-block bg-brand-ink px-2 py-1 text-[11px] text-brand">
          #11EDITION
        </span>
      </section>

      <p className="px-4 py-4 text-[14px] leading-relaxed text-fg-mid">{t('aboutBody')}</p>

      {/* special contests from the poster */}
      <Band tone="brand">{t('contests')}</Band>
      <div className="grid grid-cols-2 gap-3 p-3">
        <ContestCard icon={Target} title={t('contest3pt')} prizeLabel={t('contestPrize')} />
        <ContestCard icon={Zap} title={t('contestDunk')} prizeLabel={t('contestPrize')} />
      </div>

      {/* FIBA 3x3 rules the app enforces */}
      <Band>{t('rulesTitle')}</Band>
      <ol className="divide-y divide-line">
        {RULE_KEYS.map((key, i) => (
          <li key={key} className="flex gap-3 px-3 py-3">
            <span className="stamp shrink-0 text-[13px] tnum text-brand">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-[13px] leading-relaxed text-fg-mid">{t(key)}</span>
          </li>
        ))}
      </ol>

      {/* organisers and partners */}
      <Band>{t('organisers')}</Band>
      <div className="grid grid-cols-2 gap-3 p-3">
        {PARTNERS.map((p) => (
          <div key={p.src} className="flex items-center justify-center border-2 border-line bg-white p-3">
            <img src={p.src} alt={p.alt} loading="lazy" className="h-14 w-full object-contain" />
          </div>
        ))}
      </div>

      <div className="px-3 pb-6 pt-2">
        <a
          href="https://www.instagram.com/3x3albania/"
          target="_blank"
          rel="noopener noreferrer"
          className="press stamp flex min-h-12 items-center justify-center gap-2 border-2 border-line bg-panel text-[13px] text-fg-mid"
        >
          <Instagram aria-hidden="true" className="h-4 w-4" />
          {t('followUs')}
        </a>
        <p className="mt-4 text-center text-[11px] text-fg-dim">
          3x3 Albania · Shkoder · {new Date().getFullYear()}
        </p>
      </div>
    </>
  )
}
