import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signOut } from '../api/sign-out'

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      // Drop all cached data on logout so no PII lingers for the next user (shared devices).
      queryClient.clear()
    },
  })
}
