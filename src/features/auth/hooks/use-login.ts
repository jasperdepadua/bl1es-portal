import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signIn } from '../api/sign-in'

interface LoginVariables {
  identifier: string
  password: string
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ identifier, password }: LoginVariables) => signIn(identifier, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
    },
  })
}
