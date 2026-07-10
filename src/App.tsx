import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/features/auth/pages/LoginPage'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import SettingsPage from '@/features/settings/pages/SettingsPage'
import SectionsListPage from '@/features/management/pages/SectionsListPage'
import SectionDetailPage from '@/features/management/pages/SectionDetailPage'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { RequireAuth } from '@/routes/require-auth'
import { RequireSuperadmin } from '@/routes/require-superadmin'

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  // Wait for session resolution before any routing decision, so a persisted
  // session isn't briefly treated as signed-out on a hard refresh of "/".
  if (isLoading) return null

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route element={<RequireSuperadmin />}>
          <Route path="/management/sections" element={<SectionsListPage />} />
          <Route path="/management/sections/:sectionId" element={<SectionDetailPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
