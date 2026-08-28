import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home page', () => {
  it('renders the Aguiar Veículos headline', async () => {
    render(await Home())
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/aguiar veículos/i)
  })
})
