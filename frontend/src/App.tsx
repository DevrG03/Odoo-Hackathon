import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PageSpinner } from './components/ui/Spinner'

const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const CarbonTransactionsPage = lazy(() => import('./pages/environmental/CarbonTransactionsPage').then(m => ({ default: m.CarbonTransactionsPage })))
const EmissionFactorsPage = lazy(() => import('./pages/environmental/EmissionFactorsPage').then(m => ({ default: m.EmissionFactorsPage })))
const GoalsPage = lazy(() => import('./pages/environmental/GoalsPage').then(m => ({ default: m.GoalsPage })))
const CSRActivitiesPage = lazy(() => import('./pages/social/CSRActivitiesPage').then(m => ({ default: m.CSRActivitiesPage })))
const ParticipationsPage = lazy(() => import('./pages/social/ParticipationsPage').then(m => ({ default: m.ParticipationsPage })))
const ChallengesPage = lazy(() => import('./pages/gamification/ChallengesPage').then(m => ({ default: m.ChallengesPage })))
const BadgesPage = lazy(() => import('./pages/gamification/BadgesPage').then(m => ({ default: m.BadgesPage })))
const RewardsPage = lazy(() => import('./pages/gamification/RewardsPage').then(m => ({ default: m.RewardsPage })))
const LeaderboardPage = lazy(() => import('./pages/gamification/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))
const PoliciesPage = lazy(() => import('./pages/governance/PoliciesPage').then(m => ({ default: m.PoliciesPage })))
const AuditsPage = lazy(() => import('./pages/governance/AuditsPage').then(m => ({ default: m.AuditsPage })))
const ComplianceIssuesPage = lazy(() => import('./pages/governance/ComplianceIssuesPage').then(m => ({ default: m.ComplianceIssuesPage })))
const ESGSummaryPage = lazy(() => import('./pages/reports/ESGSummaryPage').then(m => ({ default: m.ESGSummaryPage })))
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/environmental/transactions" element={<ProtectedRoute><CarbonTransactionsPage /></ProtectedRoute>} />
              <Route path="/environmental/factors" element={<ProtectedRoute><EmissionFactorsPage /></ProtectedRoute>} />
              <Route path="/environmental/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
              <Route path="/social/activities" element={<ProtectedRoute><CSRActivitiesPage /></ProtectedRoute>} />
              <Route path="/social/participations" element={<ProtectedRoute><ParticipationsPage /></ProtectedRoute>} />
              <Route path="/gamification/challenges" element={<ProtectedRoute><ChallengesPage /></ProtectedRoute>} />
              <Route path="/gamification/badges" element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
              <Route path="/gamification/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
              <Route path="/gamification/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
              <Route path="/governance/policies" element={<ProtectedRoute><PoliciesPage /></ProtectedRoute>} />
              <Route path="/governance/audits" element={<ProtectedRoute><AuditsPage /></ProtectedRoute>} />
              <Route path="/governance/compliance" element={<ProtectedRoute><ComplianceIssuesPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><ESGSummaryPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
