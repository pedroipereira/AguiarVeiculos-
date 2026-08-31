import Link from 'next/link'

export default function VehicleNotFound() {
  return (
    <main className="px-6 pb-24 pt-32 text-center">
      <h1 className="text-2xl font-bold">Veículo não encontrado</h1>
      <p className="mt-4 text-support-gray">Esse veículo já foi vendido ou não existe mais no nosso estoque.</p>
      <Link href="/estoque" className="mt-8 inline-block font-bold text-aguiar-red hover:underline">
        Ver todo o estoque
      </Link>
    </main>
  )
}
