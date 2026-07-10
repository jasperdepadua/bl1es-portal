import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Standard modal behavior for any plain-Tailwind overlay/dialog (see design-system/README.md
 * § Modal/dialog pattern — no dialog primitive installed yet): focuses the first control on open,
 * traps Tab within the container, restores focus to the trigger on close, locks background
 * scroll, and closes on Escape.
 */
export function useModalBehavior(containerRef: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const firstFocusable = containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    firstFocusable?.focus()

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !containerRef.current) return
      const focusable = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      previouslyFocused?.focus()
    }
  }, [containerRef, onClose])
}
