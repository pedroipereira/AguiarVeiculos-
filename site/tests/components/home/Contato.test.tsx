import { render, screen } from '@testing-library/react'
import { Contato } from '@/components/home/Contato'

function fakeClient(value: string | null) {
  const chain: any = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: value ? { value } : null, error: null }) }
  return { from: () => chain } as any
}

describe('Contato', () => {
  it('shows the address, phone, and the location video when set', async () => {
    const client = fakeClient('https://example.com/como-chegar.mp4')
    render(await Contato({ client }))
    expect(screen.getByRole('link', { name: /Av\. Campo Dantas, 1689/i })).toHaveAttribute(
      'href',
      'https://www.google.com/maps?q=Aguiar+Ve%C3%ADculos,+Presidente+Dutra+-+MA',
    )
    expect(screen.getByText(/posto full/i)).toBeInTheDocument()
    expect(screen.getByText(/99103-0107/)).toBeInTheDocument()
    expect(screen.getByText(/aguiarveiculospdutra@hotmail\.com/i)).toBeInTheDocument()
    expect(screen.getByText(/segunda a sexta, 7h30 às 17h30/i)).toBeInTheDocument()
    expect(screen.getByTestId('location-video')).toHaveAttribute('src', 'https://example.com/como-chegar.mp4')
  })

  it('reserves the video space with a placeholder when no location video is set', async () => {
    const client = fakeClient(null)
    render(await Contato({ client }))
    expect(screen.queryByTestId('location-video')).not.toBeInTheDocument()
    expect(screen.getByTestId('location-video-placeholder')).toBeInTheDocument()
  })
})
