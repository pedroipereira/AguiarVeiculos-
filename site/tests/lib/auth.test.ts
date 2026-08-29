import { describe, it, expect } from 'vitest'
import { isProtectedAdminPath, shouldRedirectToLogin } from '@/lib/auth'

describe('isProtectedAdminPath', () => {
  it('protects /admin and its subpaths, but not /admin/login', () => {
    expect(isProtectedAdminPath('/admin')).toBe(true)
    expect(isProtectedAdminPath('/admin/veiculos')).toBe(true)
    expect(isProtectedAdminPath('/admin/login')).toBe(false)
    expect(isProtectedAdminPath('/estoque')).toBe(false)
  })

  it('protects the admin-only API routes under /api/admin', () => {
    expect(isProtectedAdminPath('/api/admin/placas')).toBe(true)
  })
})

describe('shouldRedirectToLogin', () => {
  it('redirects unauthenticated requests to protected admin paths', () => {
    expect(shouldRedirectToLogin('/admin/veiculos', false)).toBe(true)
    expect(shouldRedirectToLogin('/admin/veiculos', true)).toBe(false)
    expect(shouldRedirectToLogin('/admin/login', false)).toBe(false)
    expect(shouldRedirectToLogin('/estoque', false)).toBe(false)
  })
})
