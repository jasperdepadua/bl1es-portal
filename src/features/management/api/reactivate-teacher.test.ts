import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { reactivateTeacher } from './reactivate-teacher'

describe('reactivateTeacher', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('sets is_active to true on profiles only', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'profiles') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await reactivateTeacher('t-1')

    expect(builder.update).toHaveBeenCalledWith({ is_active: true })
    expect(builder.eq).toHaveBeenCalledWith('id', 't-1')
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('throws when the update fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(reactivateTeacher('t-1')).rejects.toThrow('boom')
  })
})
