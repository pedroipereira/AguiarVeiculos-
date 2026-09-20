import config from '../tailwind.config'

const colors = (config.theme?.extend?.colors ?? {}) as Record<string, string>

describe('page colors', () => {
  it('uses a single black for the whole home page: the brand graphite, #111111', () => {
    // The hero and showroom photos sit on graphite too, so the sections blend with them without a seam.
    expect(colors.graphite).toBe('#111111')
    expect(colors).not.toHaveProperty('charcoal')
  })

  it('registers the marquee animation used by the numbers strip', () => {
    const keyframes = config.theme?.extend?.keyframes as Record<string, unknown>
    const animation = config.theme?.extend?.animation as Record<string, string>
    expect(keyframes).toHaveProperty('marquee')
    expect(animation.marquee).toMatch(/marquee .*linear infinite/)
  })
})
