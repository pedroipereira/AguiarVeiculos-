export function isProtectedAdminPath(pathname: string): boolean {
  if (pathname.startsWith('/api/admin')) return true
  return pathname.startsWith('/admin') && pathname !== '/admin/login'
}

export function shouldRedirectToLogin(pathname: string, isAuthenticated: boolean): boolean {
  return isProtectedAdminPath(pathname) && !isAuthenticated
}
