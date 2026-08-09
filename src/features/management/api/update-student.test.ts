import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { updateStudent } from './update-student'

describe('updateStudent', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('updates the profile name fields, then the student_details guardian fields + 4Ps flag', async () => {
    const profilesBuilder = createQueryBuilder({ error: null })
    const detailsBuilder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return profilesBuilder
      if (table === 'student_details') return detailsBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    await updateStudent({
      id: 's-1',
      firstName: 'Amy',
      lastName: 'Santos',
      guardianName: 'Grace Santos',
      guardianRelationship: 'Mother',
      guardianContactNumber: '0917',
      guardianEmail: 'grace@example.com',
      is4psBeneficiary: true,
    })

    expect(profilesBuilder.update).toHaveBeenCalledWith({ first_name: 'Amy', last_name: 'Santos' })
    expect(profilesBuilder.eq).toHaveBeenCalledWith('id', 's-1')

    expect(detailsBuilder.update).toHaveBeenCalledWith({
      guardian_name: 'Grace Santos',
      guardian_relationship: 'Mother',
      guardian_contact_number: '0917',
      guardian_email: 'grace@example.com',
      is_4ps_beneficiary: true,
    })
    expect(detailsBuilder.eq).toHaveBeenCalledWith('profile_id', 's-1')
  })

  it('nulls out unset optional guardian fields rather than leaving them undefined', async () => {
    const profilesBuilder = createQueryBuilder({ error: null })
    const detailsBuilder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return profilesBuilder
      if (table === 'student_details') return detailsBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    await updateStudent({
      id: 's-1',
      firstName: 'Amy',
      lastName: 'Santos',
      guardianEmail: 'grace@example.com',
      is4psBeneficiary: false,
    })

    expect(detailsBuilder.update).toHaveBeenCalledWith({
      guardian_name: null,
      guardian_relationship: null,
      guardian_contact_number: null,
      guardian_email: 'grace@example.com',
      is_4ps_beneficiary: false,
    })
  })

  it('throws when the profile update fails, without touching student_details', async () => {
    const profilesBuilder = createQueryBuilder({ error: new Error('boom') })
    const detailsBuilder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return profilesBuilder
      if (table === 'student_details') return detailsBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(
      updateStudent({
        id: 's-1',
        firstName: 'Amy',
        lastName: 'Santos',
        guardianEmail: 'grace@example.com',
        is4psBeneficiary: false,
      }),
    ).rejects.toThrow('boom')

    expect(detailsBuilder.update).not.toHaveBeenCalled()
  })

  it('throws when the student_details update fails', async () => {
    const profilesBuilder = createQueryBuilder({ error: null })
    const detailsBuilder = createQueryBuilder({ error: new Error('duplicate') })
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return profilesBuilder
      if (table === 'student_details') return detailsBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(
      updateStudent({
        id: 's-1',
        firstName: 'Amy',
        lastName: 'Santos',
        guardianEmail: 'grace@example.com',
        is4psBeneficiary: false,
      }),
    ).rejects.toThrow('duplicate')
  })
})
