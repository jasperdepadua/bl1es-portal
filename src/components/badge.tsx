import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'muted' | 'secondary' | 'primary' | 'success' | 'destructive'

const tones: Record<BadgeTone, string> = {
  // `muted`/`primary` use dedicated *-badge-foreground/-foreground-tint tokens, not the base
  // text-muted-foreground/text-primary — those fall short of WCAG AA (3.18:1 / 4.08:1) at this
  // badge's small (12px) text size against this specific tint background. See globals.css.
  muted: 'bg-muted text-muted-badge-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary/10 text-primary-foreground-tint',
  success: 'bg-[color:var(--chart-4)]/15 text-success-foreground',
  destructive: 'bg-destructive/10 text-destructive-foreground',
}

export function Badge({
  children,
  tone = 'muted',
}: {
  children: ReactNode
  tone?: BadgeTone
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
