import { render } from '@testing-library/react'
import { JsonLd } from '@/components/seo/JsonLd'

describe('JsonLd', () => {
  it('renders a script tag of type application/ld+json with the serialized data', () => {
    const { container } = render(<JsonLd data={{ '@type': 'Thing', name: 'Fiat Argo' }} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    expect(JSON.parse(script!.innerHTML)).toEqual({ '@type': 'Thing', name: 'Fiat Argo' })
  })

  it('escapes "<" so the payload cannot break out of the script tag', () => {
    const { container } = render(<JsonLd data={{ name: '</script><script>alert(1)</script>' }} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script!.innerHTML).not.toContain('</script><script>')
    expect(JSON.parse(script!.innerHTML).name).toBe('</script><script>alert(1)</script>')
  })
})
