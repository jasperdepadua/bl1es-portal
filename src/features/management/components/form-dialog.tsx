import { forwardRef, type FormEvent, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DialogShell } from './dialog-shell'

/** Shared text/number/date input styling for every create/edit form in Management — use this
 * instead of re-declaring the same class string per page, so field styling can't drift. */
export const FORM_INPUT_CLASSNAME =
  'h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-3 focus:ring-ring/30'

/** Shared field-validation-error text styling, matching this dialog's own error slot below. */
export const FORM_FIELD_ERROR_CLASSNAME = 'text-sm font-semibold text-destructive-foreground'

/**
 * A `<select>` styled to match `FORM_INPUT_CLASSNAME`, with the native dropdown arrow replaced
 * by a lucide `ChevronDown` — the native arrow (`appearance: auto`) doesn't match this app's
 * icon language (size, stroke-width, color) and sits inconsistently across browsers. Forwards
 * its ref so it can be used directly with react-hook-form's `register()` spread.
 *
 * Dims the text to `text-muted-foreground` while the empty placeholder option is selected —
 * matching how every text input's `placeholder:text-muted-foreground` behaves — via a `:has()`
 * selector on the still-selected placeholder `<option value="">`, so an unfilled select doesn't
 * read as if it already has a real value chosen.
 */
export const FormSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function FormSelect({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            FORM_INPUT_CLASSNAME,
            'appearance-none pr-10',
            '[&:has(option[value=""]:checked)]:text-muted-foreground',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    )
  },
)

export function FormDialog({
  title,
  description,
  isSaving = false,
  error,
  onSubmit,
  onClose,
  saveLabel = 'Save',
  children,
}: {
  title: string
  description?: string
  isSaving?: boolean
  error?: string | null
  onSubmit: (e: FormEvent) => void
  onClose: () => void
  saveLabel?: string
  children: ReactNode
}) {
  return (
    <DialogShell title={title} description={description} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {error && <p className={cn('px-5 pb-3 pt-1', FORM_FIELD_ERROR_CLASSNAME)}>{error}</p>}

        <div className="flex flex-col-reverse gap-3 border-t border-border p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="cursor-pointer rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="cursor-pointer rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : saveLabel}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
