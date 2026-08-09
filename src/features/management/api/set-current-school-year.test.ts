import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: rpcMock } }))

import { setCurrentSchoolYear } from './set-current-school-year'

describe('setCurrentSchoolYear', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('calls the set_current_school_year RPC with exactly the year id, never a plain update', async () => {
    rpcMock.mockResolvedValue({ error: null })

    await setCurrentSchoolYear('sy-1')

    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(rpcMock).toHaveBeenCalledWith('set_current_school_year', { p_year_id: 'sy-1' })
  })

  it('throws when the RPC call errors', async () => {
    rpcMock.mockResolvedValue({ error: new Error('boom') })

    await expect(setCurrentSchoolYear('sy-1')).rejects.toThrow('boom')
  })
})
