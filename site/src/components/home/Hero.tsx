import Link from 'next/link'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { buttonBase, buttonVariants } from '@/components/ui/buttonStyles'
import { focalOffset, parseFocalX } from '@/lib/focal-point'

const FALLBACK_IMAGE = '/images/fotos/showroom-fachada.jpg'

export function Hero({ imageUrl }: { imageUrl?: string }) {
  const focalX = focalOffset(parseFocalX(imageUrl))
  return (
    <section className="relative flex flex-col overflow-hidden px-6 pb-16 md:min-h-[85vh] md:justify-end md:pt-32">
      {/* On a phone the photo is a square block at the top, wide enough for both signs and the cars, so
          nothing is zoomed; from the tablet up it fills the whole section behind the text. The point of the
          photo that must stay in view comes from its file name (see `lib/focal-point`). */}
      <div
        className="relative -mx-6 aspect-square [container-type:size] md:absolute md:inset-0 md:mx-0 md:aspect-auto"
        style={focalX ? ({ '--focal-x': focalX } as React.CSSProperties) : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl ?? FALLBACK_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[var(--focal-x,center)_50%] md:object-[var(--focal-x,center)_38%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-graphite/30 via-transparent to-transparent md:from-graphite/20 md:via-graphite/60 md:to-graphite/70" />
        {/* Blends the bottom edge of the photo into the page black under it. */}
        <div
          data-testid="hero-fade"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-graphite md:h-28"
        />
      </div>
      <div className="relative z-10 mx-auto -mt-24 flex w-full max-w-[1156px] flex-col items-start gap-4 md:mt-0">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-aguiar-red" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-widest text-white">
            Aguiar Veículos • Novos e Seminovos
          </p>
        </div>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl">
          Compre seu próximo carro com quem entende de carros e, principalmente, de{' '}
          <span className="text-aguiar-red">confiança.</span>
        </h1>
        <p className="max-w-xl text-white/90">
          Cada carro é escolhido com cuidado: passa por seleção, revisão e higienização,
          permanece em nome da loja até a transferência e conta com 90 dias de garantia para
          motor e câmbio. Tranquilidade em cada quilômetro rodado.
        </p>
        <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Link href="/estoque" className={`${buttonBase} ${buttonVariants.primary} w-full sm:w-auto`}>
            Ver estoque
          </Link>
          <WhatsAppButton
            variant="outline"
            className="w-full sm:w-auto"
            message="Olá! Vim pelo site da Aguiar Veículos e quero saber mais."
          >
            Falar no WhatsApp
          </WhatsAppButton>
        </div>
      </div>
    </section>
  )
}
