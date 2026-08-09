import { useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useModalBehavior } from '@/hooks/use-modal-behavior'
import { cn } from '@/lib/utils'

/**
 * Shared backdrop/panel/header chrome for every Management dialog — `FormDialog` and
 * `PickerDialog` both compose this instead of each re-declaring the same
 * backdrop/panel/header/close-button markup, so a future tweak to one propagates to both.
 * Only the body (search+list, or form+footer) differs between the two; that's `children`.
 */
export function DialogShell({
  title,
  description,
  onClose,
  maxWidthClassName = 'max-w-md',
  children,
}: {
  title: string
  description?: string
  onClose: () => void
  maxWidthClassName?: string
  children: ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  useModalBehavior(containerRef, onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} aria-hidden />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[80vh] w-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl',
          maxWidthClassName,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h3 className="font-display text-lg font-extrabold text-foreground">{title}</h3>
            {description && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
