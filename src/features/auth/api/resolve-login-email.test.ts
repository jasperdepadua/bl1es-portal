import { describe, expect, it } from 'vitest'
import { resolveLoginEmail } from './resolve-login-email'

describe('resolveLoginEmail', () => {
  it('maps a student identifier to the students domain', () => {
    expect(resolveLoginEmail('bl1es-2026-0142', 'student')).toBe(
      'bl1es-2026-0142@students.bl1es.portal',
    )
  })

  it('normalizes case and surrounding whitespace', () => {
    expect(resolveLoginEmail('  BL1ES-2026-0142  ', 'student')).toBe(
      'bl1es-2026-0142@students.bl1es.portal',
    )
  })

  it('maps a teacher/staff identifier to the staff domain', () => {
    expect(resolveLoginEmail('principal', 'teacher')).toBe('principal@staff.bl1es.portal')
  })

  it('uses the selected role, not the identifier shape, to pick the domain', () => {
    expect(resolveLoginEmail('bl1es-2026-0142', 'teacher')).toBe(
      'bl1es-2026-0142@staff.bl1es.portal',
    )
  })
})
