import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Albanian is the default — this is a Shkoder event. English is one tap away
 * in the header for visiting players and referees.
 */
const STRINGS = {
  sq: {
    // navigation
    navMatches: 'Ndeshjet',
    navLive: 'Live',
    navTeams: 'Skuadrat',
    navStandings: 'Klasifikimi',
    navInfo: 'Info',

    // shared
    all: 'Te gjitha',
    today: 'Sot',
    tomorrow: 'Nesër',
    yesterday: 'Dje',
    live: 'Live',
    finished: 'Perfunduar',
    scheduled: 'Programuar',
    loading: 'Duke u ngarkuar…',
    retry: 'Provo perseri',
    back: 'Kthehu',
    close: 'Mbyll',
    save: 'Ruaj',
    cancel: 'Anulo',
    court: 'Fusha',
    time: 'Ora',
    group: 'Grupi',
    vs: 'kunder',
    tbd: 'Do caktohet',
    noData: 'Nuk ka te dhena',

    // divisions
    division: 'Turneu',
    u18: 'Turneu U18',
    women: 'Turneu i Femrave',

    // match list
    allGames: 'Te gjitha ndeshjet',
    liveNow: 'Live tani',
    noMatchesDay: 'Nuk ka ndeshje ne kete date',
    noMatchesDayHint: 'Zgjidh nje date tjeter ose shiko klasifikimin.',
    noLiveMatches: 'Asnje ndeshje live',
    noLiveMatchesHint: 'Kthehu kur te filloje ndeshja e radhes.',
    matchCount: 'ndeshje',

    // stages
    stageGroup: 'Faza e grupeve',
    stageQf: 'Cerekfinale',
    stageSf: 'Gjysmefinale',
    stageThird: 'Vendi i 3-te',
    stageFinal: 'Finale',
    knockout: 'Faza eliminatore',

    // match detail
    fouls: 'Faulet',
    teamFouls: 'Faulet e skuadres',
    timeouts: 'Pushime',
    shotClock: 'Ora e goditjes',
    overtime: 'Shtese',
    freeThrows: '2 goditje te lira',
    ftPlusPossession: '2 goditje te lira + posedim',
    penaltyState: 'Ne penalitet',
    playByPlay: 'Ecuria e ndeshjes',
    roster: 'Lojtaret',
    points: 'Pike',
    noEvents: 'Ndeshja nuk ka filluar.',
    winner: 'Fituesi',
    finalScore: 'Rezultati final',
    firstTo: 'I pari ne',

    // teams
    teamsCount: 'skuadra',
    players: 'lojtare',
    teamMatches: 'Ndeshjet e skuadres',
    noGroup: 'Pa grup',

    // standings
    standingsTeam: 'Skuadra',
    standingsPlayed: 'N',
    standingsWon: 'F',
    standingsLost: 'H',
    standingsScored: 'PB',
    standingsAgainst: 'PK',
    standingsDiff: '+/-',
    standingsPoints: 'Pt',
    legendPlayed: 'N = Ndeshje',
    legendWon: 'F = Fitore',
    legendLost: 'H = Humbje',
    legendScored: 'PB = Pike te bera',
    legendAgainst: 'PK = Pike te pesuara',
    legendPoints: 'Pt = Pike (fitore 2, humbje 1)',
    standingsEmpty: 'Grupet nuk jane caktuar ende.',
    standingsEmptyHint: 'Admini i cakton skuadrat ne grupe nga paneli.',

    // info
    aboutTitle: 'Edicioni i 11-te',
    aboutTagline: 'Nga Shkodra, per lojen, per historine, per ne.',
    aboutBody:
      'Turneu 3x3 Albania kthehet ne Shkoder me edicionin e 11-te: dy turne, dhjetera skuadra dhe rezultate live ne kete faqe.',
    contests: 'Konkurset speciale',
    contest3pt: 'Konkursi i 3 pikeve',
    contestDunk: 'Konkursi i dunk-eve',
    contestPrize: 'Fituesi',
    rulesTitle: 'Rregullat e lojes',
    rule1: 'Ndeshja zgjat 10 minuta ose deri ne 21 pike — kush arrin i pari.',
    rule2: 'Goditjet brenda harkut 1 pike, jashte harkut 2 pike.',
    rule3: 'Ora e goditjes: 12 sekonda.',
    rule4: 'Faulet 7, 8 dhe 9 — 2 goditje te lira. Nga 10 — 2 goditje te lira + posedim.',
    rule5: 'Nje pushim per skuadre. Ne shtese fiton skuadra e para me 2 pike.',
    organisers: 'Organizatoret dhe partneret',
    followUs: 'Ndiqni 3x3 Albania',

    // admin
    admin: 'Admin',
    adminPanel: 'Paneli i adminit',
    signIn: 'Hyr',
    signOut: 'Dil',
    email: 'Email',
    password: 'Fjalekalimi',
    signingIn: 'Duke hyre…',
    signInHint: 'Vetem organizatoret kane akses.',
    adminMatches: 'Ndeshjet',
    adminSetup: 'Grupet dhe kalendari',
    newMatch: 'Ndeshje e re',
    editMatch: 'Ndrysho ndeshjen',
    deleteMatch: 'Fshi ndeshjen',
    openConsole: 'Hap konsolen',
    console: 'Konsola e ndeshjes',
    start: 'Nis',
    pause: 'Ndalo',
    resume: 'Vazhdo',
    reset: 'Rikthe',
    undo: 'Zhbej',
    finish: 'Perfundo',
    startOvertime: 'Nis shtesen',
    resetMatch: 'Rikthe ndeshjen ne 0-0',
    setClock: 'Cakto oren',
    resetShotClock: 'Rikthe 12s',
    addPoint: 'pike',
    foul: 'Faul',
    timeout: 'Pushim',
    selectScorer: 'Kush shenoi?',
    selectFouler: 'Kush beri faulin?',
    skipPlayer: 'Pa lojtar',
    createGroup: 'Shto grup',
    groupName: 'Emri i grupit',
    assignTeams: 'Caktoni skuadrat',
    generateFixtures: 'Gjenero ndeshjet e grupit',
    generateBracket: 'Gjenero fazen eliminatore',
    bracketSize: 'Numri i skuadrave',
    fixturesCreated: 'ndeshje u krijuan',
    confirmDelete: 'Jeni i sigurt?',
    savedOk: 'U ruajt',
    homeTeam: 'Skuadra A',
    awayTeam: 'Skuadra B',
    stage: 'Faza',
    dateTime: 'Data dhe ora',
    duration: 'Kohezgjatja (min)',
    targetScore: 'Pikët per fitore',
    noAccess: 'Nuk keni akses',

    // errors / setup
    notConfigured: 'Baza e te dhenave nuk eshte konfiguruar',
    notConfiguredHint:
      'Kopjo .env.example ne .env, vendos VITE_SUPABASE_URL dhe VITE_SUPABASE_ANON_KEY, dhe rinis serverin.',
    loadError: 'Ngarkimi deshtoi',
  },

  en: {
    navMatches: 'Matches',
    navLive: 'Live',
    navTeams: 'Teams',
    navStandings: 'Standings',
    navInfo: 'Info',

    all: 'All',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    live: 'Live',
    finished: 'Finished',
    scheduled: 'Scheduled',
    loading: 'Loading…',
    retry: 'Try again',
    back: 'Back',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    court: 'Court',
    time: 'Time',
    group: 'Group',
    vs: 'vs',
    tbd: 'TBD',
    noData: 'No data',

    division: 'Tournament',
    u18: 'U18 Tournament',
    women: "Women's Tournament",

    allGames: 'All games',
    liveNow: 'Live now',
    noMatchesDay: 'No matches on this date',
    noMatchesDayHint: 'Pick another date or check the standings.',
    noLiveMatches: 'No live matches',
    noLiveMatchesHint: 'Come back when the next game tips off.',
    matchCount: 'matches',

    stageGroup: 'Group stage',
    stageQf: 'Quarter-finals',
    stageSf: 'Semi-finals',
    stageThird: '3rd place',
    stageFinal: 'Final',
    knockout: 'Knockout',

    fouls: 'Fouls',
    teamFouls: 'Team fouls',
    timeouts: 'Timeouts',
    shotClock: 'Shot clock',
    overtime: 'Overtime',
    freeThrows: '2 free throws',
    ftPlusPossession: '2 free throws + possession',
    penaltyState: 'In penalty',
    playByPlay: 'Play by play',
    roster: 'Roster',
    points: 'Points',
    noEvents: 'The match has not started.',
    winner: 'Winner',
    finalScore: 'Final score',
    firstTo: 'First to',

    teamsCount: 'teams',
    players: 'players',
    teamMatches: 'Team matches',
    noGroup: 'No group',

    standingsTeam: 'Team',
    standingsPlayed: 'P',
    standingsWon: 'W',
    standingsLost: 'L',
    standingsScored: 'PF',
    standingsAgainst: 'PA',
    standingsDiff: '+/-',
    standingsPoints: 'Pts',
    legendPlayed: 'P = Played',
    legendWon: 'W = Won',
    legendLost: 'L = Lost',
    legendScored: 'PF = Points for',
    legendAgainst: 'PA = Points against',
    legendPoints: 'Pts = Points (win 2, loss 1)',
    standingsEmpty: 'Groups have not been drawn yet.',
    standingsEmptyHint: 'The admin assigns teams to groups from the panel.',

    aboutTitle: '11th Edition',
    aboutTagline: 'From Shkoder — for the game, for the history, for us.',
    aboutBody:
      '3x3 Albania returns to Shkoder for its 11th edition: two tournaments, dozens of teams, and live scores right here.',
    contests: 'Special contests',
    contest3pt: '3-point shootout',
    contestDunk: 'Dunk contest',
    contestPrize: 'Winner',
    rulesTitle: 'Rules of the game',
    rule1: '10 minutes or first to 21 points — whichever comes first.',
    rule2: 'Shots inside the arc 1 point, outside the arc 2 points.',
    rule3: 'Shot clock: 12 seconds.',
    rule4: 'Team fouls 7, 8, 9 — 2 free throws. From 10 — 2 free throws + possession.',
    rule5: 'One timeout per team. In overtime the first team to 2 points wins.',
    organisers: 'Organisers and partners',
    followUs: 'Follow 3x3 Albania',

    admin: 'Admin',
    adminPanel: 'Admin panel',
    signIn: 'Sign in',
    signOut: 'Sign out',
    email: 'Email',
    password: 'Password',
    signingIn: 'Signing in…',
    signInHint: 'Organisers only.',
    adminMatches: 'Matches',
    adminSetup: 'Groups & schedule',
    newMatch: 'New match',
    editMatch: 'Edit match',
    deleteMatch: 'Delete match',
    openConsole: 'Open console',
    console: 'Match console',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    undo: 'Undo',
    finish: 'Finish',
    startOvertime: 'Start overtime',
    resetMatch: 'Reset match to 0-0',
    setClock: 'Set clock',
    resetShotClock: 'Reset 12s',
    addPoint: 'pt',
    foul: 'Foul',
    timeout: 'Timeout',
    selectScorer: 'Who scored?',
    selectFouler: 'Who fouled?',
    skipPlayer: 'No player',
    createGroup: 'Add group',
    groupName: 'Group name',
    assignTeams: 'Assign teams',
    generateFixtures: 'Generate group matches',
    generateBracket: 'Generate knockout',
    bracketSize: 'Number of teams',
    fixturesCreated: 'matches created',
    confirmDelete: 'Are you sure?',
    savedOk: 'Saved',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    stage: 'Stage',
    dateTime: 'Date and time',
    duration: 'Duration (min)',
    targetScore: 'Target score',
    noAccess: 'No access',

    notConfigured: 'Database is not configured',
    notConfiguredHint:
      'Copy .env.example to .env, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.',
    loadError: 'Loading failed',
  },
}

const STORAGE_KEY = '3x3-lang'
const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return saved === 'en' || saved === 'sq' ? saved : 'sq'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key) => STRINGS[lang][key] ?? STRINGS.sq[key] ?? key, [lang])

  const value = useMemo(
    () => ({
      lang,
      t,
      setLang,
      toggle: () => setLang((l) => (l === 'sq' ? 'en' : 'sq')),
      /** Pick the right column off a row that carries name_sq / name_en. */
      pick: (row, field) => row?.[`${field}_${lang}`] ?? row?.[`${field}_sq`] ?? '',
    }),
    [lang, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

/** Translate a match stage into the current language. */
export function stageLabel(t, stage) {
  return {
    group: t('stageGroup'),
    qf: t('stageQf'),
    sf: t('stageSf'),
    third: t('stageThird'),
    final: t('stageFinal'),
  }[stage] ?? stage
}
