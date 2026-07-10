import { describe, expect, it } from 'vitest'
import { resolveLoginEmail } from './resolve-login-email'

describe('resolveLoginEmail', () => {
  it('maps a student number to the students domain', () => {
    expect(resolveLoginEmail('bl1es-2026-0142')).toBe('bl1es-2026-0142@students.bl1es.portal')
  })

  it('normalizes case and surrounding whitespace', () => {
    expect(resolveLoginEmail('  BL1ES-2026-0142  ')).toBe('bl1es-2026-0142@students.bl1es.portal')
  })

  it('maps a username to the staff domain', () => {
    expect(resolveLoginEmail('principal')).toBe('principal@staff.bl1es.portal')
  })

  it('treats anything not matching the student-number format as a staff username', () => {
    expect(resolveLoginEmail('maria.reyes')).toBe('maria.reyes@staff.bl1es.portal')
  })
})
