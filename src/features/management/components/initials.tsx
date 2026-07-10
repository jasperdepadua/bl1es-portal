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
        'flex items-center justify-center rounded-full bg-primary/10 font-extrabold text-primary',
        className,
      )}
    >
      {initials}
    </span>
  )
}
