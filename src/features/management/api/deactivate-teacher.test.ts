import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { deactivateTeacher } from './deactivate-teacher'

describe('deactivateTeacher', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('sets is_active to false on profiles only — never touches sections/subject_assignments', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'profiles') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await deactivateTeacher('t-1')

    expect(builder.update).toHaveBeenCalledWith({ is_active: false })
    expect(builder.eq).toHaveBeenCalledWith('id', 't-1')
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledWith('profiles')
  })

  it('throws when the update fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(deactivateTeacher('t-1')).rejects.toThrow('boom')
  })
})
