import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { vi } from 'vitest'
import { VehicleGallery } from '@/components/catalog/VehicleGallery'

const photos = ['/a.jpg', '/b.jpg', '/c.jpg']
const label = 'Fiat Strada Volcano'

const main = () => screen.getByRole('img', { name: label })
const frame = () => screen.getByTestId('vehicle-gallery-frame')

function swipe(target: HTMLElement, from: number, to: number, dy = 0) {
  fireEvent.touchStart(target, { touches: [{ clientX: from, clientY: 100 }] })
  fireEvent.touchEnd(target, { changedTouches: [{ clientX: to, clientY: 100 + dy }] })
}

describe('VehicleGallery', () => {
  it('shows a placeholder block when there are no photos', () => {
    render(<VehicleGallery images={[]} label={label} />)
    expect(screen.getByTestId('vehicle-gallery-placeholder')).toBeInTheDocument()
  })

  it('shows a single photo with no strip, arrows or counter', () => {
    render(<VehicleGallery images={['/a.jpg']} label={label} />)
    expect(main()).toHaveAttribute('src', '/a.jpg')
    expect(screen.queryByLabelText(/próxima foto/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\/ 1/)).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /ver foto \d+ de/i })).toHaveLength(0)
  })

  it('starts on the first photo, with a counter', () => {
    render(<VehicleGallery images={photos} label={label} />)
    expect(main()).toHaveAttribute('src', '/a.jpg')
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('goes to the next and to the previous photo with the arrows, wrapping around', () => {
    render(<VehicleGallery images={photos} label={label} />)
    fireEvent.click(screen.getByLabelText(/foto anterior/i))
    expect(main()).toHaveAttribute('src', '/c.jpg')
    fireEvent.click(screen.getByLabelText(/próxima foto/i))
    expect(main()).toHaveAttribute('src', '/a.jpg')
  })

  it('lets the visitor pick a photo in the strip, marking the current one', () => {
    render(<VehicleGallery images={photos} label={label} />)
    fireEvent.click(screen.getByRole('button', { name: `Ver foto 2 de ${label}` }))
    expect(main()).toHaveAttribute('src', '/b.jpg')
    expect(screen.getByRole('button', { name: `Ver foto 2 de ${label}` })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: `Ver foto 1 de ${label}` })).not.toHaveAttribute('aria-current')
  })

  it('changes photo by swiping with a finger, left for the next and right for the previous', () => {
    render(<VehicleGallery images={photos} label={label} />)
    swipe(frame(), 200, 100)
    expect(main()).toHaveAttribute('src', '/b.jpg')
    swipe(frame(), 100, 200)
    expect(main()).toHaveAttribute('src', '/a.jpg')
    swipe(frame(), 100, 200)
    expect(main()).toHaveAttribute('src', '/c.jpg')
  })

  it('ignores a short or mostly vertical drag, so scrolling the page never changes the photo', () => {
    render(<VehicleGallery images={photos} label={label} />)
    swipe(frame(), 200, 180)
    swipe(frame(), 200, 120, 200)
    expect(main()).toHaveAttribute('src', '/a.jpg')
  })

  it('fills the frame with the photo, leaving no bars and no blurred filler, and never stretching it', () => {
    render(<VehicleGallery images={photos} label={label} />)
    expect(main()).toHaveClass('object-cover')
    expect(main()).not.toHaveClass('object-contain')
    expect(screen.queryByTestId('vehicle-gallery-backdrop')).not.toBeInTheDocument()
  })

  it('is edge to edge on a phone, and a rounded block inside the page from the small breakpoint up', () => {
    render(<VehicleGallery images={photos} label={label} />)
    expect(frame()).toHaveClass('-mx-6', 'sm:mx-0', 'sm:rounded-lg', 'overflow-hidden')
  })

  describe('the shape of the frame', () => {
    // The first photo is the cover, so the frame takes its shape, between a square and 4:3: the photos of a
    // car are then cut as little as possible, and the whole photo is one tap away in the viewer.
    class FakeImage {
      static size = { width: 1600, height: 1200 }
      naturalWidth = FakeImage.size.width
      naturalHeight = FakeImage.size.height
      onload: (() => void) | null = null
      set src(_value: string) {
        this.onload?.()
      }
    }
    beforeEach(() => vi.stubGlobal('Image', FakeImage))
    afterEach(() => vi.unstubAllGlobals())
    const ratioFor = (width: number, height: number) => {
      FakeImage.size = { width, height }
      render(<VehicleGallery images={photos} label={label} />)
      return Number(frame().style.aspectRatio)
    }

    it('follows the first photo', () => {
      expect(ratioFor(1600, 1408)).toBeCloseTo(1600 / 1408)
    })

    it('never gets wider than 4:3, even for a very wide first photo', () => {
      expect(ratioFor(2000, 1000)).toBeCloseTo(4 / 3)
    })

    it('never gets taller than a square, even for a photo taken standing up', () => {
      expect(ratioFor(1000, 1400)).toBe(1)
    })

    it('starts at 5:4 until the first photo is measured, so nothing jumps far when it arrives', () => {
      vi.unstubAllGlobals()
      vi.stubGlobal('Image', class { naturalWidth = 0; naturalHeight = 0; onload: (() => void) | null = null; set src(_v: string) {} })
      render(<VehicleGallery images={photos} label={label} />)
      expect(Number(frame().style.aspectRatio)).toBeCloseTo(1.25)
    })

    it('keeps the shape of the first photo while the visitor goes through the others', () => {
      FakeImage.size = { width: 1600, height: 1408 }
      render(<VehicleGallery images={photos} label={label} />)
      fireEvent.click(screen.getByLabelText(/próxima foto/i))
      expect(Number(frame().style.aspectRatio)).toBeCloseTo(1600 / 1408)
    })
  })

  it('shows the strip as a row that scrolls sideways, so it never leaves one photo alone on a second line', () => {
    render(<VehicleGallery images={photos} label={label} />)
    expect(screen.getByTestId('vehicle-gallery-strip')).toHaveClass('flex', 'overflow-x-auto')
  })

  describe('the full-screen viewer', () => {
    it('opens with a tap on the photo, as a dialog showing the current photo', () => {
      render(<VehicleGallery images={photos} label={label} />)
      fireEvent.click(screen.getByLabelText(/próxima foto/i))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      fireEvent.click(main())
      const dialog = screen.getByRole('dialog', { name: `Fotos de ${label}` })
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(within(dialog).getByRole('img', { name: label })).toHaveAttribute('src', '/b.jpg')
      expect(within(dialog).getByText('2 / 3')).toBeInTheDocument()
    })

    it('opens with the full-screen button too', () => {
      render(<VehicleGallery images={photos} label={label} />)
      fireEvent.click(screen.getByRole('button', { name: /ver em tela cheia/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('gives the focus back only when it was opened with the keyboard, so a mouse or a finger never leaves a focus ring behind', () => {
      render(<VehicleGallery images={photos} label={label} />)
      const opener = screen.getByRole('button', { name: /ver em tela cheia/i })
      // A click made by a mouse or a finger reports how many times it was pressed (detail 1); the keyboard reports 0.
      fireEvent.click(opener, { detail: 1 })
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(opener).not.toHaveFocus()
    })

    it('closes with the close button and with Escape, giving the focus back to what opened it', () => {
      render(<VehicleGallery images={photos} label={label} />)
      const opener = screen.getByRole('button', { name: /ver em tela cheia/i })
      opener.focus()
      fireEvent.click(opener)
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /fechar fotos/i }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(opener).toHaveFocus()

      fireEvent.click(opener)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('starts with the focus on the close button, so the keyboard works right away', () => {
      render(<VehicleGallery images={photos} label={label} />)
      fireEvent.click(screen.getByRole('button', { name: /ver em tela cheia/i }))
      expect(within(screen.getByRole('dialog')).getByRole('button', { name: /fechar fotos/i })).toHaveFocus()
    })

    it('moves between photos with its arrows, with the keyboard arrows and by swiping', () => {
      render(<VehicleGallery images={photos} label={label} />)
      fireEvent.click(main())
      const dialog = screen.getByRole('dialog')
      const shown = () => within(dialog).getByRole('img', { name: label })

      fireEvent.click(within(dialog).getByLabelText(/próxima foto/i))
      expect(shown()).toHaveAttribute('src', '/b.jpg')
      fireEvent.keyDown(document, { key: 'ArrowRight' })
      expect(shown()).toHaveAttribute('src', '/c.jpg')
      fireEvent.keyDown(document, { key: 'ArrowLeft' })
      expect(shown()).toHaveAttribute('src', '/b.jpg')
      swipe(within(dialog).getByTestId('vehicle-viewer-stage'), 200, 100)
      expect(shown()).toHaveAttribute('src', '/c.jpg')
    })

    it('keeps the photo it stopped on when it closes', () => {
      render(<VehicleGallery images={photos} label={label} />)
      fireEvent.click(main())
      fireEvent.keyDown(document, { key: 'ArrowRight' })
      fireEvent.keyDown(document, { key: 'ArrowRight' })
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(main()).toHaveAttribute('src', '/c.jpg')
      expect(screen.getByText('3 / 3')).toBeInTheDocument()
    })

    it('keeps the page from scrolling behind it, and lets it scroll again when it closes', () => {
      render(<VehicleGallery images={photos} label={label} />)
      fireEvent.click(main())
      expect(document.body.style.overflow).toBe('hidden')
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(document.body.style.overflow).toBe('')
    })

    describe('zoom', () => {
      const open = () => {
        render(<VehicleGallery images={photos} label={label} />)
        fireEvent.click(main())
        return screen.getByRole('dialog')
      }
      const zoomBox = (dialog: HTMLElement) => within(dialog).getByTestId('vehicle-viewer-zoom')
      const shown = (dialog: HTMLElement) => within(dialog).getByRole('img', { name: label })

      it('starts at the normal size, the whole photo on the screen', () => {
        const dialog = open()
        expect(zoomBox(dialog)).toHaveStyle({ width: '100%', height: '100%' })
        expect(within(dialog).getByTestId('vehicle-viewer-stage')).toHaveClass('overflow-hidden')
      })

      it('zooms in with a tap on the photo, and goes back with another tap', () => {
        const dialog = open()
        fireEvent.click(shown(dialog))
        expect(zoomBox(dialog)).toHaveStyle({ width: '250%', height: '250%' })
        // Zoomed in, the photo is bigger than the screen and is moved around by scrolling.
        expect(within(dialog).getByTestId('vehicle-viewer-stage')).toHaveClass('overflow-auto')
        fireEvent.click(shown(dialog))
        expect(zoomBox(dialog)).toHaveStyle({ width: '100%', height: '100%' })
      })

      it('has a button for it too, so the keyboard and screen readers can use it, and the button says what it does', () => {
        const dialog = open()
        const zoomIn = within(dialog).getByRole('button', { name: /ampliar foto/i })
        expect(zoomIn).toHaveAttribute('aria-pressed', 'false')
        fireEvent.click(zoomIn)
        expect(zoomBox(dialog)).toHaveStyle({ width: '250%' })
        const zoomOut = within(dialog).getByRole('button', { name: /voltar ao tamanho normal/i })
        expect(zoomOut).toHaveAttribute('aria-pressed', 'true')
        fireEvent.click(zoomOut)
        expect(zoomBox(dialog)).toHaveStyle({ width: '100%' })
      })

      it('lets a swipe move around the zoomed photo instead of changing the photo', () => {
        const dialog = open()
        fireEvent.click(shown(dialog))
        swipe(within(dialog).getByTestId('vehicle-viewer-stage'), 200, 100)
        expect(shown(dialog)).toHaveAttribute('src', '/a.jpg')
      })

      it('goes back to the normal size when another photo is shown, by arrow button or by keyboard', () => {
        const dialog = open()
        fireEvent.click(shown(dialog))
        fireEvent.click(within(dialog).getByLabelText(/próxima foto/i))
        expect(shown(dialog)).toHaveAttribute('src', '/b.jpg')
        expect(zoomBox(dialog)).toHaveStyle({ width: '100%' })

        fireEvent.click(shown(dialog))
        fireEvent.keyDown(document, { key: 'ArrowRight' })
        expect(zoomBox(dialog)).toHaveStyle({ width: '100%' })
      })

      it('opens at the normal size again, even if it was closed while zoomed', () => {
        const dialog = open()
        fireEvent.click(shown(dialog))
        fireEvent.keyDown(document, { key: 'Escape' })
        fireEvent.click(main())
        expect(zoomBox(screen.getByRole('dialog'))).toHaveStyle({ width: '100%' })
      })

      it('keeps the arrows and the close button in place while zoomed, so they do not scroll away', () => {
        const dialog = open()
        fireEvent.click(shown(dialog))
        const stage = within(dialog).getByTestId('vehicle-viewer-stage')
        expect(stage).not.toContainElement(within(dialog).getByLabelText(/próxima foto/i))
        expect(stage).not.toContainElement(within(dialog).getByRole('button', { name: /fechar fotos/i }))
      })
    })

    it('has no arrows or counter when there is a single photo, but still opens', () => {
      render(<VehicleGallery images={['/a.jpg']} label={label} />)
      fireEvent.click(main())
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).queryByLabelText(/próxima foto/i)).not.toBeInTheDocument()
      expect(within(dialog).queryByText(/\/ 1/)).not.toBeInTheDocument()
    })
  })
})
