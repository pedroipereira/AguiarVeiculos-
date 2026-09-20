import { render, screen, fireEvent } from '@testing-library/react'
import { Galeria } from '@/components/home/Galeria'

describe('Galeria', () => {
  it('falls back to the static showroom photo when no photos are provided', () => {
    render(<Galeria />)
    expect(screen.getByAltText(/showroom da aguiar veículos/i)).toHaveAttribute('src', '/images/fotos/showroom-fachada.jpg')
  })

  it('uses the admin-provided photos and lets the visitor switch between them', () => {
    render(<Galeria photos={['/a.jpg', '/b.jpg', '/c.jpg']} />)
    expect(screen.getByAltText(/showroom da aguiar veículos/i)).toHaveAttribute('src', '/a.jpg')

    fireEvent.click(screen.getByLabelText(/ver foto 2 do showroom/i))
    expect(screen.getByAltText(/showroom da aguiar veículos/i)).toHaveAttribute('src', '/b.jpg')
  })

  it('keeps the scroll hint readable over the photo', () => {
    render(<Galeria />)
    const hint = screen.getByText(/role para expandir/i)
    expect(hint).toHaveClass('text-white/80')
    expect(hint).not.toHaveClass('text-support-gray')
  })
})
