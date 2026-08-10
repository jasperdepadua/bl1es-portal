import { AlertCircle } from 'lucide-react'

/**
 * Inline banner for surfacing a failed mutation that has no dialog to show an error in — e.g.
 * one-click reactivate/reorder actions, which are deliberately confirm-free (see the Deactivate/
 * Activate icon-pair convention in design-system/README.md). Also used for the Login and
 * Accept-Invite error banners. Not a toast/notification system — just this one banner shape,
 * rendered inline near the action that failed.
 */
export function InlineMutationError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-foreground"
    >
      <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden />
      {message}
    </div>
  )
}
