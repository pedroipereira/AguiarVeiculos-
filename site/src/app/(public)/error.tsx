'use client'

import { useEffect } from 'react'

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="px-6 pb-24 pt-32 text-center">
      <h1 className="text-2xl font-bold">Não deu pra carregar essa página</h1>
      <p className="mt-4 text-white/85">Foi uma falha passageira. Tente de novo em alguns segundos.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-block font-bold text-aguiar-red-light hover:underline"
      >
        Tentar novamente
      </button>
    </main>
  )
}
