import { useRef } from 'react'
import { useModalBehavior } from '@/hooks/use-modal-behavior'
import { cn } from '@/lib/utils'

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = 'destructive',
  isPending,
  errorMessage,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  confirmLabel: string
  /** 'destructive' (default) for irreversible/risky actions (deactivate, unenroll). 'primary' for
   * confirmations that are just an important state change, not a danger (e.g. "set as current"). */
  tone?: 'destructive' | 'primary'
  isPending: boolean
  errorMessage?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  useModalBehavior(containerRef, onCancel)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onCancel} aria-hidden />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl"
      >
        <h3 className="font-display text-lg font-extrabold text-foreground">{title}</h3>
        <p className="mt-2 text-sm font-medium text-muted-foreground">{description}</p>
        {errorMessage && (
          <p className="mt-3 text-sm font-semibold text-destructive">{errorMessage}</p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              'cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-extrabold transition-colors disabled:pointer-events-none disabled:opacity-50',
              tone === 'destructive'
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                : 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
            )}
          >
            {isPending ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
