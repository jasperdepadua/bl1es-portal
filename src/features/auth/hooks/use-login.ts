import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signIn } from '../api/sign-in'
import type { LoginRole } from '../api/resolve-login-email'

interface LoginVariables {
  identifier: string
  password: string
  role: LoginRole
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ identifier, password, role }: LoginVariables) => signIn(identifier, password, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
    },
  })
}
