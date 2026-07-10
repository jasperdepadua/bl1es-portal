const STUDENT_NUMBER = /^bl1es-\d{4}-\d{4}$/i

export function resolveLoginEmail(identifier: string): string {
  const id = identifier.trim().toLowerCase()
  return STUDENT_NUMBER.test(id)
    ? `${id}@students.bl1es.portal`
    : `${id}@staff.bl1es.portal`
}
