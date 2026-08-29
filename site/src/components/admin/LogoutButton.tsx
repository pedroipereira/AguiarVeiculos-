'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

export function LogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleLogout() {
    setBusy(true)
    const client = createBrowserSupabaseClient()
    await client.auth.signOut()
    router.push('/admin/login')
    // Drops the cached RSC payloads rendered for the session that just ended.
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={busy}
      className="font-bold uppercase hover:text-aguiar-red disabled:opacity-50"
    >
      Sair
    </button>
  )
}
