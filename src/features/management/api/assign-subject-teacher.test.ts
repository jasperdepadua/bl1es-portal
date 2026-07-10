import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { assignSubjectTeacher } from './assign-subject-teacher'

describe('assignSubjectTeacher', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('deactivates any existing active assignment for the (section, subject) pair before inserting the new one, in that order', async () => {
    const deactivateBuilder = createQueryBuilder({ error: null })
    const insertBuilder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'subject_assignments') throw new Error(`Unexpected table: ${table}`)
      // First `from` call is the deactivate step, the second is the insert step — asserted
      // below by checking which method was actually invoked on each returned builder.
      return fromMock.mock.calls.length === 1 ? deactivateBuilder : insertBuilder
    })

    await assignSubjectTeacher({ sectionId: 'section-1', subjectId: 'subj-1', teacherId: 'teacher-2' })

    expect(fromMock).toHaveBeenCalledTimes(2)

    // Step 1 (first `from` call) must be the deactivation of whichever assignment is
    // currently active for this section+subject — not scoped to a particular teacher.
    expect(deactivateBuilder.update).toHaveBeenCalledWith({ is_active: false })
    expect(deactivateBuilder.eq).toHaveBeenCalledWith('section_id', 'section-1')
    expect(deactivateBuilder.eq).toHaveBeenCalledWith('subject_id', 'subj-1')
    expect(deactivateBuilder.eq).toHaveBeenCalledWith('is_active', true)
    expect(deactivateBuilder.eq).not.toHaveBeenCalledWith('teacher_id', expect.anything())
    expect(deactivateBuilder.insert).not.toHaveBeenCalled()

    // Step 2 (second `from` call) must be the insert of the new assignment.
    expect(insertBuilder.insert).toHaveBeenCalledWith({
      section_id: 'section-1',
      subject_id: 'subj-1',
      teacher_id: 'teacher-2',
    })
    expect(insertBuilder.update).not.toHaveBeenCalled()
  })

  it('does not attempt the insert when deactivating the existing assignment fails', async () => {
    const deactivateBuilder = createQueryBuilder({ error: new Error('deactivate failed') })
    fromMock.mockImplementation(() => deactivateBuilder)

    await expect(
      assignSubjectTeacher({ sectionId: 'section-1', subjectId: 'subj-1', teacherId: 'teacher-2' }),
    ).rejects.toThrow('deactivate failed')

    // Only the deactivate step's `from` call should have happened — the insert never fires.
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('throws when the insert fails after a successful deactivation', async () => {
    const deactivateBuilder = createQueryBuilder({ error: null })
    const insertBuilder = createQueryBuilder({ error: new Error('insert failed') })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'subject_assignments') throw new Error(`Unexpected table: ${table}`)
      return fromMock.mock.calls.length === 1 ? deactivateBuilder : insertBuilder
    })

    await expect(
      assignSubjectTeacher({ sectionId: 'section-1', subjectId: 'subj-1', teacherId: 'teacher-2' }),
    ).rejects.toThrow('insert failed')
  })
})
