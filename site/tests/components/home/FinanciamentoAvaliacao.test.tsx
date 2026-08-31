import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
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
    const financingForm = within(screen.getByRole('button', { name: /simular financiamento/i }).closest('form')!)
    fireEvent.change(financingForm.getByLabelText(/^nome$/i), { target: { value: 'Maria' } })
    fireEvent.change(financingForm.getByLabelText(/carro de interesse/i), { target: { value: 'Fiat Argo 2023' } })
    fireEvent.change(financingForm.getByLabelText(/valor de entrada/i), { target: { value: 'R$ 5.000' } })
    fireEvent.change(financingForm.getByLabelText(/nº de parcelas/i), { target: { value: '48' } })
    fireEvent.click(financingForm.getByRole('button', { name: /simular financiamento/i }))

    await waitFor(() => expect(submitFinancingLead).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Maria',
        vehicleLabel: 'Fiat Argo 2023',
        downPayment: 'R$ 5.000',
        installments: 48,
      }),
    ))
    expect(window.location.href).toContain('https://wa.me/5598991030107?text=')
    expect(window.location.href).toContain('financiamento')
  })

  it('does not ask for a phone number on the financing form', () => {
    render(<FinanciamentoAvaliacao />)
    const financingForm = within(screen.getByRole('button', { name: /simular financiamento/i }).closest('form')!)
    expect(financingForm.queryByLabelText(/telefone/i)).not.toBeInTheDocument()
  })

  it('submits the trade-in form, saves the lead, and opens WhatsApp', async () => {
    render(<FinanciamentoAvaliacao />)
    const tradeInForm = within(screen.getByRole('button', { name: /avaliar meu carro/i }).closest('form')!)
    fireEvent.change(tradeInForm.getByLabelText(/^nome$/i), { target: { value: 'João' } })
    fireEvent.change(tradeInForm.getByLabelText(/modelo do seu carro/i), { target: { value: 'Onix' } })
    fireEvent.change(tradeInForm.getByLabelText(/ano do seu carro/i), { target: { value: '2019' } })
    fireEvent.change(tradeInForm.getByLabelText(/km rodados/i), { target: { value: '60000' } })
    fireEvent.change(tradeInForm.getByLabelText(/observações/i), { target: { value: 'Único dono' } })
    fireEvent.click(tradeInForm.getByRole('button', { name: /avaliar meu carro/i }))

    await waitFor(() => expect(submitTradeInLead).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João', model: 'Onix', observations: 'Único dono' }),
    ))
    expect(window.location.href).toContain('https://wa.me/5598991030107?text=')
  })

  it('does not ask for a phone number or brand on the trade-in form', () => {
    render(<FinanciamentoAvaliacao />)
    const tradeInForm = within(screen.getByRole('button', { name: /avaliar meu carro/i }).closest('form')!)
    expect(tradeInForm.queryByLabelText(/telefone/i)).not.toBeInTheDocument()
    expect(tradeInForm.queryByLabelText(/marca do seu carro/i)).not.toBeInTheDocument()
  })
})
