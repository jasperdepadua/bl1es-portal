export type LoginRole = 'student' | 'teacher'

export function resolveLoginEmail(identifier: string, role: LoginRole): string {
  const id = identifier.trim().toLowerCase()
  return role === 'student' ? `${id}@students.bl1es.portal` : `${id}@staff.bl1es.portal`
}
