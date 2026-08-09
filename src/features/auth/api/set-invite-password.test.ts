import { beforeEach, describe, expect, it, vi } from 'vitest'

const { updateUser } = vi.hoisted(() => ({ updateUser: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { updateUser } } }))

import { setInvitePassword } from './set-invite-password'

describe('setInvitePassword', () => {
  beforeEach(() => {
    updateUser.mockReset()
  })

  it('updates the current session user with the new password', async () => {
    updateUser.mockResolvedValue({ error: null })

    await setInvitePassword('a-strong-password')

    expect(updateUser).toHaveBeenCalledWith({ password: 'a-strong-password' })
  })

  it('throws with the Supabase error message on failure', async () => {
    updateUser.mockResolvedValue({
      error: { message: 'Password should be at least 8 characters' },
    })

    await expect(setInvitePassword('short')).rejects.toThrow(
      'Password should be at least 8 characters',
    )
  })
})
