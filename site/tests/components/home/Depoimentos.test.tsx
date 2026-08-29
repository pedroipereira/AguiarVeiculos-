import { render, screen } from '@testing-library/react'
import { Depoimentos } from '@/components/home/Depoimentos'

function fakeClient(rows: any[]) {
  const chain: any = { select: () => chain, order: async () => ({ data: rows, error: null }) }
  return { from: () => chain } as any
}

describe('Depoimentos', () => {
  it('renders one card per published testimonial', async () => {
    const client = fakeClient([
      { id: '1', image_url: 'https://x/1.jpg', caption: 'Realizei meu sonho! 🙏' },
    ])
    render(await Depoimentos({ client }))
    expect(screen.getByText('Realizei meu sonho! 🙏')).toBeInTheDocument()
    expect(screen.getByAltText(/depoimento de cliente/i)).toHaveAttribute('src', 'https://x/1.jpg')
  })

  it('renders nothing visible when there are no published testimonials', async () => {
    const client = fakeClient([])
    const { container } = render(await Depoimentos({ client }))
    expect(container).toBeEmptyDOMElement()
  })
})
