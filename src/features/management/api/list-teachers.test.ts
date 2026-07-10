import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { listTeachers } from './list-teachers'

describe('listTeachers', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('only queries active teacher accounts (role = admin, is_active = true), ordered by first name', async () => {
    const builder = createQueryBuilder({
      data: [{ id: 't-1', first_name: 'Ana', last_name: 'Reyes', contact_email: 'ana@school.test' }],
      error: null,
    })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'profiles') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    const result = await listTeachers()

    expect(builder.eq).toHaveBeenCalledWith('role', 'admin')
    expect(builder.eq).toHaveBeenCalledWith('is_active', true)
    expect(builder.order).toHaveBeenCalledWith('first_name')
    expect(result).toEqual([{ id: 't-1', name: 'Ana Reyes', contactEmail: 'ana@school.test' }])
  })

  it('throws when the query errors', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ data: null, error: new Error('boom') }))
    await expect(listTeachers()).rejects.toThrow('boom')
  })
})
