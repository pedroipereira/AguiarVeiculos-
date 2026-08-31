import Link from 'next/link'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { buttonBase, buttonVariants } from '@/components/ui/buttonStyles'

const FALLBACK_IMAGE = '/images/showroom-fachada.jpg'

export function Hero({ imageUrl }: { imageUrl?: string }) {
  return (
    <section className="relative flex min-h-[85vh] items-end overflow-hidden px-6 pb-16 pt-32">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl ?? FALLBACK_IMAGE}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-graphite/20 via-graphite/60 to-graphite/70" />
      <div className="relative z-10 mx-auto flex w-full max-w-[1156px] flex-col items-start gap-4">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-aguiar-red" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-widest text-white">
            Aguiar Veículos • Novos e Semi-Novos
          </p>
        </div>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight text-white">
          Compre seu próximo carro com quem entende de carros e, principalmente, de{' '}
          <span className="text-aguiar-red">confiança.</span>
        </h1>
        <p className="max-w-xl text-support-gray">
          Cada carro é escolhido com cuidado: passa por seleção, revisão e higienização,
          permanece em nome da loja até a transferência e conta com 90 dias de garantia para
          motor e câmbio. Tranquilidade em cada quilômetro rodado.
        </p>
        <div className="mt-2 flex gap-4">
          <Link href="/estoque" className={`${buttonBase} ${buttonVariants.primary}`}>
            Ver estoque
          </Link>
          <WhatsAppButton variant="outline" message="Olá! Vim pelo site da Aguiar Veículos e quero saber mais.">
            Falar no WhatsApp
          </WhatsAppButton>
        </div>
      </div>
    </section>
  )
}
