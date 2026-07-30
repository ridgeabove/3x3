import { useState } from 'react'
import { Plus, Trash2, Wand2, Swords, Check } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { supabase, errMsg } from '../lib/supabase'
import { RULES } from '../lib/rules'
import { roundRobin } from '../lib/standings'
import { toDateTimeLocal, fromDateTimeLocal } from '../lib/dates'
import { Band, Button, Chip, Field, Input, Select, Spinner } from '../components/ui'
import AdminBar from './AdminBar'

/** Default kickoff: today at 10:00, which is what a tournament day looks like. */
function defaultStart() {
  const d = new Date()
  d.setHours(10, 0, 0, 0)
  return toDateTimeLocal(d.toISOString())
}

function GroupManager({ division, onError }) {
  const { t } = useI18n()
  const { groups, teams, reload } = useData()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const divGroups = groups.filter((g) => g.division_id === division.id)
  const divTeams = teams.filter((tm) => tm.division_id === division.id)

  async function addGroup() {
    const clean = name.trim().toUpperCase()
    if (!clean) return
    setBusy(true)
    const { error } = await supabase.from('groups').insert({
      division_id: division.id,
      name: clean,
      sort_order: divGroups.length + 1,
    })
    setBusy(false)
    if (error) onError(errMsg(error))
    else {
      setName('')
      reload()
    }
  }

  async function removeGroup(id) {
    if (!window.confirm(t('confirmDelete'))) return
    setBusy(true)
    const { error } = await supabase.from('groups').delete().eq('id', id)
    setBusy(false)
    if (error) onError(errMsg(error))
    else reload()
  }

  async function assign(teamId, groupId) {
    const { error } = await supabase
      .from('teams')
      .update({ group_id: groupId || null })
      .eq('id', teamId)
    if (error) onError(errMsg(error))
    else reload()
  }

  return (
    <>
      <Band>{t('createGroup')}</Band>
      <div className="flex gap-2 px-3 py-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('groupName')}
          maxLength={8}
          aria-label={t('groupName')}
        />
        <Button onClick={addGroup} disabled={busy || !name.trim()}>
          <Plus aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>

      {divGroups.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pb-3">
          {divGroups.map((g) => {
            const count = divTeams.filter((tm) => tm.group_id === g.id).length
            return (
              <span
                key={g.id}
                className="stamp flex items-center gap-2 border-2 border-line bg-panel px-2 py-1 text-[12px]"
              >
                {g.name}
                <span className="tnum text-fg-dim">{count}</span>
                <button
                  type="button"
                  onClick={() => removeGroup(g.id)}
                  aria-label={`${t('confirmDelete')} ${g.name}`}
                  className="press text-red"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      <Band right={`${divTeams.length}`}>{t('assignTeams')}</Band>
      <ul>
        {divTeams.map((tm) => (
          <li key={tm.id} className="flex items-center gap-2 border-b border-line px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-[13px] text-fg-mid">{tm.name}</span>
            <Select
              value={tm.group_id ?? ''}
              onChange={(e) => assign(tm.id, e.target.value)}
              aria-label={`${t('group')}: ${tm.name}`}
              className="max-w-[110px]"
            >
              <option value="">{t('noGroup')}</option>
              {divGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </li>
        ))}
      </ul>
    </>
  )
}

function FixtureGenerator({ division, onError, onDone }) {
  const { t } = useI18n()
  const { groups, teams, matches, reload } = useData()
  const [start, setStart] = useState(defaultStart)
  const [slotMinutes, setSlotMinutes] = useState(15)
  const [courts, setCourts] = useState('1, 2')
  const [busy, setBusy] = useState(false)

  const divGroups = groups.filter((g) => g.division_id === division.id)
  const divTeams = teams.filter((tm) => tm.division_id === division.id)
  const existingGroupMatches = matches.filter(
    (m) => m.division_id === division.id && m.stage === 'group'
  )

  async function generate() {
    const courtList = courts
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
    if (!courtList.length) courtList.push('1')

    if (existingGroupMatches.length && !window.confirm(t('confirmDelete'))) return

    setBusy(true)
    onError(null)

    // start from a clean slate so re-running the draw never duplicates fixtures
    if (existingGroupMatches.length) {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('division_id', division.id)
        .eq('stage', 'group')
      if (error) {
        setBusy(false)
        onError(errMsg(error))
        return
      }
    }

    const rows = []
    for (const g of divGroups) {
      const ids = divTeams.filter((tm) => tm.group_id === g.id).map((tm) => tm.id)
      for (const [home, away] of roundRobin(ids)) {
        rows.push({ group_id: g.id, home_team_id: home, away_team_id: away })
      }
    }

    if (!rows.length) {
      setBusy(false)
      onError('No teams are assigned to groups yet.')
      return
    }

    // spread games across courts: every court plays the same slot, then time advances
    const startMs = new Date(fromDateTimeLocal(start)).getTime()
    const payload = rows.map((row, i) => {
      const slot = Math.floor(i / courtList.length)
      return {
        ...row,
        division_id: division.id,
        stage: 'group',
        court: courtList[i % courtList.length],
        scheduled_at: new Date(startMs + slot * slotMinutes * 60000).toISOString(),
        sort_order: i + 1,
        duration_seconds: RULES.REGULATION_SECONDS,
        target_score: RULES.TARGET_SCORE,
        clock_remaining_ms: RULES.REGULATION_SECONDS * 1000,
      }
    })

    const { error } = await supabase.from('matches').insert(payload)
    setBusy(false)
    if (error) onError(errMsg(error))
    else {
      reload()
      onDone(`${payload.length} ${t('fixturesCreated')}`)
    }
  }

  return (
    <>
      <Band>{t('generateFixtures')}</Band>
      <div className="space-y-3 px-3 py-3">
        <Field label={t('dateTime')}>
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min / slot">
            <Input
              type="number"
              inputMode="numeric"
              min="5"
              max="120"
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value) || 15)}
            />
          </Field>
          <Field label={t('court')} hint="1, 2">
            <Input value={courts} onChange={(e) => setCourts(e.target.value)} />
          </Field>
        </div>
        <Button className="w-full" onClick={generate} disabled={busy || !divGroups.length}>
          <Wand2 aria-hidden="true" className="h-4 w-4" />
          {t('generateFixtures')}
        </Button>
        {existingGroupMatches.length > 0 && (
          <p className="text-[11px] text-fg-dim">
            {existingGroupMatches.length} {t('matchCount')} · {t('generateFixtures')} ⟳
          </p>
        )}
      </div>
    </>
  )
}

function BracketGenerator({ division, onError, onDone }) {
  const { t } = useI18n()
  const { groups, matches, reload } = useData()
  const [size, setSize] = useState(4)
  const [start, setStart] = useState(defaultStart)
  const [thirdPlace, setThirdPlace] = useState(true)
  const [busy, setBusy] = useState(false)

  const divGroups = groups.filter((g) => g.division_id === division.id)
  const existing = matches.filter((m) => m.division_id === division.id && m.stage !== 'group')

  /** 'A1' style seed labels, falling back to plain numbers when groups are missing. */
  function seed(groupIndex, place) {
    const g = divGroups[groupIndex]
    return g ? `${g.name}${place}` : `${groupIndex + 1}.${place}`
  }

  async function generate() {
    if (existing.length && !window.confirm(t('confirmDelete'))) return

    setBusy(true)
    onError(null)

    if (existing.length) {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('division_id', division.id)
        .neq('stage', 'group')
      if (error) {
        setBusy(false)
        onError(errMsg(error))
        return
      }
    }

    const startMs = new Date(fromDateTimeLocal(start)).getTime()
    const at = (slot) => new Date(startMs + slot * 20 * 60000).toISOString()
    const base = {
      division_id: division.id,
      duration_seconds: RULES.REGULATION_SECONDS,
      target_score: RULES.TARGET_SCORE,
      clock_remaining_ms: RULES.REGULATION_SECONDS * 1000,
    }

    try {
      // Build from the end backwards so each round can point at the next one.
      const rounds = size === 8 ? 3 : 2
      const finalSlot = rounds

      const { data: finalRow, error: fErr } = await supabase
        .from('matches')
        .insert({
          ...base,
          stage: 'final',
          slot_label: 'FINAL',
          home_label: 'Fituesi SF1',
          away_label: 'Fituesi SF2',
          scheduled_at: at(finalSlot),
          sort_order: 900,
        })
        .select('id')
        .single()
      if (fErr) throw fErr

      if (thirdPlace) {
        const { error } = await supabase.from('matches').insert({
          ...base,
          stage: 'third',
          slot_label: '3RD',
          home_label: 'Humbesi SF1',
          away_label: 'Humbesi SF2',
          scheduled_at: at(finalSlot - 1),
          sort_order: 890,
        })
        if (error) throw error
      }

      // semi-finals feed the final
      const semiPayload = [1, 2].map((n) => ({
        ...base,
        stage: 'sf',
        slot_label: `SF${n}`,
        home_label: size === 8 ? `Fituesi QF${n * 2 - 1}` : seed(n - 1, 1),
        away_label: size === 8 ? `Fituesi QF${n * 2}` : seed(n === 1 ? 1 : 0, 2),
        scheduled_at: at(finalSlot - 2),
        sort_order: 800 + n,
        next_match_id: finalRow.id,
        next_slot: n === 1 ? 'home' : 'away',
      }))

      const { data: semis, error: sErr } = await supabase
        .from('matches')
        .insert(semiPayload)
        .select('id, slot_label')
      if (sErr) throw sErr

      let created = 1 + (thirdPlace ? 1 : 0) + semis.length

      if (size === 8) {
        const semiByLabel = new Map(semis.map((s) => [s.slot_label, s.id]))
        // QF1/QF2 -> SF1, QF3/QF4 -> SF2 · pairings A1-B2, B1-A2, C1-D2, D1-C2
        const pairs = [
          [seed(0, 1), seed(1, 2), 'SF1', 'home'],
          [seed(1, 1), seed(0, 2), 'SF1', 'away'],
          [seed(2, 1), seed(3, 2), 'SF2', 'home'],
          [seed(3, 1), seed(2, 2), 'SF2', 'away'],
        ]
        const qfPayload = pairs.map(([h, a, sf, slot], i) => ({
          ...base,
          stage: 'qf',
          slot_label: `QF${i + 1}`,
          home_label: h,
          away_label: a,
          scheduled_at: at(0),
          sort_order: 700 + i,
          next_match_id: semiByLabel.get(sf),
          next_slot: slot,
        }))
        const { error: qErr } = await supabase.from('matches').insert(qfPayload)
        if (qErr) throw qErr
        created += qfPayload.length
      }

      reload()
      onDone(`${created} ${t('fixturesCreated')}`)
    } catch (err) {
      onError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Band>{t('generateBracket')}</Band>
      <div className="space-y-3 px-3 py-3">
        <Field label={t('bracketSize')}>
          <div className="flex gap-2">
            <Chip active={size === 4} onClick={() => setSize(4)}>
              4
            </Chip>
            <Chip active={size === 8} onClick={() => setSize(8)}>
              8
            </Chip>
          </div>
        </Field>
        <Field label={t('dateTime')}>
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-[13px] text-fg-mid">
          <input
            type="checkbox"
            checked={thirdPlace}
            onChange={(e) => setThirdPlace(e.target.checked)}
            className="h-5 w-5 accent-[#ffc300]"
          />
          {t('stageThird')}
        </label>
        <Button className="w-full" onClick={generate} disabled={busy}>
          <Swords aria-hidden="true" className="h-4 w-4" />
          {t('generateBracket')}
        </Button>
        <p className="text-[11px] leading-relaxed text-fg-dim">
          {seed(0, 1)} v {seed(1, 2)}, {seed(1, 1)} v {seed(0, 2)} … · {t('editMatch')}.
        </p>
      </div>
    </>
  )
}

export default function AdminSetup() {
  const { t, pick } = useI18n()
  const { divisions, loading } = useData()
  const [divId, setDivId] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  if (loading) return <Spinner />

  const division = divisions.find((d) => d.id === divId) ?? divisions[0]
  if (!division) return <Band>{t('noData')}</Band>

  function announce(message) {
    setNotice(message)
    setTimeout(() => setNotice(null), 4000)
  }

  return (
    <>
      <AdminBar title={t('adminSetup')} />

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b-2 border-line px-3 py-2">
        {divisions.map((d) => (
          <Chip key={d.id} active={division.id === d.id} onClick={() => setDivId(d.id)}>
            {pick(d, 'name')}
          </Chip>
        ))}
      </div>

      {notice && (
        <p
          role="status"
          className="stamp flex items-center gap-2 border-b-2 border-ok bg-panel px-3 py-2 text-[12px] text-ok"
        >
          <Check aria-hidden="true" className="h-4 w-4" />
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="border-b-2 border-red bg-panel px-3 py-2 text-[12px] text-red">
          {error}
        </p>
      )}

      <GroupManager division={division} onError={setError} />
      <FixtureGenerator division={division} onError={setError} onDone={announce} />
      <BracketGenerator division={division} onError={setError} onDone={announce} />
    </>
  )
}
