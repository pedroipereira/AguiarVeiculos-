import { render, screen } from '@testing-library/react'
import FinanciamentoPage from '@/app/(public)/financiamento/page'

const open = (params: Record<string, string | undefined> = {}) => FinanciamentoPage({ searchParams: Promise.resolve(params) })

describe('/financiamento page', () => {
  it('renders both the financing and trade-in forms', async () => {
    render(await open())
    expect(screen.getByRole('heading', { name: /simular financiamento/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /avaliar meu carro para troca/i })).toBeInTheDocument()
  })

  it('leaves the car of interest empty when the visitor did not come from a vehicle page', async () => {
    render(await open())
    expect(screen.getByLabelText(/carro de interesse/i)).toHaveValue('')
  })

  it('fills the car of interest with the vehicle the visitor was looking at', async () => {
    render(await open({ carro: 'Fiat Strada Volcano 2022' }))
    expect(screen.getByLabelText(/carro de interesse/i)).toHaveValue('Fiat Strada Volcano 2022')
  })

  it('trims and shortens what comes in the address, so a long or odd value never breaks the form', async () => {
    render(await open({ carro: `   ${'x'.repeat(200)}   ` }))
    expect((screen.getByLabelText(/carro de interesse/i) as HTMLInputElement).value).toHaveLength(80)
  })
})
