import { useQuery } from '@tanstack/react-query'
import { listStudentAccounts } from '../api/list-student-accounts'

export function useStudentAccounts() {
  return useQuery({
    queryKey: ['management', 'students', 'accounts'],
    queryFn: listStudentAccounts,
  })
}
