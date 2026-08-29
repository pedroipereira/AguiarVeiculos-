import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { submitFinancingLead, submitTradeInLead } = vi.hoisted(() => ({
  submitFinancingLead: vi.fn(async () => ({ id: 'lead-1' })),
  submitTradeInLead: vi.fn(async () => ({ id: 'lead-2' })),
}))
vi.mock('@/app/actions/leads', () => ({ submitFinancingLead, submitTradeInLead }))

import { FinanciamentoAvaliacao } from '@/components/home/FinanciamentoAvaliacao'

beforeEach(() => {
  submitFinancingLead.mockClear()
  submitTradeInLead.mockClear()
  // @ts-expect-error - jsdom location is reassignable for this test
  delete window.location
  // @ts-expect-error
  window.location = { href: '' }
})

describe('FinanciamentoAvaliacao', () => {
  it('submits the financing form, saves the lead, and opens WhatsApp', async () => {
    render(<FinanciamentoAvaliacao />)
    fireEvent.change(screen.getByLabelText(/nome \(financiamento\)/i), { target: { value: 'Maria' } })
    fireEvent.change(screen.getByLabelText(/telefone \(financiamento\)/i), { target: { value: '98999999999' } })
    fireEvent.click(screen.getByRole('button', { name: /simular financiamento/i }))

    await waitFor(() => expect(submitFinancingLead).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Maria', phone: '98999999999' }),
    ))
    expect(window.location.href).toContain('https://wa.me/5598991030107?text=')
    expect(window.location.href).toContain('financiamento')
  })

  it('submits the trade-in form, saves the lead, and opens WhatsApp', async () => {
    render(<FinanciamentoAvaliacao />)
    fireEvent.change(screen.getByLabelText(/nome \(avaliação\)/i), { target: { value: 'João' } })
    fireEvent.change(screen.getByLabelText(/telefone \(avaliação\)/i), { target: { value: '98988888888' } })
    fireEvent.change(screen.getByLabelText(/marca do seu carro/i), { target: { value: 'Chevrolet' } })
    fireEvent.change(screen.getByLabelText(/modelo do seu carro/i), { target: { value: 'Onix' } })
    fireEvent.change(screen.getByLabelText(/ano do seu carro/i), { target: { value: '2019' } })
    fireEvent.change(screen.getByLabelText(/km rodados/i), { target: { value: '60000' } })
    fireEvent.click(screen.getByRole('button', { name: /avaliar meu carro/i }))

    await waitFor(() => expect(submitTradeInLead).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João', brand: 'Chevrolet', model: 'Onix' }),
    ))
    expect(window.location.href).toContain('https://wa.me/5598991030107?text=')
  })
})
