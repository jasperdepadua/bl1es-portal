import { useQuery } from '@tanstack/react-query'
import { getCurrentProfile } from '../api/get-current-profile'
import { useAuth } from './use-auth'

export function useProfile() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: getCurrentProfile,
    enabled: isAuthenticated,
  })
}
