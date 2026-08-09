import { useQuery } from '@tanstack/react-query'
import { listTeacherAccounts } from '../api/list-teacher-accounts'

export function useTeacherAccounts() {
  return useQuery({
    queryKey: ['management', 'teachers', 'accounts'],
    queryFn: listTeacherAccounts,
  })
}
