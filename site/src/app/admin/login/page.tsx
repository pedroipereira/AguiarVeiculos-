'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const client = createBrowserSupabaseClient()
    const { error: signInError } = await client.auth.signInWithPassword({
      email: String(formData.get('email')),
      password: String(formData.get('password')),
    })
    if (signInError) {
      setError('E-mail ou senha inválidos.')
      return
    }
    router.push('/admin')
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-24">
      <h1 className="text-2xl font-bold uppercase">Painel Aguiar Veículos</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required className="rounded border p-2 text-graphite" />
        <label htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" required className="rounded border p-2 text-graphite" />
        {error && <p className="text-aguiar-red">{error}</p>}
        <Button type="submit">Entrar</Button>
      </form>
    </main>
  )
}
