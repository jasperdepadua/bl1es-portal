import { MailCheck } from 'lucide-react'
import { DialogShell } from './dialog-shell'

/**
 * Shared confirmation shown after a successful teacher/student registration — every other
 * Management create-dialog just closes on success, but registration sends a real invite email
 * and never shows a credential, so it gets an explicit confirmation instead. Composes
 * `DialogShell` directly (not `FormDialog`) since there's no form here, just a single "Done"
 * button — no Cancel.
 */
export function RegistrationSuccessDialog({
  recipientEmail,
  onDone,
}: {
  recipientEmail: string
  onDone: () => void
}) {
  return (
    <DialogShell title="Invite Sent" onClose={onDone}>
      <div className="flex flex-col items-center gap-4 p-5 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <p className="text-sm font-medium text-muted-foreground">
          An invite with setup instructions was sent to{' '}
          <span className="font-bold text-foreground">{recipientEmail}</span>. They&apos;ll use
          it to finish setting up their account.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Done
        </button>
      </div>
    </DialogShell>
  )
}
