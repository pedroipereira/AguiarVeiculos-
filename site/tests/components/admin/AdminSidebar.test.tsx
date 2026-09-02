import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn(() => '/admin/veiculos') }))
vi.mock('next/navigation', () => ({ usePathname, useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/app/actions/leads', () => ({ adminCreateManualLead: vi.fn() }))

import { AdminSidebar } from '@/components/admin/AdminSidebar'

describe('AdminSidebar', () => {
  it('links the built sections and keeps unbuilt ones as non-clickable "Em breve" items', () => {
    render(<AdminSidebar vehicles={[]} />)

    expect(screen.getByRole('link', { name: /painel/i })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: /estoque/i })).toHaveAttribute('href', '/admin/veiculos')
    expect(screen.getByRole('link', { name: /clientes/i })).toHaveAttribute('href', '/admin/leads')
    expect(screen.getByRole('link', { name: /^site$/i })).toHaveAttribute('href', '/admin/imagens')

    for (const label of ['Agenda', 'Metas', 'Relatórios']) {
      expect(screen.queryByRole('link', { name: new RegExp(label, 'i') })).not.toBeInTheDocument()
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getAllByText(/em breve/i)).toHaveLength(3)
  })

  it('highlights the nav item matching the current route', () => {
    usePathname.mockReturnValue('/admin/veiculos')
    render(<AdminSidebar vehicles={[]} />)

    expect(screen.getByRole('link', { name: /estoque/i })).toHaveClass('text-aguiar-red')
    expect(screen.getByRole('link', { name: /clientes/i })).not.toHaveClass('text-aguiar-red')
    expect(screen.getByRole('link', { name: /painel/i })).not.toHaveClass('text-aguiar-red')
  })

  it('highlights Estoque for a nested vehicle route too', () => {
    usePathname.mockReturnValue('/admin/veiculos/v-1')
    render(<AdminSidebar vehicles={[]} />)

    expect(screen.getByRole('link', { name: /estoque/i })).toHaveClass('text-aguiar-red')
  })

  it('highlights Painel only for the exact /admin route, not nested admin routes', () => {
    usePathname.mockReturnValue('/admin')
    render(<AdminSidebar vehicles={[]} />)
    expect(screen.getByRole('link', { name: /painel/i })).toHaveClass('text-aguiar-red')

    usePathname.mockReturnValue('/admin/veiculos')
    render(<AdminSidebar vehicles={[]} />)
    expect(screen.getAllByRole('link', { name: /painel/i })[1]).not.toHaveClass('text-aguiar-red')
  })

  it('opens the new-lead modal as the quick action, not a vehicle form', () => {
    render(<AdminSidebar vehicles={[]} />)
    expect(screen.queryByText(/novo cliente/i)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /novo cliente/i }))
    expect(screen.getByRole('dialog', { name: /novo cliente/i })).toBeInTheDocument()
  })
})
