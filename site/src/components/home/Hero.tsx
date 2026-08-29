import Link from 'next/link'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'

export function Hero() {
  return (
    <section className="flex flex-col items-start gap-6 bg-graphite px-6 py-24">
      <p className="text-sm font-bold uppercase tracking-widest text-aguiar-red">
        15 anos realizando sonhos sobre rodas
      </p>
      <h1 className="max-w-3xl text-5xl font-bold uppercase leading-tight text-white">
        Aguiar Veículos — sua confiança nos leva cada vez mais longe
      </h1>
      <p className="max-w-xl text-support-gray">
        Mais de 30 veículos novos e seminovos à pronta entrega em Presidente Dutra - MA,
        com procedência garantida e financiamento facilitado.
      </p>
      <div className="flex gap-4">
        <Link
          href="/estoque"
          className="inline-flex items-center justify-center rounded bg-aguiar-red px-6 py-3 font-bold uppercase text-white hover:bg-red-700"
        >
          Ver estoque
        </Link>
        <WhatsAppButton variant="outline" message="Olá! Vim pelo site da Aguiar Veículos e quero saber mais.">
          Falar no WhatsApp
        </WhatsAppButton>
      </div>
    </section>
  )
}
