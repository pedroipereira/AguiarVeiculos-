import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi } from 'vitest'
import { Galeria } from '@/components/home/Galeria'

// jsdom viewport: 1024 x 768. The section is 260vh tall, so it scrolls 1.6 screens while pinned.
const VIEWPORT_W = 1024
const VIEWPORT_H = 768
const SECTION_H = VIEWPORT_H * 2.6
const SCROLLABLE = SECTION_H - VIEWPORT_H

/** Makes the section look `progress` (0 to 1) of the way through its pinned scroll. */
function pretendScrolledTo(progress: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: -progress * SCROLLABLE,
    height: SECTION_H,
    bottom: 0, left: 0, right: 0, width: VIEWPORT_W, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect)
}

function scrollTo(progress: number) {
  pretendScrolledTo(progress)
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

const card = () => screen.getByTestId('showroom-card')
const titleLines = () => [screen.getByTestId('showroom-title-a'), screen.getByTestId('showroom-title-b')]

beforeEach(() => {
  // Every test starts with the section at the top of its pinned scroll.
  pretendScrolledTo(0)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0)
    return 0
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Galeria', () => {
  it('falls back to the static showroom photo when no photos are provided', () => {
    render(<Galeria />)
    expect(screen.getByAltText(/estrutura da aguiar veículos/i)).toHaveAttribute('src', '/images/fotos/showroom-fachada.jpg')
  })

  it('is a tall section that stays pinned while the visitor scrolls', () => {
    const { container } = render(<Galeria />)
    const section = container.querySelector('section')!
    expect(section).toHaveStyle({ height: '260vh' })
    expect(section.firstElementChild).toHaveClass('sticky', 'top-0', 'h-screen', 'overflow-hidden')
  })

  describe('the expanding card', () => {
    it('starts as a small portrait card, 300 x 400, with rounded corners', () => {
      render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      expect(card()).toHaveStyle({ width: '300px', height: '400px', borderRadius: '18px' })
    })

    it('grows in a straight line with the scroll, losing its rounded corners', () => {
      render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      scrollTo(0.5)
      expect(card()).toHaveStyle({ width: '662px', height: '584px', borderRadius: '9px' })
    })

    it('ends filling the whole screen, with square corners', () => {
      render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      scrollTo(1)
      expect(card()).toHaveStyle({ width: `${VIEWPORT_W}px`, height: `${VIEWPORT_H}px`, borderRadius: '0px' })
    })

    it('never goes past the ends when the section is scrolled beyond them', () => {
      render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      scrollTo(1.4)
      expect(card()).toHaveStyle({ width: `${VIEWPORT_W}px` })
      scrollTo(-0.4)
      expect(card()).toHaveStyle({ width: '300px' })
    })
  })

  describe('the title', () => {
    it('reads as one heading, on two lines over the card', () => {
      render(<Galeria />)
      expect(screen.getByRole('heading', { level: 2, name: 'Entre e conheça a Aguiar Veículos.' })).toBeInTheDocument()
      const [a, b] = titleLines()
      expect(a).toHaveTextContent('Entre e conheça')
      expect(b).toHaveTextContent('a Aguiar Veículos.')
    })

    it('sits centered at first, then each line slides out to its own side as the card grows', () => {
      render(<Galeria />)
      const [a, b] = titleLines()
      expect(a).toHaveStyle({ transform: 'translateX(0px)' })
      expect(b).toHaveStyle({ transform: 'translateX(0px)' })

      scrollTo(0.5)
      expect(a).toHaveStyle({ transform: `translateX(${-0.5 * 1.4 * VIEWPORT_W}px)` })
      expect(b).toHaveStyle({ transform: `translateX(${0.5 * 1.4 * VIEWPORT_W}px)` })
    })

    it('is fully off the screen at the end', () => {
      render(<Galeria />)
      scrollTo(1)
      const [a, b] = titleLines()
      expect(a).toHaveStyle({ transform: `translateX(${-1.4 * VIEWPORT_W}px)` })
      expect(b).toHaveStyle({ transform: `translateX(${1.4 * VIEWPORT_W}px)` })
    })
  })

  describe('the fades into the page gray', () => {
    const top = () => screen.getByTestId('showroom-fade-top')
    const bottom = () => screen.getByTestId('showroom-fade-bottom')

    it('is a soft gradient on each edge, never in the way of clicks or screen readers', () => {
      render(<Galeria />)
      expect(top()).toHaveClass('bg-gradient-to-b', 'from-graphite', 'to-transparent', 'top-0')
      expect(bottom()).toHaveClass('bg-gradient-to-t', 'from-graphite', 'to-transparent', 'bottom-0')
      for (const fade of [top(), bottom()]) {
        expect(fade).toHaveAttribute('aria-hidden', 'true')
        expect(fade).toHaveClass('pointer-events-none')
      }
    })

    it('starts with the top edge blended into the section above, and clears as the visitor begins to scroll', () => {
      render(<Galeria />)
      expect(top()).toHaveStyle({ opacity: '1' })
      expect(bottom()).toHaveStyle({ opacity: '0' })
      scrollTo(0.06)
      expect(top()).toHaveStyle({ opacity: '0.5' })
      scrollTo(0.2)
      expect(top()).toHaveStyle({ opacity: '0' })
    })

    it('leaves the photo clean through the middle', () => {
      render(<Galeria />)
      scrollTo(0.5)
      expect(top()).toHaveStyle({ opacity: '0' })
      expect(bottom()).toHaveStyle({ opacity: '0' })
    })

    it('blends the bottom edge into the section below as the card reaches full screen', () => {
      render(<Galeria />)
      scrollTo(0.925)
      expect(Number(bottom().style.opacity)).toBeCloseTo(0.5, 5)
      scrollTo(1)
      expect(bottom()).toHaveStyle({ opacity: '1' })
    })
  })

  describe('the background photo', () => {
    it('fades the dark background photo out as the card grows', () => {
      render(<Galeria />)
      const background = screen.getByTestId('showroom-background')
      expect(background).toHaveStyle({ opacity: '1' })
      scrollTo(0.25)
      expect(background).toHaveStyle({ opacity: '0.75' })
      scrollTo(1)
      expect(background).toHaveStyle({ opacity: '0' })
    })

    it('follows the card: the background shows the same photo as the card, and changes with it', () => {
      vi.useFakeTimers()
      const photos = ['/a.jpg', '/b.jpg', '/c.jpg']
      render(<Galeria photos={photos} />)
      const visibleBackground = () =>
        Array.from(screen.getByTestId('showroom-background').querySelectorAll('img'))
          .filter((img) => img.classList.contains('opacity-100'))
          .map((img) => img.getAttribute('src'))
      expect(visibleBackground()).toEqual(['/a.jpg'])
      act(() => { vi.advanceTimersByTime(4000) })
      expect(visibleBackground()).toEqual(['/b.jpg'])
      fireEvent.click(screen.getByLabelText(/ver foto 3 da galeria/i))
      expect(visibleBackground()).toEqual(['/c.jpg'])
    })

    it('keeps the background photos hidden from screen readers', () => {
      render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      const images = screen.getByTestId('showroom-background').querySelectorAll('img')
      expect(images).toHaveLength(2)
      images.forEach((img) => expect(img).toHaveAttribute('aria-hidden', 'true'))
    })

    it('has no progress line at the bottom, at any point of the scroll', () => {
      render(<Galeria />)
      expect(screen.queryByTestId('showroom-progress')).not.toBeInTheDocument()
      scrollTo(0.5)
      expect(screen.queryByTestId('showroom-progress')).not.toBeInTheDocument()
      scrollTo(1)
      expect(screen.queryByTestId('showroom-progress')).not.toBeInTheDocument()
    })
  })

  describe('the scroll hint', () => {
    it('shows "Role para expandir", readable over the photo, and hides once the visitor scrolls', () => {
      render(<Galeria />)
      const hint = screen.getByText(/role para expandir/i)
      expect(hint).toHaveClass('text-white/90')
      expect(hint.parentElement).toHaveStyle({ opacity: '1' })
      scrollTo(0.2)
      expect(hint.parentElement).toHaveStyle({ opacity: '0' })
    })
  })

  describe('on a screen taller than wide (phone, tablet standing up)', () => {
    // The photos are 16:9. Filling a 390 x 844 screen would zoom them almost 4x, so the card
    // stops at the screen width and keeps a 4:3 shape.
    const original = { width: window.innerWidth, height: window.innerHeight }
    beforeEach(() => {
      window.innerWidth = 390
      window.innerHeight = 844
    })
    afterEach(() => {
      window.innerWidth = original.width
      window.innerHeight = original.height
    })

    it('starts as a small 4:3 card, not a tall portrait one', () => {
      render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      expect(card()).toHaveStyle({ width: '300px', height: '225px', borderRadius: '18px' })
    })

    it('grows only to the screen width, staying 4:3 and losing its rounded corners', () => {
      render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      scrollTo(1)
      expect(card()).toHaveStyle({ width: '390px', height: '292.5px', borderRadius: '0px' })
    })

    it('keeps the background photo, blurred, because the card never covers the screen', () => {
      render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      const background = screen.getByTestId('showroom-background')
      scrollTo(1)
      expect(background).toHaveStyle({ opacity: '1' })
      const photo = background.querySelector('img')!
      expect(photo.style.filter).toContain('blur(')
    })
  })

  describe('on a screen wider than tall', () => {
    it('keeps the full-screen expansion and a sharp background', () => {
      render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      scrollTo(1)
      expect(card()).toHaveStyle({ width: '1024px', height: '768px' })
      expect(screen.getByTestId('showroom-background').querySelector('img')!.style.filter).toBe('')
    })
  })

  describe('the focus of each photo', () => {
    const photos = ['https://x.co/1-galeria-01-rua-x21.jpg', 'https://x.co/2-galeria-05-recepcao-x63.jpg', 'https://x.co/3-sem-foco.jpg']

    it('lets the card measure itself, so the photo can be centered on its subject at any card size', () => {
      render(<Galeria photos={photos} />)
      expect(card()).toHaveClass('[container-type:size]')
    })

    it('centers each photo on the focus in its file name, in the card and in the background', () => {
      const { container } = render(<Galeria photos={photos} />)
      const inCard = Array.from(container.querySelectorAll('[data-testid=showroom-card] img')) as HTMLImageElement[]
      expect(inCard[0].style.objectPosition).toContain('0.21')
      expect(inCard[1].style.objectPosition).toContain('0.63')
      const inBackground = Array.from(container.querySelectorAll('[data-testid=showroom-background] img')) as HTMLImageElement[]
      expect(inBackground[0].style.objectPosition).toContain('0.21')
      expect(inBackground[1].style.objectPosition).toContain('0.63')
    })

    it('keeps the photo centered when the name has no focus', () => {
      const { container } = render(<Galeria photos={photos} />)
      const inCard = Array.from(container.querySelectorAll('[data-testid=showroom-card] img')) as HTMLImageElement[]
      expect(inCard[2].style.objectPosition).toBe('')
    })
  })

  describe('the photos inside the card', () => {
    const photos = ['/a.jpg', '/b.jpg', '/c.jpg']
    const current = () => screen.getByAltText(/estrutura da aguiar veículos/i)

    it('shows the first photo, and the others only to the eyes, not to screen readers', () => {
      const { container } = render(<Galeria photos={photos} />)
      expect(current()).toHaveAttribute('src', '/a.jpg')
      expect(container.querySelectorAll('[data-testid=showroom-card] img').length).toBe(3)
      expect(screen.getAllByAltText(/estrutura da aguiar veículos/i)).toHaveLength(1)
    })

    it('lets the visitor pick a photo with the dots', () => {
      render(<Galeria photos={photos} />)
      fireEvent.click(screen.getByLabelText(/ver foto 2 da galeria/i))
      expect(current()).toHaveAttribute('src', '/b.jpg')
      expect(screen.getByLabelText(/ver foto 2 da galeria/i)).toHaveAttribute('aria-current', 'true')
      expect(screen.getByLabelText(/ver foto 1 da galeria/i)).not.toHaveAttribute('aria-current')
    })

    it('draws the current dot as a longer pill', () => {
      render(<Galeria photos={photos} />)
      expect(screen.getByLabelText(/ver foto 1 da galeria/i)).toHaveClass('w-[22px]')
      expect(screen.getByLabelText(/ver foto 2 da galeria/i)).toHaveClass('w-2')
    })

    it('changes photo by itself every 4 seconds, and starts over after the last one', () => {
      vi.useFakeTimers()
      render(<Galeria photos={photos} />)
      expect(current()).toHaveAttribute('src', '/a.jpg')
      act(() => { vi.advanceTimersByTime(4000) })
      expect(current()).toHaveAttribute('src', '/b.jpg')
      act(() => { vi.advanceTimersByTime(4000) })
      expect(current()).toHaveAttribute('src', '/c.jpg')
      act(() => { vi.advanceTimersByTime(4000) })
      expect(current()).toHaveAttribute('src', '/a.jpg')
    })

    it('gives the visitor a full 4 seconds after picking a photo', () => {
      vi.useFakeTimers()
      render(<Galeria photos={photos} />)
      act(() => { vi.advanceTimersByTime(3000) })
      fireEvent.click(screen.getByLabelText(/ver foto 3 da galeria/i))
      act(() => { vi.advanceTimersByTime(3000) })
      expect(current()).toHaveAttribute('src', '/c.jpg')
      act(() => { vi.advanceTimersByTime(1000) })
      expect(current()).toHaveAttribute('src', '/a.jpg')
    })

    it('has no dots and no timer with a single photo', () => {
      vi.useFakeTimers()
      render(<Galeria photos={['/only.jpg']} />)
      expect(screen.queryByLabelText(/ver foto/i)).not.toBeInTheDocument()
      act(() => { vi.advanceTimersByTime(12000) })
      expect(current()).toHaveAttribute('src', '/only.jpg')
    })
  })

  describe('for visitors who ask for less motion', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
      })) as unknown as typeof window.matchMedia
    })
    afterEach(() => {
      // @ts-expect-error restoring the jsdom default (no matchMedia)
      delete window.matchMedia
    })

    it('shows the full-screen photo right away, in a section that is one screen tall', () => {
      const { container } = render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      expect(container.querySelector('section')).toHaveStyle({ height: '100vh' })
      expect(card()).toHaveStyle({ width: `${VIEWPORT_W}px`, height: `${VIEWPORT_H}px`, borderRadius: '0px' })
      expect(screen.queryByTestId('showroom-progress')).not.toBeInTheDocument()
    })

    it('blends both edges of the still photo into the page gray', () => {
      render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      expect(screen.getByTestId('showroom-fade-top')).toHaveStyle({ opacity: '1' })
      expect(screen.getByTestId('showroom-fade-bottom')).toHaveStyle({ opacity: '1' })
    })

    it('does not change photo by itself', () => {
      vi.useFakeTimers()
      render(<Galeria photos={['/a.jpg', '/b.jpg']} />)
      act(() => { vi.advanceTimersByTime(12000) })
      expect(screen.getByAltText(/estrutura da aguiar veículos/i)).toHaveAttribute('src', '/a.jpg')
    })
  })
})
