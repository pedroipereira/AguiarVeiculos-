import { render, screen, fireEvent } from '@testing-library/react'
import { Galeria } from '@/components/home/Galeria'

describe('Galeria', () => {
  it('falls back to the static showroom photo when no photos are provided', () => {
    render(<Galeria />)
    expect(screen.getByAltText(/showroom da aguiar veículos/i)).toHaveAttribute('src', '/images/showroom-fachada.jpg')
  })

  it('uses the admin-provided photos and lets the visitor switch between them', () => {
    render(<Galeria photos={['/a.jpg', '/b.jpg', '/c.jpg']} />)
    expect(screen.getByAltText(/showroom da aguiar veículos/i)).toHaveAttribute('src', '/a.jpg')

    fireEvent.click(screen.getByLabelText(/ver foto 2 do showroom/i))
    expect(screen.getByAltText(/showroom da aguiar veículos/i)).toHaveAttribute('src', '/b.jpg')
  })
})
