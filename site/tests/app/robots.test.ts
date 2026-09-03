import robots from '@/app/robots'
import { SITE_URL } from '@/lib/seo'

describe('robots', () => {
  it('allows public crawling and blocks the admin dashboard', () => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules
    expect(rules.allow).toBe('/')
    expect(rules.disallow).toEqual(['/admin', '/api/admin'])
  })

  it('points to the sitemap', () => {
    const result = robots()
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
  })
})
