import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell, { DivisionFilter } from './components/AppShell'
import { DataProvider, useData } from './hooks/DataProvider'
import { isConfigured } from './lib/supabase'
import { NotConfigured } from './components/ui'

import Matches from './pages/Matches'
import Live from './pages/Live'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import Standings from './pages/Standings'
import MatchDetail from './pages/MatchDetail'
import InfoPage from './pages/InfoPage'

import AdminLogin from './admin/AdminLogin'
import AdminHome from './admin/AdminHome'
import AdminSetup from './admin/AdminSetup'
import AdminMatchEdit from './admin/AdminMatchEdit'
import Console from './admin/Console'
import RequireAuth from './admin/RequireAuth'

function Shell() {
  const { matches, divisions } = useData()
  const liveCount = matches.filter((m) => m.status === 'live').length

  return (
    <AppShell liveCount={liveCount} filter={<DivisionFilter divisions={divisions} />}>
      <Routes>
        <Route path="/" element={<Matches />} />
        <Route path="/live" element={<Live />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/team/:teamId" element={<TeamDetail />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/match/:matchId" element={<MatchDetail />} />
        <Route path="/info" element={<InfoPage />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminHome />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/setup"
          element={
            <RequireAuth>
              <AdminSetup />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/match/:matchId"
          element={
            <RequireAuth>
              <AdminMatchEdit />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/console/:matchId"
          element={
            <RequireAuth>
              <Console />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  if (!isConfigured) {
    return (
      <AppShell>
        <NotConfigured />
      </AppShell>
    )
  }

  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}
