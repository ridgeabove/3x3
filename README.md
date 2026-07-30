# 3x3 Albania | Shkoder

Live scoring site for the 11th edition. Mobile-first, Flashscore-style match list,
with an admin console that runs the clock, the score and the fouls in real time.
Everything a viewer sees updates the moment the scorekeeper taps a button.

- **Public**: matches by day, live tab, teams and rosters, group standings, knockout bracket, event info
- **Admin**: email login, group draw, automatic fixture and bracket generation, live match console
- **Languages**: Albanian (default) and English, toggled in the header
- **Rules**: official FIBA 3x3, so 10 minutes or first to 21, 1/2 point scoring, 12s shot clock, team-foul penalties, first-to-2 overtime

## Stack

React 18 · Vite 5 · Tailwind CSS 4 · React Router 6 · Supabase (Postgres + Realtime + Auth)

---

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste all of [`supabase/01_schema.sql`](supabase/01_schema.sql), run it.
   This creates the tables, row-level security, realtime publication and the
   scoring/clock functions.
3. New query again, paste [`supabase/02_seed.sql`](supabase/02_seed.sql), run it.
   This loads the two tournaments plus all 20 teams and their rosters. It ends
   with a count so you can confirm 14 U18 teams and 6 women's teams landed.
4. Create the admin user: **Authentication → Users → Add user**. Set an email and
   password and tick *Auto Confirm User*. Repeat for each scorekeeper. Anyone
   who can sign in can score any match.

> Signup is not exposed anywhere in the app. Accounts exist only if you create
> them in the dashboard. Consider turning off **Authentication → Providers →
> Email → Enable signup** so nobody can self-register.

## 2. Configure and run locally

```bash
cp .env.example .env      # then fill in the two values
npm install
npm run dev
```

Both values come from **Project Settings → API**:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

The anon key is safe to ship in the browser. Row-level security is what
protects the data. Reads are public; every write requires a signed-in user.

If `.env` is missing the app still loads and tells you what to add instead of
showing a blank screen.

## 3. Run a tournament

**Before the event**, go to `/admin` → *Grupet dhe kalendari*:

1. Pick a tournament (U18 / Women).
2. Add groups (A, B, C, D) and assign each team to one.
3. *Gjenero ndeshjet e grupit*: set the first tip-off time, minutes per slot and
   the court names (`1, 2`), then generate. Every team plays every other team in
   its group once, spread across the courts you listed. Re-running replaces the
   existing group fixtures, so you can redo a draw safely.
4. *Gjenero fazen eliminatore*: choose a 4- or 8-team bracket. Matches are
   created with seed placeholders (`A1`, `B2`, `Fituesi SF1`) and wired together:
   when a knockout match finishes, the winner drops into the next round on its own.
   Once the groups are decided, open each knockout match and pick the real teams.

**During a match**, go to `/admin` → the yellow ▶ button next to it:

- **Nis / Ndalo** starts and stops the game clock. The 12-second shot clock
  follows it and resets automatically on every basket, foul and timeout.
- **+1 / +2** per team. If the team has a roster you'll be asked who scored.
  Tap a name to log it, or *Pa lojtar* to skip and keep moving. This is what
  fills in each player's points total.
- **Faul** counts team fouls. At 7 the panel turns red (2 free throws), at 10 it
  shows free throws + possession.
- **Pushim** logs the single timeout each team gets and stops the clock.
- **Zhbej** reverses the last action of any kind, including one that ended the game.
- The game closes itself the instant a team reaches 21. If time runs out with a
  leader, press **Perfundo**. If it's level, press **Nis shtesen** for a
  first-to-2 overtime.
- **Cakto oren** fixes the clock by hand (`mm:ss`) if something went wrong.

The clock is stored as "time remaining + when it started", both on the server, so
every phone in the gym counts down in step. Each device measures its own offset
from the database clock on load, so a viewer whose phone clock is wrong still
sees the right time.

## 4. Deploy to Cloudflare Pages

1. Push this folder to a Git repository.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add the two environment variables (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) under **Settings → Environment variables**, for both
   Production and Preview. Vite inlines them at build time, so a variable added
   after a build needs a redeploy.

[`public/_redirects`](public/_redirects) is already in place so deep links like
`/standings` and `/admin` work on refresh.

## Project layout

```
supabase/01_schema.sql     tables, RLS, realtime, scoring + clock functions
supabase/02_seed.sql       divisions, 20 teams, full rosters
src/lib/                   supabase client, i18n (sq/en), 3x3 rules, clock maths, standings
src/hooks/                 auth, realtime match feed, shared tournament data
src/components/            app shell, match row, date strip, standings table, bracket, UI kit
src/pages/                 matches, live, teams, team detail, standings, match detail, info
src/admin/                 login, dashboard, setup, match editor, live console
public/logos/              3x3 Albania, Bashkia Shkoder, FSHB
```

Design tokens (colours, fonts, spacing) live in the `@theme` block at the top of
[`src/index.css`](src/index.css). Change the yellow there and it changes everywhere.

## Notes

- `src/lib/rules.js` holds every 3x3 constant in one place. Duration and target
  score are also per-match columns, so a shorter group game is just an edit.
- Standings use FIBA 3x3 scoring: win 2 points, loss 1. Ties break on
  head-to-head, then point difference, then points scored.
- Team crests are generated from initials; there are no per-team logo files.
- The 2.4 MB `3x3.png` is only used to generate `3x3-320.png` (header, 35 KB) and
  `3x3-900.png` (info page, 226 KB). Keep pointing at the resized ones.
