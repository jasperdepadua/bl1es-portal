import { useMutation } from '@tanstack/react-query'
import { setInvitePassword } from '../api/set-invite-password'

export function useSetInvitePassword() {
  return useMutation({
    mutationFn: setInvitePassword,
  })
}
