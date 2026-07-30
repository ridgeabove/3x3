import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2, Save, RotateCcw } from 'lucide-react'
import { useI18n, stageLabel } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { supabase, errMsg } from '../lib/supabase'
import { RULES, STAGES } from '../lib/rules'
import { toDateTimeLocal, fromDateTimeLocal } from '../lib/dates'
import { Band, Button, Field, Input, Select, Spinner } from '../components/ui'
import AdminBar from './AdminBar'

const BLANK = {
  division_id: '',
  stage: 'group',
  group_id: '',
  slot_label: '',
  court: '',
  scheduled_at: '',
  home_team_id: '',
  away_team_id: '',
  home_label: '',
  away_label: '',
  duration_seconds: RULES.REGULATION_SECONDS,
  target_score: RULES.TARGET_SCORE,
}

export default function AdminMatchEdit() {
  const { matchId } = useParams()
  const isNew = matchId === 'new'
  const navigate = useNavigate()
  const { t, pick } = useI18n()
  const { divisions, groups, teams, matches, reload, loading } = useData()

  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(isNew)

  // hydrate from the live match list once it has loaded
  useEffect(() => {
    if (isNew) {
      setForm((f) => ({ ...f, division_id: f.division_id || divisions[0]?.id || '' }))
      return
    }
    const m = matches.find((x) => x.id === matchId)
    if (!m || ready) return
    setForm({
      division_id: m.division_id,
      stage: m.stage,
      group_id: m.group_id ?? '',
      slot_label: m.slot_label ?? '',
      court: m.court ?? '',
      scheduled_at: toDateTimeLocal(m.scheduled_at),
      home_team_id: m.home_team_id ?? '',
      away_team_id: m.away_team_id ?? '',
      home_label: m.home_label ?? '',
      away_label: m.away_label ?? '',
      duration_seconds: m.duration_seconds,
      target_score: m.target_score,
    })
    setReady(true)
  }, [isNew, matchId, matches, divisions, ready])

  if (loading || !ready) return <Spinner />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const divisionTeams = teams.filter((x) => x.division_id === form.division_id)
  const divisionGroups = groups.filter((g) => g.division_id === form.division_id)

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const payload = {
      division_id: form.division_id,
      stage: form.stage,
      group_id: form.group_id || null,
      slot_label: form.slot_label || null,
      court: form.court || null,
      scheduled_at: fromDateTimeLocal(form.scheduled_at),
      home_team_id: form.home_team_id || null,
      away_team_id: form.away_team_id || null,
      home_label: form.home_label || null,
      away_label: form.away_label || null,
      duration_seconds: Number(form.duration_seconds) || RULES.REGULATION_SECONDS,
      target_score: Number(form.target_score) || RULES.TARGET_SCORE,
    }

    if (payload.home_team_id && payload.home_team_id === payload.away_team_id) {
      setBusy(false)
      setError('A team cannot play itself.')
      return
    }

    let res
    if (isNew) {
      res = await supabase.from('matches').insert({
        ...payload,
        clock_remaining_ms: payload.duration_seconds * 1000,
      })
    } else {
      res = await supabase.from('matches').update(payload).eq('id', matchId)
    }

    setBusy(false)
    if (res.error) {
      setError(errMsg(res.error))
      return
    }
    reload()
    navigate('/admin', { replace: true })
  }

  async function remove() {
    if (!window.confirm(t('confirmDelete'))) return
    setBusy(true)
    const { error: err } = await supabase.from('matches').delete().eq('id', matchId)
    setBusy(false)
    if (err) setError(errMsg(err))
    else {
      reload()
      navigate('/admin', { replace: true })
    }
  }

  async function resetScore() {
    if (!window.confirm(t('confirmDelete'))) return
    setBusy(true)
    const { error: err } = await supabase.rpc('reset_match', { p_match: matchId })
    setBusy(false)
    if (err) setError(errMsg(err))
  }

  return (
    <>
      <AdminBar title={isNew ? t('newMatch') : t('editMatch')} />

      <form onSubmit={save} className="space-y-4 px-3 py-4">
        <Field label={t('division')} required>
          <Select value={form.division_id} onChange={set('division_id')} required>
            <option value="">-</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {pick(d, 'name')}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('stage')} required>
            <Select value={form.stage} onChange={set('stage')}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {stageLabel(t, s)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('group')}>
            <Select value={form.group_id} onChange={set('group_id')}>
              <option value="">-</option>
              {divisionGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label={t('homeTeam')}>
          <Select value={form.home_team_id} onChange={set('home_team_id')}>
            <option value="">{t('tbd')}</option>
            {divisionTeams.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('awayTeam')}>
          <Select value={form.away_team_id} onChange={set('away_team_id')}>
            <option value="">{t('tbd')}</option>
            {divisionTeams.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>

        {form.stage !== 'group' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Label A" hint="A1 / Fituesi QF1">
              <Input value={form.home_label} onChange={set('home_label')} />
            </Field>
            <Field label="Label B" hint="B2 / Fituesi QF2">
              <Input value={form.away_label} onChange={set('away_label')} />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('dateTime')}>
            <Input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={set('scheduled_at')}
            />
          </Field>
          <Field label={t('court')}>
            <Input value={form.court} onChange={set('court')} placeholder="1" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label={t('duration')}>
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              max="60"
              value={Math.round(form.duration_seconds / 60)}
              onChange={(e) =>
                setForm((f) => ({ ...f, duration_seconds: (Number(e.target.value) || 10) * 60 }))
              }
            />
          </Field>
          <Field label={t('targetScore')}>
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              value={form.target_score}
              onChange={set('target_score')}
            />
          </Field>
          <Field label="Slot">
            <Input value={form.slot_label} onChange={set('slot_label')} placeholder="QF1" />
          </Field>
        </div>

        {error && (
          <p role="alert" className="border-2 border-red bg-panel px-3 py-2 text-[12px] text-red">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          <Save aria-hidden="true" className="h-4 w-4" />
          {t('save')}
        </Button>
      </form>

      {!isNew && (
        <>
          <Band>{t('reset')}</Band>
          <div className="space-y-2 px-3 py-3">
            <Button variant="ghost" className="w-full" onClick={resetScore} disabled={busy}>
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              {t('resetMatch')}
            </Button>
            <Button variant="danger" className="w-full" onClick={remove} disabled={busy}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              {t('deleteMatch')}
            </Button>
          </div>
        </>
      )}
    </>
  )
}
