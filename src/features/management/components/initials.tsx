import { cn } from '@/lib/utils'

export function Initials({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
  return (
    <span
      className={cn(
        // text-primary-foreground-tint, not text-primary: see globals.css — plain text-primary
        // on bg-primary/10 is only 4.08:1, short of AA at the small sizes this renders at.
        'flex items-center justify-center rounded-full bg-primary/10 font-extrabold text-primary-foreground-tint',
        className,
      )}
    >
      {initials}
    </span>
  )
}
