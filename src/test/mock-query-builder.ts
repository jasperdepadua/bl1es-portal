import { vi, type Mock } from 'vitest'

export interface QueryResult<T = unknown> {
  data?: T | null
  error?: unknown
  count?: number | null
}

export interface QueryBuilderMock {
  select: Mock
  eq: Mock
  in: Mock
  order: Mock
  insert: Mock
  update: Mock
  delete: Mock
  single: Mock
  maybeSingle: Mock
  then: (
    onFulfilled: (value: QueryResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>
}

const CHAIN_METHODS = [
  'select',
  'eq',
  'in',
  'order',
  'insert',
  'update',
  'delete',
  'single',
  'maybeSingle',
] as const

/**
 * Stand-in for a supabase-js `PostgrestFilterBuilder`: every chain method (select/eq/in/
 * order/insert/update/delete/single) returns the same builder, so an arbitrary
 * `.select().eq().eq()`-style chain works regardless of call order, and the builder is
 * itself "thenable" — `await supabase.from(...).select(...).eq(...)` resolves to `result`,
 * matching how the real query builder behaves.
 */
export function createQueryBuilder<T = unknown>(result: QueryResult<T>): QueryBuilderMock {
  const builder = {} as QueryBuilderMock
  for (const method of CHAIN_METHODS) {
    ;(builder as unknown as Record<string, Mock>)[method] = vi.fn(() => builder)
  }
  builder.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected)
  return builder
}
