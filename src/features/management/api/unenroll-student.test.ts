import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { unenrollStudent } from './unenroll-student'

describe('unenrollStudent', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('deletes the enrollment row by id', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'enrollments') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await unenrollStudent('enr-1')

    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', 'enr-1')
  })

  it('throws when the delete fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(unenrollStudent('enr-1')).rejects.toThrow('boom')
  })
})
