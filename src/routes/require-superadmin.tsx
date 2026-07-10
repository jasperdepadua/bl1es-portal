import { Navigate, Outlet } from 'react-router-dom'
import { useProfile } from '@/features/auth/hooks/use-profile'

export function RequireSuperadmin() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) return null
  if (profile?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
