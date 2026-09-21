import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'
import { VehicleStickyBar } from '@/components/catalog/VehicleStickyBar'

// One observer per watched element: the main button and the footer.
const watchers: { element: Element; report: (isIntersecting: boolean) => void }[] = []
const observe = vi.fn()
const disconnect = vi.fn()
let target: HTMLElement
let footer: HTMLElement
const report = (isIntersecting: boolean) => watchers.find((w) => w.element === target)!.report(isIntersecting)
const reportFooter = (isIntersecting: boolean) => watchers.find((w) => w.element === footer)!.report(isIntersecting)

beforeEach(() => {
  observe.mockClear()
  disconnect.mockClear()
  watchers.length = 0
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn((callback: IntersectionObserverCallback) => ({
      observe: (element: Element) => {
        observe(element)
        watchers.push({
          element,
          report: (isIntersecting) =>
            act(() => callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)),
        })
      },
      disconnect,
      unobserve: vi.fn(),
    })),
  )
  target = document.createElement('div')
  target.id = 'vehicle-cta'
  footer = document.createElement('footer')
  document.body.append(target, footer)
})

afterEach(() => {
  target.remove()
  footer.remove()
  vi.unstubAllGlobals()
})

const bar = () => screen.queryByTestId('vehicle-sticky-bar')
const props = { price: 'R$ 105.900', whatsappUrl: 'https://wa.me/5598991030107?text=oi', targetId: 'vehicle-cta' }

describe('VehicleStickyBar', () => {
  it('watches the main WhatsApp button, by its id', () => {
    render(<VehicleStickyBar {...props} />)
    expect(observe).toHaveBeenCalledWith(target)
  })

  it('stays out of the way until it knows the main button has left the screen', () => {
    render(<VehicleStickyBar {...props} />)
    expect(bar()).not.toBeInTheDocument()
  })

  it('appears with the price and a WhatsApp button when the main button leaves the screen', () => {
    render(<VehicleStickyBar {...props} />)
    report(false)
    expect(bar()).toBeInTheDocument()
    expect(screen.getByText('R$ 105.900')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /chamar no whatsapp/i })).toHaveAttribute('href', props.whatsappUrl)
  })

  it('goes away again when the main button comes back on the screen', () => {
    render(<VehicleStickyBar {...props} />)
    report(false)
    report(true)
    expect(bar()).not.toBeInTheDocument()
  })

  it('steps aside when the footer is on the screen, so it never covers the end of the page', () => {
    render(<VehicleStickyBar {...props} />)
    report(false)
    expect(bar()).toBeInTheDocument()
    reportFooter(true)
    expect(bar()).not.toBeInTheDocument()
    reportFooter(false)
    expect(bar()).toBeInTheDocument()
  })

  it('is only for phones, and keeps its button at least 44 px tall', () => {
    render(<VehicleStickyBar {...props} />)
    report(false)
    expect(bar()).toHaveClass('md:hidden', 'fixed', 'bottom-0')
    expect(screen.getByRole('link', { name: /chamar no whatsapp/i })).toHaveClass('min-h-11')
  })

  it('takes the round floating WhatsApp button off the phone while the page is open, and puts it back after', () => {
    const { unmount } = render(<VehicleStickyBar {...props} />)
    expect(document.body.dataset.stickyBar).toBe('1')
    unmount()
    expect(document.body.dataset.stickyBar).toBeUndefined()
  })

  it('stops watching when it leaves the page', () => {
    const { unmount } = render(<VehicleStickyBar {...props} />)
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
