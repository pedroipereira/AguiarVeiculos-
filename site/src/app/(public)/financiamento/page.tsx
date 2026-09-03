import type { Metadata } from 'next'
import { FinanciamentoAvaliacao } from '@/components/home/FinanciamentoAvaliacao'

export const metadata: Metadata = {
  title: 'Financiamento e avaliação do seu usado',
  description:
    'Simule seu financiamento ou avalie seu veículo usado para troca na Aguiar Veículos, em Presidente Dutra - MA. Condições facilitadas.',
  alternates: { canonical: '/financiamento' },
}

export default function FinanciamentoPage() {
  return (
    <main className="pt-16">
      <FinanciamentoAvaliacao />
    </main>
  )
}
