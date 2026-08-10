import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Wraps a wide `<table>` in a horizontally scrollable container and shows a subtle edge-fade
 * affordance whenever there's more content to scroll to. Management list tables routinely exceed
 * the mobile viewport width — without this, the table just looks cut off (Status/Actions columns
 * unreachable-looking) with no hint that scrolling reveals more.
 *
 * Usage: replace a page's `<div className="overflow-x-auto"><table>...</table></div>` with
 * `<ScrollableTable><table>...</table></ScrollableTable>` — the outer rounded-card wrapper each
 * page already has stays as-is around this component.
 */
export function ScrollableTable({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function updateEdges() {
      if (!el) return
      setCanScrollLeft(el.scrollLeft > 0)
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
    }

    updateEdges()
    el.addEventListener('scroll', updateEdges)
    window.addEventListener('resize', updateEdges)

    // The table's width can change after mount (e.g. rows arriving asynchronously) without a
    // `scroll` or `resize` event firing — a ResizeObserver on the scroll container catches that
    // too. Not present in jsdom, so guard for environments (tests) where it's undefined.
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateEdges) : null
    resizeObserver?.observe(el)

    return () => {
      el.removeEventListener('scroll', updateEdges)
      window.removeEventListener('resize', updateEdges)
      resizeObserver?.disconnect()
    }
  }, [])

  return (
    <div className="relative">
      <div ref={scrollRef} className="overflow-x-auto">
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent transition-opacity',
          canScrollLeft ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent transition-opacity',
          canScrollRight ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}
