import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScrollableTable } from './scrollable-table'

// jsdom doesn't perform real layout, so scrollWidth/clientWidth are both 0 by default — set
// them explicitly via Object.defineProperty to exercise the scroll-affordance logic.
function setScrollMetrics(el: HTMLElement, { scrollLeft = 0, scrollWidth = 0, clientWidth = 0 }) {
  Object.defineProperty(el, 'scrollLeft', { value: scrollLeft, writable: true, configurable: true })
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true })
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true })
}

describe('ScrollableTable', () => {
  it('renders its children inside a scroll container', () => {
    render(
      <ScrollableTable>
        <table>
          <tbody>
            <tr>
              <td>Row content</td>
            </tr>
          </tbody>
        </table>
      </ScrollableTable>,
    )

    expect(screen.getByText('Row content')).toBeInTheDocument()
  })

  it('hides both edge overlays when the content fits within the viewport (no overflow)', () => {
    const { container } = render(
      <ScrollableTable>
        <table>
          <tbody>
            <tr>
              <td>Row</td>
            </tr>
          </tbody>
        </table>
      </ScrollableTable>,
    )

    const scrollContainer = container.querySelector('.overflow-x-auto') as HTMLElement
    setScrollMetrics(scrollContainer, { scrollLeft: 0, scrollWidth: 300, clientWidth: 300 })
    fireEvent.scroll(scrollContainer)

    const overlays = container.querySelectorAll('[aria-hidden="true"]')
    overlays.forEach((overlay) => expect(overlay).toHaveClass('opacity-0'))
  })

  it('shows the right-edge overlay while there is more content to scroll to', () => {
    const { container } = render(
      <ScrollableTable>
        <table>
          <tbody>
            <tr>
              <td>Row</td>
            </tr>
          </tbody>
        </table>
      </ScrollableTable>,
    )

    const scrollContainer = container.querySelector('.overflow-x-auto') as HTMLElement
    setScrollMetrics(scrollContainer, { scrollLeft: 0, scrollWidth: 900, clientWidth: 300 })
    fireEvent.scroll(scrollContainer)

    const [leftOverlay, rightOverlay] = container.querySelectorAll('[aria-hidden="true"]')
    expect(leftOverlay).toHaveClass('opacity-0')
    expect(rightOverlay).toHaveClass('opacity-100')
  })

  it('shows the left-edge overlay once scrolled away from the start, hides it fully scrolled left again', () => {
    const { container } = render(
      <ScrollableTable>
        <table>
          <tbody>
            <tr>
              <td>Row</td>
            </tr>
          </tbody>
        </table>
      </ScrollableTable>,
    )

    const scrollContainer = container.querySelector('.overflow-x-auto') as HTMLElement
    setScrollMetrics(scrollContainer, { scrollLeft: 200, scrollWidth: 900, clientWidth: 300 })
    fireEvent.scroll(scrollContainer)

    const [leftOverlay] = container.querySelectorAll('[aria-hidden="true"]')
    expect(leftOverlay).toHaveClass('opacity-100')
  })
})
