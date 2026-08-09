import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { updateTeacher } from './update-teacher'

describe('updateTeacher', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('updates only name and contact-email fields on profiles — never username/role', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'profiles') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await updateTeacher({
      id: 't-1',
      firstName: 'Ana',
      lastName: 'Reyes',
      contactEmail: 'ana@school.test',
    })

    expect(builder.update).toHaveBeenCalledWith({
      first_name: 'Ana',
      last_name: 'Reyes',
      contact_email: 'ana@school.test',
    })
    expect(builder.eq).toHaveBeenCalledWith('id', 't-1')
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('throws when the update fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(
      updateTeacher({ id: 't-1', firstName: 'Ana', lastName: 'Reyes', contactEmail: 'ana@x.com' }),
    ).rejects.toThrow('boom')
  })
})
