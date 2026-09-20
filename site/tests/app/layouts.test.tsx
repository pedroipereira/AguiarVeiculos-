import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

import PublicLayout, { viewport } from '@/app/(public)/layout'
import * as rootLayout from '@/app/layout'

describe('(public) layout', () => {
  it('wraps public pages with the public Header and Footer', () => {
    render(<PublicLayout><main>conteúdo público</main></PublicLayout>)
    expect(screen.getAllByRole('link', { name: 'Nossos Veículos' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Presidente Dutra/i).length).toBeGreaterThan(0)
    expect(screen.getByText('conteúdo público')).toBeInTheDocument()
  })

  it('includes the sitewide AutomotiveBusiness JSON-LD', () => {
    const { container } = render(<PublicLayout><main /></PublicLayout>)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    expect(JSON.parse(script!.innerHTML)['@type']).toBe('AutomotiveBusiness')
  })

  describe('no zoom and no selection', () => {
    it('tells phones not to let the visitor zoom the page', () => {
      expect(viewport).toMatchObject({ width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false })
    })

    it('does not change the zoom of the admin, which keeps the default', () => {
      expect((rootLayout as Record<string, unknown>).viewport).toBeUndefined()
    })

    it('marks the whole public page as not selectable', () => {
      const { container } = render(<PublicLayout><main>conteúdo público</main></PublicLayout>)
      const wrapper = container.querySelector('.no-select')!
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toContainElement(screen.getByText('conteúdo público'))
      expect(wrapper).toContainElement(screen.getAllByRole('link', { name: 'Nossos Veículos' })[0])
    })

    it('stops the pinch gesture of iPhones while the page is open, and stops stopping it when the page closes', () => {
      const { unmount } = render(<PublicLayout><main /></PublicLayout>)
      const pinch = new Event('gesturestart', { cancelable: true })
      document.dispatchEvent(pinch)
      expect(pinch.defaultPrevented).toBe(true)

      unmount()
      const later = new Event('gesturestart', { cancelable: true })
      document.dispatchEvent(later)
      expect(later.defaultPrevented).toBe(false)
    })
  })
})
