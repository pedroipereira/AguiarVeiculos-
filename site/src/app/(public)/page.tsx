import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSiteImageUrls } from '@/lib/queries/site-images'
import { Hero } from '@/components/home/Hero'
import { EstoqueDestaque } from '@/components/home/EstoqueDestaque'
import { Depoimentos } from '@/components/home/Depoimentos'
import { QuinzeAnos } from '@/components/home/QuinzeAnos'
import { Galeria } from '@/components/home/Galeria'
import { FinanciamentoTeaser } from '@/components/home/FinanciamentoTeaser'
import { Contato } from '@/components/home/Contato'

export default async function Home() {
  const client = await createServerSupabaseClient()

  const [heroImages, galeriaImages, sobreImages] = await Promise.all([
    getSiteImageUrls(client, 'hero'),
    getSiteImageUrls(client, 'galeria'),
    getSiteImageUrls(client, 'sobre'),
  ])

  const estoqueDestaque = await EstoqueDestaque({ client, tone: 'light' })
  const depoimentos = await Depoimentos({ client, tone: 'dark' })
  const contato = await Contato({ client, tone: 'dark' })

  return (
    <main>
      <Hero imageUrl={heroImages[0]} />
      {estoqueDestaque}
      <FinanciamentoTeaser tone="light" />
      <QuinzeAnos tone="dark" imageUrl={sobreImages[0]} />
      <Galeria photos={galeriaImages} />
      {depoimentos}
      {contato}
    </main>
  )
}
