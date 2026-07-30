import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Play,
  Pause,
  Undo2,
  Flag,
  Timer,
  RotateCcw,
  Hand,
  Clock,
  X,
  Plus,
} from 'lucide-react'
import { useI18n, stageLabel } from '../lib/i18n'
import { useData } from '../hooks/DataProvider'
import { useMatch } from '../hooks/useTournament'
import { supabase, errMsg } from '../lib/supabase'
import { RULES, foulPenalty } from '../lib/rules'
import {
  formatClock,
  formatShotClock,
  remainingMs,
  shotClockMs,
  useTicker,
} from '../lib/clock'
import { Band, Button, Field, Input, Spinner, ErrorState, EmptyState } from '../components/ui'
import AdminBar from './AdminBar'

/**
 * Bottom sheet asking which player did it. Skippable, because during a fast game the
 * operator can log the team action now and never be blocked on a name.
 */
function PlayerSheet({ open, title, players, onPick, onClose }) {
  const { t } = useI18n()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full border-t-2 border-brand bg-ink"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b-2 border-line px-3 py-2">
          <span className="stamp text-[13px] text-brand">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="press flex min-h-11 min-w-11 items-center justify-center text-fg-mid"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="safe-bottom max-h-[60dvh] overflow-y-auto">
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              className="press flex min-h-14 w-full items-center border-b border-line px-4 text-left text-[15px] text-fg hover:bg-panel"
            >
              {p.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPick(null)}
            className="press flex min-h-14 w-full items-center px-4 text-left text-[14px] text-fg-dim hover:bg-panel"
          >
            {t('skipPlayer')}
          </button>
        </div>
      </div>
    </div>
  )
}

function TeamPanel({ team, label, score, fouls, timeoutsUsed, disabled, onScore, onFoul, onTimeout }) {
  const { t } = useI18n()
  const penalty = foulPenalty(fouls)

  return (
    <div className="flex flex-col gap-2 border-2 border-line bg-panel p-2">
      <div className="text-center">
        <p className="stamp truncate text-[12px] text-fg">{team?.name ?? label}</p>
        <p className="stamp text-[40px] leading-none tnum text-brand">{score}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" disabled={disabled} onClick={() => onScore(1)}>
          +1
        </Button>
        <Button size="lg" disabled={disabled} onClick={() => onScore(2)}>
          +2
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" disabled={disabled} onClick={onFoul}>
          <Hand aria-hidden="true" className="h-3.5 w-3.5" />
          {t('foul')} <span className="tnum">{fouls}</span>
        </Button>
        <Button
          variant="ghost"
          disabled={disabled || timeoutsUsed >= RULES.TIMEOUTS_PER_TEAM}
          onClick={onTimeout}
        >
          <Clock aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="tnum">{RULES.TIMEOUTS_PER_TEAM - timeoutsUsed}</span>
        </Button>
      </div>

      {penalty && (
        <p className="stamp bg-red px-1.5 py-1 text-center text-[10px] leading-tight text-white">
          {t(penalty)}
        </p>
      )}
    </div>
  )
}

export default function Console() {
  const { matchId } = useParams()
  const { t } = useI18n()
  const { teamById, playersByTeam, playerById } = useData()
  const { match, events, loading, error, reload } = useMatch(matchId)

  const [busy, setBusy] = useState(false)
  const [rpcError, setRpcError] = useState(null)
  const [sheet, setSheet] = useState(null) // { kind: 'point'|'foul', teamId, points }
  const [clockEdit, setClockEdit] = useState('')

  const running = match?.clock_status === 'running'
  useTicker(running, 100)

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!match) return <EmptyState title={t('noData')} />

  const home = teamById.get(match.home_team_id)
  const away = teamById.get(match.away_team_id)
  const finished = match.status === 'finished'
  const ms = remainingMs(match)
  const shot = shotClockMs(match)
  const noTeams = !match.home_team_id || !match.away_team_id

  async function call(fn, args) {
    setBusy(true)
    setRpcError(null)
    const { error: err } = await supabase.rpc(fn, args)
    setBusy(false)
    if (err) setRpcError(errMsg(err))
  }

  function requestScore(teamId, points) {
    const roster = playersByTeam.get(teamId) ?? []
    if (!roster.length) {
      call('add_points', { p_match: match.id, p_team: teamId, p_points: points })
      return
    }
    setSheet({ kind: 'point', teamId, points })
  }

  function requestFoul(teamId) {
    const roster = playersByTeam.get(teamId) ?? []
    if (!roster.length) {
      call('add_foul', { p_match: match.id, p_team: teamId })
      return
    }
    setSheet({ kind: 'foul', teamId })
  }

  function resolveSheet(playerId) {
    const s = sheet
    setSheet(null)
    if (!s) return
    if (s.kind === 'point') {
      call('add_points', {
        p_match: match.id,
        p_team: s.teamId,
        p_points: s.points,
        p_player: playerId,
      })
    } else {
      call('add_foul', { p_match: match.id, p_team: s.teamId, p_player: playerId })
    }
  }

  async function applyClock(e) {
    e.preventDefault()
    const [m, s] = clockEdit.split(':').map((v) => Number(v) || 0)
    const total = clockEdit.includes(':') ? m * 60 + s : m
    await call('clock_set', { p_match: match.id, p_ms: total * 1000 })
    setClockEdit('')
  }

  const lastEvent = events[0]

  return (
    <>
      <AdminBar
        title={`${home?.name ?? t('tbd')} v ${away?.name ?? t('tbd')}`}
        right={
          <span className="stamp shrink-0 text-[10px] text-fg-dim">
            {stageLabel(t, match.stage)}
          </span>
        }
      />

      {noTeams && (
        <p className="border-b-2 border-red bg-panel px-3 py-2 text-[12px] text-red">
          {t('tbd')} · {t('editMatch')}
        </p>
      )}

      {/* clock block */}
      <section className="flex flex-col items-center gap-2 border-b-2 border-brand bg-panel px-3 py-4">
        <span
          className={`stamp text-[56px] leading-none tnum ${ms <= 60000 ? 'text-red' : 'text-fg'}`}
        >
          {formatClock(ms, { tenths: false })}
        </span>

        <div className="flex items-center gap-2">
          <span className="stamp flex items-center gap-1 border-2 border-line px-2 py-1 text-[12px] text-fg-mid">
            <Timer aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="tnum">{formatShotClock(shot)}</span>
          </span>
          {match.is_overtime && (
            <span className="stamp bg-red px-2 py-1 text-[11px] text-white">{t('overtime')}</span>
          )}
          {finished && (
            <span className="stamp bg-brand px-2 py-1 text-[11px] text-brand-ink">
              {t('finished')}
            </span>
          )}
        </div>

        <div className="grid w-full grid-cols-2 gap-2">
          {running ? (
            <Button
              size="lg"
              variant="danger"
              disabled={busy}
              onClick={() => call('clock_pause', { p_match: match.id })}
            >
              <Pause aria-hidden="true" className="h-4 w-4" />
              {t('pause')}
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={busy || finished || noTeams}
              onClick={() => call('clock_start', { p_match: match.id })}
            >
              <Play aria-hidden="true" className="h-4 w-4" />
              {ms === match.duration_seconds * 1000 ? t('start') : t('resume')}
            </Button>
          )}
          <Button
            size="lg"
            variant="ghost"
            disabled={busy}
            onClick={() => call('shot_clock_reset', { p_match: match.id, p_ms: RULES.SHOT_CLOCK_MS })}
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            {t('resetShotClock')}
          </Button>
        </div>
      </section>

      {rpcError && (
        <p role="alert" className="border-b-2 border-red bg-panel px-3 py-2 text-[12px] text-red">
          {rpcError}
        </p>
      )}

      {/* scoring */}
      <div className="grid grid-cols-2 gap-2 p-2">
        <TeamPanel
          team={home}
          label={match.home_label ?? t('tbd')}
          score={match.home_score}
          fouls={match.home_fouls}
          timeoutsUsed={match.home_timeouts_used}
          disabled={busy || finished || !match.home_team_id}
          onScore={(pts) => requestScore(match.home_team_id, pts)}
          onFoul={() => requestFoul(match.home_team_id)}
          onTimeout={() => call('add_timeout', { p_match: match.id, p_team: match.home_team_id })}
        />
        <TeamPanel
          team={away}
          label={match.away_label ?? t('tbd')}
          score={match.away_score}
          fouls={match.away_fouls}
          timeoutsUsed={match.away_timeouts_used}
          disabled={busy || finished || !match.away_team_id}
          onScore={(pts) => requestScore(match.away_team_id, pts)}
          onFoul={() => requestFoul(match.away_team_id)}
          onTimeout={() => call('add_timeout', { p_match: match.id, p_team: match.away_team_id })}
        />
      </div>

      {/* corrections */}
      <div className="grid grid-cols-2 gap-2 px-2 pb-2">
        <Button
          variant="ghost"
          disabled={busy || !lastEvent}
          onClick={() => call('undo_last_event', { p_match: match.id })}
        >
          <Undo2 aria-hidden="true" className="h-4 w-4" />
          {t('undo')}
        </Button>
        <Button
          variant="ghost"
          disabled={busy || finished || match.home_score === match.away_score}
          onClick={() => call('finish_match', { p_match: match.id })}
        >
          <Flag aria-hidden="true" className="h-4 w-4" />
          {t('finish')}
        </Button>
      </div>

      <div className="px-2 pb-3">
        <Button
          variant="ghost"
          className="w-full"
          disabled={busy || match.home_score !== match.away_score}
          onClick={() =>
            call('start_overtime', { p_match: match.id, p_seconds: RULES.OVERTIME_SECONDS })
          }
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {t('startOvertime')}
        </Button>
      </div>

      {/* manual clock correction */}
      <Band>{t('setClock')}</Band>
      <form onSubmit={applyClock} className="flex items-end gap-2 px-3 py-3">
        <div className="flex-1">
          <Field label={t('setClock')} hint="mm:ss">
            <Input
              value={clockEdit}
              onChange={(e) => setClockEdit(e.target.value)}
              placeholder="10:00"
              inputMode="numeric"
            />
          </Field>
        </div>
        <Button type="submit" disabled={busy || !clockEdit.trim()}>
          {t('save')}
        </Button>
      </form>

      {/* recent events, so the operator can see what they just logged */}
      <Band right={String(events.length)}>{t('playByPlay')}</Band>
      <ul>
        {events.slice(0, 12).map((e) => {
          const team = teamById.get(e.team_id)
          const player = playerById.get(e.player_id)
          return (
            <li
              key={e.id}
              className="flex items-center gap-2 border-b border-line px-3 py-2 text-[12px]"
            >
              <span className="stamp w-10 shrink-0 tnum text-fg-dim">
                {formatClock(e.clock_ms ?? 0, { tenths: false })}
              </span>
              <span className="stamp w-12 shrink-0 text-brand">
                {e.kind === 'point' ? `+${e.points}` : e.kind === 'foul' ? t('foul') : t('timeout')}
              </span>
              <span className="min-w-0 flex-1 truncate text-fg-mid">
                {player?.name ?? team?.name ?? '-'}
              </span>
            </li>
          )
        })}
      </ul>

      <PlayerSheet
        open={Boolean(sheet)}
        title={sheet?.kind === 'foul' ? t('selectFouler') : t('selectScorer')}
        players={sheet ? (playersByTeam.get(sheet.teamId) ?? []) : []}
        onPick={resolveSheet}
        onClose={() => setSheet(null)}
      />
    </>
  )
}
