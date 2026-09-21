import type { Metadata } from 'next'
import { FinanciamentoAvaliacao } from '@/components/home/FinanciamentoAvaliacao'

export const metadata: Metadata = {
  title: 'Financiamento e avaliação do seu usado',
  description:
    'Simule seu financiamento ou avalie seu veículo usado para troca na Aguiar Veículos, em Presidente Dutra - MA. Condições facilitadas.',
  alternates: { canonical: '/financiamento' },
}

export default async function FinanciamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ carro?: string | string[] }>
}) {
  // The vehicle page links here with the car the visitor was looking at, so the form starts with it filled in.
  const { carro } = await searchParams
  const value = Array.isArray(carro) ? carro[0] : carro
  const defaultVehicle = value?.trim().slice(0, 80) || undefined

  return (
    <main className="pt-16">
      <FinanciamentoAvaliacao defaultVehicle={defaultVehicle} />
    </main>
  )
}
