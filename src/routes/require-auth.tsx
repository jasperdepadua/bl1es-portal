import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
