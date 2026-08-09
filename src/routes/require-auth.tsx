import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useProfile } from '@/features/auth/hooks/use-profile'
import { useLogout } from '@/features/auth/hooks/use-logout'

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const profileQuery = useProfile()
  const logout = useLogout()
  const [deactivated, setDeactivated] = useState(false)

  // An authenticated session whose profile query has settled to `null` means RLS is
  // hiding the row — in practice, the account was deactivated.
  const profileMissing = isAuthenticated && !profileQuery.isLoading && profileQuery.data === null

  useEffect(() => {
    if (profileMissing && !deactivated) {
      setDeactivated(true)
      logout.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileMissing, deactivated])

  if (isLoading) return null

  if (deactivated) {
    // Wait for sign-out to actually clear the session before navigating away — otherwise
    // App.tsx's `isAuthenticated` ternary at "/login" would bounce straight back to
    // "/dashboard" while the sign-out request is still in flight. If sign-out itself fails
    // (e.g. a network error), don't wait forever on a session that may never clear — navigate
    // away anyway rather than stranding the user on a blank screen.
    if (isAuthenticated && !logout.isError) return null
    return <Navigate to="/login" replace state={{ deactivated: true }} />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (profileQuery.isLoading) return null

  return <Outlet />
}
