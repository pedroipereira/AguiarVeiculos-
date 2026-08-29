import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Hero } from '@/components/home/Hero'
import { Diferenciais } from '@/components/home/Diferenciais'
import { EstoqueDestaque } from '@/components/home/EstoqueDestaque'
import { FinanciamentoAvaliacao } from '@/components/home/FinanciamentoAvaliacao'
import { Depoimentos } from '@/components/home/Depoimentos'
import { PorQueAguiar } from '@/components/home/PorQueAguiar'
import { QuinzeAnos } from '@/components/home/QuinzeAnos'
import { Galeria } from '@/components/home/Galeria'
import { Contato } from '@/components/home/Contato'

export default async function Home() {
  const client = await createServerSupabaseClient()

  const estoqueDestaque = await EstoqueDestaque({ client })
  const depoimentos = await Depoimentos({ client })
  const contato = await Contato({ client })

  return (
    <main>
      <Hero />
      <Diferenciais />
      {estoqueDestaque}
      <FinanciamentoAvaliacao />
      {depoimentos}
      <PorQueAguiar />
      <QuinzeAnos />
      <Galeria />
      {contato}
    </main>
  )
}
