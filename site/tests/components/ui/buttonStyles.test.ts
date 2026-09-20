import { buttonBase, buttonVariants } from '@/components/ui/buttonStyles'

describe('buttons', () => {
  it('are at least 44px tall on phones and tablets, the smallest comfortable size for a finger', () => {
    expect(buttonBase).toContain('min-h-11')
    expect(buttonBase).toContain('lg:min-h-0')
  })

  it('keep their look: pill shape, small bold uppercase label', () => {
    expect(buttonBase).toContain('rounded-full')
    expect(buttonBase).toContain('uppercase')
    expect(Object.keys(buttonVariants)).toEqual(['primary', 'outline', 'outlineOnLight'])
  })
})
