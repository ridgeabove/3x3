-- ============================================================================
--  3x3 ALBANIA — database schema
--  Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
--  Safe to re-run: everything is guarded with "if not exists" / "or replace".
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- divisions
-- The two tournaments running at the event.
create table if not exists divisions (
  id          text primary key,          -- 'u18' | 'women'
  name_sq     text not null,
  name_en     text not null,
  sort_order  int  not null default 0
);

-- ------------------------------------------------------------------- groups
-- Group-stage pools (A, B, C, D). Created from the admin panel.
create table if not exists groups (
  id           uuid primary key default gen_random_uuid(),
  division_id  text not null references divisions (id) on delete cascade,
  name         text not null,
  sort_order   int  not null default 0,
  unique (division_id, name)
);

-- -------------------------------------------------------------------- teams
create table if not exists teams (
  id           uuid primary key default gen_random_uuid(),
  division_id  text not null references divisions (id) on delete cascade,
  group_id     uuid references groups (id) on delete set null,
  name         text not null,
  short_name   text,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  unique (division_id, name)
);

-- ------------------------------------------------------------------ players
create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams (id) on delete cascade,
  name        text not null,
  jersey      int,
  sort_order  int not null default 0
);

-- ------------------------------------------------------------------ matches
-- One row per game. Holds the live scoreboard state as well, so a single
-- realtime subscription is enough to drive every viewer's screen.
--
-- Clock model (server-authoritative):
--   stopped -> remaining time lives in clock_remaining_ms
--   running -> remaining = clock_remaining_ms - (now() - clock_started_at)
-- Clients only need the server-time offset to render a perfectly synced clock,
-- and we never write to the DB just to tick a second away.
create table if not exists matches (
  id           uuid primary key default gen_random_uuid(),
  division_id  text not null references divisions (id) on delete cascade,
  group_id     uuid references groups (id) on delete set null,
  stage        text not null default 'group'
                 check (stage in ('group', 'qf', 'sf', 'third', 'final')),
  slot_label   text,                       -- 'QF1', 'SF2' — used to wire the bracket
  court        text,
  scheduled_at timestamptz,
  sort_order   int not null default 0,

  home_team_id uuid references teams (id) on delete set null,
  away_team_id uuid references teams (id) on delete set null,
  home_label   text,                       -- 'A1' / 'Fituesi QF1' while the team is unknown
  away_label   text,

  home_score   int not null default 0,
  away_score   int not null default 0,
  home_fouls   int not null default 0,
  away_fouls   int not null default 0,
  home_timeouts_used int not null default 0,
  away_timeouts_used int not null default 0,

  status       text not null default 'scheduled'
                 check (status in ('scheduled', 'live', 'finished')),
  is_overtime  boolean not null default false,

  target_score     int not null default 21,   -- FIBA 3x3: first to 21 wins
  duration_seconds int not null default 600,  -- 10:00 regulation

  clock_status       text not null default 'stopped'
                       check (clock_status in ('stopped', 'running')),
  clock_remaining_ms int  not null default 600000,
  clock_started_at   timestamptz,

  shot_clock_status       text not null default 'stopped'
                            check (shot_clock_status in ('stopped', 'running')),
  shot_clock_remaining_ms int  not null default 12000,   -- FIBA 3x3: 12s
  shot_clock_started_at   timestamptz,

  winner_team_id uuid references teams (id) on delete set null,
  -- bracket wiring: when this match finishes, the winner is pushed into
  -- next_match_id's next_slot automatically.
  next_match_id  uuid references matches (id) on delete set null,
  next_slot      text check (next_slot in ('home', 'away')),

  updated_at   timestamptz not null default now()
);

-- ------------------------------------------------------------- match_events
-- Append-only log. Drives the play-by-play feed, player scoring stats and undo.
create table if not exists match_events (
  id          bigint generated always as identity primary key,
  match_id    uuid not null references matches (id) on delete cascade,
  team_id     uuid references teams (id) on delete set null,
  player_id   uuid references players (id) on delete set null,
  kind        text not null check (kind in ('point', 'foul', 'timeout')),
  points      int  not null default 0,
  clock_ms    int,                         -- game clock when it happened
  is_overtime boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_teams_division on teams (division_id);
create index if not exists idx_players_team on players (team_id);
create index if not exists idx_matches_division on matches (division_id);
create index if not exists idx_matches_status on matches (status);
create index if not exists idx_matches_scheduled on matches (scheduled_at);
create index if not exists idx_events_match on match_events (match_id, id desc);

-- ============================================================================
--  Row level security
--  Everyone can read (the site is public). Only signed-in users can write.
-- ============================================================================
alter table divisions    enable row level security;
alter table groups       enable row level security;
alter table teams        enable row level security;
alter table players      enable row level security;
alter table matches      enable row level security;
alter table match_events enable row level security;

do $$
declare t text;
begin
  foreach t in array array['divisions', 'groups', 'teams', 'players', 'matches', 'match_events']
  loop
    execute format('drop policy if exists p_read on %I', t);
    execute format('drop policy if exists p_write on %I', t);
    execute format('create policy p_read on %I for select using (true)', t);
    execute format(
      'create policy p_write on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Realtime: push scoreboard + play-by-play changes to every open browser.
-- Already-added tables are fine. If the publication is missing entirely, this
-- raises a notice instead of failing the script — enable Realtime for `matches`
-- and `match_events` under Database -> Replication and re-run.
do $$
declare t text;
begin
  foreach t in array array['matches', 'match_events']
  loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception
      when duplicate_object then null;
      when others then
        raise notice 'Could not add % to supabase_realtime: %. Enable it in Database -> Replication.', t, sqlerrm;
    end;
  end loop;
end $$;

-- ============================================================================
--  Helpers
-- ============================================================================

-- Clients call this once on load to measure their offset from server time, so
-- a phone with a wrong clock still shows the right countdown.
create or replace function server_now()
returns timestamptz language sql stable as $$
  select now();
$$;

create or replace function _remaining_ms(m matches)
returns int language sql stable as $$
  select case
           when m.clock_status = 'running' and m.clock_started_at is not null then
             greatest(0, m.clock_remaining_ms
                         - (extract(epoch from (now() - m.clock_started_at)) * 1000)::int)
           else m.clock_remaining_ms
         end;
$$;

create or replace function _require_admin()
returns void language plpgsql as $$
begin
  if auth.uid() is null then
    raise exception 'Not authorised: sign in as an admin first.';
  end if;
end $$;

-- Push the winner of a finished match into its bracket successor.
create or replace function _propagate_winner(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m matches;
begin
  select * into m from matches where id = p_match;
  if m.next_match_id is null or m.winner_team_id is null then
    return;
  end if;
  if m.next_slot = 'home' then
    update matches set home_team_id = m.winner_team_id, updated_at = now()
      where id = m.next_match_id;
  else
    update matches set away_team_id = m.winner_team_id, updated_at = now()
      where id = m.next_match_id;
  end if;
end $$;

-- Clear a successor slot again (used when a result is undone).
create or replace function _retract_winner(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m matches;
begin
  select * into m from matches where id = p_match;
  if m.next_match_id is null then return; end if;
  if m.next_slot = 'home' then
    update matches set home_team_id = null, updated_at = now() where id = m.next_match_id;
  else
    update matches set away_team_id = null, updated_at = now() where id = m.next_match_id;
  end if;
end $$;

-- Decide whether the game is over, and if so close it out.
-- Regulation: first to target_score (21) ends it instantly.
-- Overtime:   first to 2 points scored *in* overtime ends it.
create or replace function _check_finish(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m         matches;
  ot_home   int;
  ot_away   int;
  v_winner  uuid;
begin
  select * into m from matches where id = p_match;
  if m.status = 'finished' then return; end if;

  if m.is_overtime then
    select coalesce(sum(case when team_id = m.home_team_id then points else 0 end), 0),
           coalesce(sum(case when team_id = m.away_team_id then points else 0 end), 0)
      into ot_home, ot_away
      from match_events
      where match_id = p_match and kind = 'point' and is_overtime;

    if ot_home >= 2 and ot_home > ot_away then v_winner := m.home_team_id;
    elsif ot_away >= 2 and ot_away > ot_home then v_winner := m.away_team_id;
    end if;
  else
    if m.home_score >= m.target_score then v_winner := m.home_team_id;
    elsif m.away_score >= m.target_score then v_winner := m.away_team_id;
    end if;
  end if;

  if v_winner is not null then
    update matches set
      status = 'finished',
      winner_team_id = v_winner,
      clock_status = 'stopped',
      clock_remaining_ms = _remaining_ms(m),
      clock_started_at = null,
      shot_clock_status = 'stopped',
      shot_clock_started_at = null,
      updated_at = now()
    where id = p_match;
    perform _propagate_winner(p_match);
  end if;
end $$;

-- ============================================================================
--  Clock control
-- ============================================================================
create or replace function clock_start(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _require_admin();
  update matches set
    clock_status = 'running',
    clock_started_at = now(),
    status = case when status = 'scheduled' then 'live' else status end,
    shot_clock_status = 'running',
    shot_clock_started_at = now(),
    updated_at = now()
  where id = p_match and status <> 'finished' and clock_status = 'stopped';
end $$;

create or replace function clock_pause(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m matches;
begin
  perform _require_admin();
  select * into m from matches where id = p_match for update;
  if not found then raise exception 'Match not found'; end if;

  update matches set
    clock_remaining_ms = _remaining_ms(m),
    clock_status = 'stopped',
    clock_started_at = null,
    shot_clock_remaining_ms = case
        when m.shot_clock_status = 'running' and m.shot_clock_started_at is not null then
          greatest(0, m.shot_clock_remaining_ms
                      - (extract(epoch from (now() - m.shot_clock_started_at)) * 1000)::int)
        else m.shot_clock_remaining_ms
      end,
    shot_clock_status = 'stopped',
    shot_clock_started_at = null,
    updated_at = now()
  where id = p_match;
end $$;

-- Manual correction of the game clock (mm:ss set by the operator).
create or replace function clock_set(p_match uuid, p_ms int)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _require_admin();
  update matches set
    clock_remaining_ms = greatest(0, p_ms),
    clock_status = 'stopped',
    clock_started_at = null,
    updated_at = now()
  where id = p_match;
end $$;

create or replace function shot_clock_reset(p_match uuid, p_ms int default 12000)
returns void language plpgsql security definer set search_path = public as $$
declare m matches;
begin
  perform _require_admin();
  select * into m from matches where id = p_match;
  if not found then raise exception 'Match not found'; end if;

  update matches set
    shot_clock_remaining_ms = greatest(0, p_ms),
    -- keep it running only while the game clock is running
    shot_clock_status = case when m.clock_status = 'running' then 'running' else 'stopped' end,
    shot_clock_started_at = case when m.clock_status = 'running' then now() else null end,
    updated_at = now()
  where id = p_match;
end $$;

-- ============================================================================
--  Scoring
-- ============================================================================

-- 1 point inside the arc, 2 points outside. Logs the event, updates the score,
-- resets the shot clock and ends the game if the target score is reached.
create or replace function add_points(
  p_match  uuid,
  p_team   uuid,
  p_points int,
  p_player uuid default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  m        matches;
  v_clock  int;
begin
  perform _require_admin();
  if p_points not in (1, 2) then
    raise exception 'Points must be 1 or 2 (3x3 scoring)';
  end if;

  select * into m from matches where id = p_match for update;
  if not found then raise exception 'Match not found'; end if;
  if m.status = 'finished' then raise exception 'Match already finished'; end if;
  if p_team is distinct from m.home_team_id and p_team is distinct from m.away_team_id then
    raise exception 'Team does not play in this match';
  end if;

  v_clock := _remaining_ms(m);

  insert into match_events (match_id, team_id, player_id, kind, points, clock_ms, is_overtime)
    values (p_match, p_team, p_player, 'point', p_points, v_clock, m.is_overtime);

  update matches set
    home_score = home_score + case when p_team = m.home_team_id then p_points else 0 end,
    away_score = away_score + case when p_team = m.away_team_id then p_points else 0 end,
    status = case when status = 'scheduled' then 'live' else status end,
    updated_at = now()
  where id = p_match;

  perform shot_clock_reset(p_match, 12000);
  perform _check_finish(p_match);
end $$;

-- Team fouls. 7/8/9 -> two free throws, 10+ -> two free throws + possession.
-- The UI reads the count and shows the penalty state; the DB just counts.
create or replace function add_foul(p_match uuid, p_team uuid, p_player uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  m       matches;
  v_clock int;
begin
  perform _require_admin();
  select * into m from matches where id = p_match for update;
  if not found then raise exception 'Match not found'; end if;
  if m.status = 'finished' then raise exception 'Match already finished'; end if;

  v_clock := _remaining_ms(m);

  insert into match_events (match_id, team_id, player_id, kind, points, clock_ms, is_overtime)
    values (p_match, p_team, p_player, 'foul', 0, v_clock, m.is_overtime);

  update matches set
    home_fouls = home_fouls + case when p_team = m.home_team_id then 1 else 0 end,
    away_fouls = away_fouls + case when p_team = m.away_team_id then 1 else 0 end,
    status = case when status = 'scheduled' then 'live' else status end,
    updated_at = now()
  where id = p_match;

  perform shot_clock_reset(p_match, 12000);
end $$;

-- One timeout per team in FIBA 3x3.
create or replace function add_timeout(p_match uuid, p_team uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m       matches;
  v_clock int;
begin
  perform _require_admin();
  select * into m from matches where id = p_match for update;
  if not found then raise exception 'Match not found'; end if;

  v_clock := _remaining_ms(m);

  insert into match_events (match_id, team_id, kind, points, clock_ms, is_overtime)
    values (p_match, p_team, 'timeout', 0, v_clock, m.is_overtime);

  update matches set
    home_timeouts_used = home_timeouts_used
      + case when p_team = m.home_team_id then 1 else 0 end,
    away_timeouts_used = away_timeouts_used
      + case when p_team = m.away_team_id then 1 else 0 end,
    updated_at = now()
  where id = p_match;

  -- a timeout stops the clock
  perform clock_pause(p_match);
end $$;

-- Reverse the most recent event of a match. If that event had ended the game,
-- the match is reopened and the bracket successor slot is cleared again.
create or replace function undo_last_event(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m  matches;
  ev match_events;
begin
  perform _require_admin();
  select * into m from matches where id = p_match for update;
  if not found then raise exception 'Match not found'; end if;

  select * into ev from match_events
    where match_id = p_match order by id desc limit 1;
  if not found then return; end if;

  if m.status = 'finished' then
    perform _retract_winner(p_match);
  end if;

  update matches set
    home_score = greatest(0, home_score
      - case when ev.kind = 'point' and ev.team_id = m.home_team_id then ev.points else 0 end),
    away_score = greatest(0, away_score
      - case when ev.kind = 'point' and ev.team_id = m.away_team_id then ev.points else 0 end),
    home_fouls = greatest(0, home_fouls
      - case when ev.kind = 'foul' and ev.team_id = m.home_team_id then 1 else 0 end),
    away_fouls = greatest(0, away_fouls
      - case when ev.kind = 'foul' and ev.team_id = m.away_team_id then 1 else 0 end),
    home_timeouts_used = greatest(0, home_timeouts_used
      - case when ev.kind = 'timeout' and ev.team_id = m.home_team_id then 1 else 0 end),
    away_timeouts_used = greatest(0, away_timeouts_used
      - case when ev.kind = 'timeout' and ev.team_id = m.away_team_id then 1 else 0 end),
    status = case when status = 'finished' then 'live' else status end,
    winner_team_id = case when status = 'finished' then null else winner_team_id end,
    updated_at = now()
  where id = p_match;

  delete from match_events where id = ev.id;
end $$;

-- ============================================================================
--  Match state
-- ============================================================================

-- Called when regulation ends level: start a first-to-2 overtime.
create or replace function start_overtime(p_match uuid, p_seconds int default 120)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform _require_admin();
  update matches set
    is_overtime = true,
    status = 'live',
    winner_team_id = null,
    clock_status = 'stopped',
    clock_remaining_ms = p_seconds * 1000,
    clock_started_at = null,
    shot_clock_status = 'stopped',
    shot_clock_remaining_ms = 12000,
    shot_clock_started_at = null,
    updated_at = now()
  where id = p_match;
end $$;

-- Manual close-out: used when the clock runs out with a leader on the board.
create or replace function finish_match(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m        matches;
  v_winner uuid;
begin
  perform _require_admin();
  select * into m from matches where id = p_match for update;
  if not found then raise exception 'Match not found'; end if;
  if m.home_score = m.away_score then
    raise exception 'Scores are level — start overtime instead of finishing.';
  end if;

  v_winner := case when m.home_score > m.away_score then m.home_team_id
                   else m.away_team_id end;

  update matches set
    status = 'finished',
    winner_team_id = v_winner,
    clock_status = 'stopped',
    clock_remaining_ms = _remaining_ms(m),
    clock_started_at = null,
    shot_clock_status = 'stopped',
    shot_clock_started_at = null,
    updated_at = now()
  where id = p_match;

  perform _propagate_winner(p_match);
end $$;

-- Wipe a match back to 0-0 (operator error / test games).
create or replace function reset_match(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m matches;
begin
  perform _require_admin();
  select * into m from matches where id = p_match;
  if not found then raise exception 'Match not found'; end if;

  perform _retract_winner(p_match);
  delete from match_events where match_id = p_match;

  update matches set
    home_score = 0, away_score = 0,
    home_fouls = 0, away_fouls = 0,
    home_timeouts_used = 0, away_timeouts_used = 0,
    status = 'scheduled',
    is_overtime = false,
    winner_team_id = null,
    clock_status = 'stopped',
    clock_remaining_ms = duration_seconds * 1000,
    clock_started_at = null,
    shot_clock_status = 'stopped',
    shot_clock_remaining_ms = 12000,
    shot_clock_started_at = null,
    updated_at = now()
  where id = p_match;
end $$;

-- Anyone may read the clock helper; only these RPCs need to be callable.
grant execute on function server_now() to anon, authenticated;
grant execute on function clock_start(uuid)            to authenticated;
grant execute on function clock_pause(uuid)            to authenticated;
grant execute on function clock_set(uuid, int)         to authenticated;
grant execute on function shot_clock_reset(uuid, int)  to authenticated;
grant execute on function add_points(uuid, uuid, int, uuid) to authenticated;
grant execute on function add_foul(uuid, uuid, uuid)   to authenticated;
grant execute on function add_timeout(uuid, uuid)      to authenticated;
grant execute on function undo_last_event(uuid)        to authenticated;
grant execute on function start_overtime(uuid, int)    to authenticated;
grant execute on function finish_match(uuid)           to authenticated;
grant execute on function reset_match(uuid)            to authenticated;
