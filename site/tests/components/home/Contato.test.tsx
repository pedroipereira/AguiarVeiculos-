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
    expect(screen.getByText(/BR-135, Campo Dantas/i)).toBeInTheDocument()
    expect(screen.getByText(/99103-0107/)).toBeInTheDocument()
    expect(screen.getByTestId('location-video')).toHaveAttribute('src', 'https://example.com/como-chegar.mp4')
  })

  it('hides the video block when no location video is set', async () => {
    const client = fakeClient(null)
    render(await Contato({ client }))
    expect(screen.queryByTestId('location-video')).not.toBeInTheDocument()
  })
})
