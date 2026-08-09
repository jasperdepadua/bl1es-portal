import { FunctionsHttpError } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { functions: { invoke: invokeMock } } }))

import { registerStudent, registerTeacher } from './register-user'

// supabase.functions.invoke() never returns a plain Error on a non-2xx response — it throws
// FunctionsHttpError, whose .context is the raw Response carrying the function's real
// { error: '...' } body. Mock that shape so these tests actually exercise the parsing path.
function httpError(body: unknown): FunctionsHttpError {
  return new FunctionsHttpError({
    json: () => Promise.resolve(body),
  } as unknown as Response)
}

describe('registerTeacher', () => {
  beforeEach(() => {
    invokeMock.mockReset()
  })

  it('invokes the register-user function with kind "teacher" and the input fields', async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null })

    const input = {
      firstName: 'Jane',
      lastName: 'Doe',
      username: 'jdoe',
      contactEmail: 'jane.doe@example.com',
    }

    await registerTeacher(input)

    expect(invokeMock).toHaveBeenCalledWith('register-user', {
      body: { kind: 'teacher', ...input },
    })
  })

  it('resolves without throwing when the function reports success', async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null })

    await expect(
      registerTeacher({
        firstName: 'Jane',
        lastName: 'Doe',
        username: 'jdoe',
        contactEmail: 'jane.doe@example.com',
      }),
    ).resolves.toBeUndefined()
  })

  it('surfaces the Edge Function\'s specific error message on a non-2xx response', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: httpError({ error: 'That username/student number is already registered.' }),
    })

    await expect(
      registerTeacher({
        firstName: 'Jane',
        lastName: 'Doe',
        username: 'jdoe',
        contactEmail: 'jane.doe@example.com',
      }),
    ).rejects.toThrow('That username/student number is already registered.')
  })

  it('falls back to the generic FunctionsHttpError message when the body has no error field', async () => {
    invokeMock.mockResolvedValue({ data: null, error: httpError({}) })

    await expect(
      registerTeacher({
        firstName: 'Jane',
        lastName: 'Doe',
        username: 'jdoe',
        contactEmail: 'jane.doe@example.com',
      }),
    ).rejects.toThrow('Edge Function returned a non-2xx status code')
  })

  it('throws when the function reports failure without a transport error', async () => {
    invokeMock.mockResolvedValue({ data: { ok: false }, error: null })

    await expect(
      registerTeacher({
        firstName: 'Jane',
        lastName: 'Doe',
        username: 'jdoe',
        contactEmail: 'jane.doe@example.com',
      }),
    ).rejects.toThrow('Registration failed')
  })
})

describe('registerStudent', () => {
  beforeEach(() => {
    invokeMock.mockReset()
  })

  it('invokes the register-user function with kind "student" and the input fields', async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null })

    const input = {
      firstName: 'John',
      lastName: 'Smith',
      guardianName: 'Mary Smith',
      guardianRelationship: 'Mother',
      guardianContactNumber: '09171234567',
      guardianEmail: 'mary.smith@example.com',
      is4psBeneficiary: false,
    }

    await registerStudent(input)

    expect(invokeMock).toHaveBeenCalledWith('register-user', {
      body: { kind: 'student', ...input },
    })
  })

  it('resolves without throwing when the function reports success', async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null })

    await expect(
      registerStudent({
        firstName: 'John',
        lastName: 'Smith',
        guardianEmail: 'mary.smith@example.com',
        is4psBeneficiary: false,
      }),
    ).resolves.toBeUndefined()
  })

  it('surfaces the Edge Function\'s specific error message on a non-2xx response', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: httpError({ error: 'That username/student number is already registered.' }),
    })

    await expect(
      registerStudent({
        firstName: 'John',
        lastName: 'Smith',
        guardianEmail: 'mary.smith@example.com',
        is4psBeneficiary: false,
      }),
    ).rejects.toThrow('That username/student number is already registered.')
  })

  it('throws when the function reports failure without a transport error', async () => {
    invokeMock.mockResolvedValue({ data: { ok: false }, error: null })

    await expect(
      registerStudent({
        firstName: 'John',
        lastName: 'Smith',
        guardianEmail: 'mary.smith@example.com',
        is4psBeneficiary: false,
      }),
    ).rejects.toThrow('Registration failed')
  })
})
