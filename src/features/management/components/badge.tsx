import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'muted' | 'secondary' | 'primary' | 'success' | 'destructive'

const tones: Record<BadgeTone, string> = {
  muted: 'bg-muted text-muted-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-[color:var(--chart-4)]/15 text-success-foreground',
  destructive: 'bg-destructive/10 text-destructive',
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
