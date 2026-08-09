import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { getUser, fromMock } = vi.hoisted(() => ({
  getUser: vi.fn(),
  fromMock: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getUser }, from: fromMock } }))

import { getCurrentProfile } from './get-current-profile'

describe('getCurrentProfile', () => {
  beforeEach(() => {
    getUser.mockReset()
    fromMock.mockReset()
  })

  it('returns null when there is no authenticated user', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const result = await getCurrentProfile()

    expect(result).toBeNull()
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('returns null when RLS hides the profile row (e.g. a deactivated account)', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    fromMock.mockImplementation(() => createQueryBuilder({ data: null, error: null }))

    const result = await getCurrentProfile()

    expect(result).toBeNull()
  })

  it('maps the profile row to camelCase when one is visible', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    fromMock.mockImplementation(() =>
      createQueryBuilder({
        data: {
          id: 'user-1',
          role: 'admin',
          first_name: 'Maria',
          last_name: 'Reyes',
          username: 'maria.reyes',
        },
        error: null,
      }),
    )

    const result = await getCurrentProfile()

    expect(result).toEqual({
      id: 'user-1',
      role: 'admin',
      firstName: 'Maria',
      lastName: 'Reyes',
      username: 'maria.reyes',
    })
  })

  it('throws when the query fails', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    fromMock.mockImplementation(() =>
      createQueryBuilder({ data: null, error: new Error('network error') }),
    )

    await expect(getCurrentProfile()).rejects.toThrow('network error')
  })
})
