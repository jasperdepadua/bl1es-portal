import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Initials } from './initials'
import { DialogShell } from './dialog-shell'

/**
 * Generic single-select picker (search + list) — e.g. picking an enrollable student, or a
 * teacher for an adviser/subject-teacher assignment. Built on the same `DialogShell` chrome
 * as `FormDialog`, so a future tweak to the shared header/backdrop/panel propagates to both.
 */
export function PickerDialog<T extends { id: string; name: string }>({
  title,
  description,
  onClose,
  isLoading,
  options,
  emptyMessage,
  renderSubtitle,
  onSelect,
  isSelecting,
  errorMessage,
}: {
  title: string
  description: string
  onClose: () => void
  isLoading: boolean
  options: T[]
  emptyMessage: string
  renderSubtitle?: (option: T) => string | null
  onSelect: (option: T) => void
  isSelecting: boolean
  errorMessage?: string
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query],
  )

  return (
    <DialogShell title={title} description={description} onClose={onClose}>
      <div className="border-b border-border p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="h-11 w-full rounded-2xl border border-border bg-background pl-9 pr-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/30"
            aria-label="Search by name"
          />
        </div>
        {errorMessage && (
          <p className="mt-3 text-sm font-semibold text-destructive-foreground">{errorMessage}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <p className="px-3 py-8 text-center text-sm font-medium text-muted-foreground">
            Loading…
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm font-medium text-muted-foreground">
            {options.length === 0 ? emptyMessage : 'No matches found.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {filtered.map((option) => {
              const subtitle = renderSubtitle?.(option)
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    disabled={isSelecting}
                    onClick={() => onSelect(option)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Initials name={option.name} className="size-9 shrink-0 text-xs" />
                    <div className="min-w-0 leading-tight">
                      <p className="truncate text-sm font-bold text-foreground">{option.name}</p>
                      {subtitle && (
                        <p className="truncate text-xs font-semibold text-muted-foreground">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </DialogShell>
  )
}
