import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BrandLogo({
  className,
  showText = true,
  subtitle = true,
}: {
  className?: string
  showText?: boolean
  subtitle?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <GraduationCap className="size-6" />
      </span>
      {showText && (
        <div className="leading-tight">
          <p className="font-display text-lg font-extrabold tracking-tight text-foreground">
            BL1ES Portal
          </p>
          {subtitle && (
            <p className="text-xs font-semibold text-muted-foreground">
              Bayanluma 1 Elementary
            </p>
          )}
        </div>
      )}
    </div>
  )
}
