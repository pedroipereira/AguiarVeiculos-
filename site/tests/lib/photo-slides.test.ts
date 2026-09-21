import { buildSlides, slideFocusVars } from '@/lib/photo-slides'

const U = 'https://x.co/site-images/0b3f6a52-1c2d-4e5f-8a9b-0c1d2e3f4a5b'
const land = (n: string, x = 24) => `${U}-${n}-x${x}.jpg`
const port = (n: string, x = 33) => `${U}-${n}-vertical-x${x}.jpg`

describe('buildSlides', () => {
  it('joins each landscape photo with its portrait version, keeping the upload order of the landscape ones', () => {
    const slides = buildSlides([land('galeria-01-rua'), land('galeria-02-carros'), port('galeria-02-carros'), port('galeria-01-rua')])
    expect(slides).toEqual([
      { landscape: land('galeria-01-rua'), portrait: port('galeria-01-rua') },
      { landscape: land('galeria-02-carros'), portrait: port('galeria-02-carros') },
    ])
  })

  it('does not matter which of the two was uploaded first', () => {
    expect(buildSlides([port('a-b'), land('a-b')])).toEqual([{ landscape: land('a-b'), portrait: port('a-b') }])
  })

  it('leaves a landscape photo with no portrait version alone', () => {
    expect(buildSlides([land('a-b'), land('c-d')])).toEqual([{ landscape: land('a-b') }, { landscape: land('c-d') }])
  })

  it('keeps a portrait photo with no landscape version as its own slide', () => {
    expect(buildSlides([land('a-b'), port('x-y')])).toEqual([{ landscape: land('a-b') }, { portrait: port('x-y') }])
  })

  it('never joins photos whose names are unrelated', () => {
    expect(buildSlides(['/a.jpg', '/b.jpg'])).toEqual([{ landscape: '/a.jpg' }, { landscape: '/b.jpg' }])
  })
})

describe('slideFocusVars', () => {
  it('gives one focus per format, from each file name', () => {
    const vars = slideFocusVars({ landscape: land('a-b', 24), portrait: port('a-b', 33) })
    expect(vars['--focal-l']).toContain('0.24')
    expect(vars['--focal-l']).toContain('177.7778cqh')
    expect(vars['--focal-p']).toContain('0.33')
    expect(vars['--focal-p']).toContain('75.0000cqh')
  })

  it('centers the portrait photo when its name has no focus, instead of borrowing the landscape one', () => {
    const vars = slideFocusVars({ landscape: land('a-b', 24), portrait: `${U}-a-b-vertical.jpg` })
    expect(vars['--focal-p']).toBe('center')
  })

  it('sets nothing when there is no focus to apply', () => {
    expect(slideFocusVars({ landscape: '/a.jpg' })).toEqual({})
  })

  it('uses the portrait focus on every screen when only a portrait photo exists', () => {
    const vars = slideFocusVars({ portrait: port('x-y', 40) })
    expect(vars['--focal-l']).toContain('0.4')
    expect(vars['--focal-p']).toBe(vars['--focal-l'])
  })
})
