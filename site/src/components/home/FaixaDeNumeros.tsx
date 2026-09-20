import { RevealOnScroll } from '@/components/ui/RevealOnScroll'

// Only numbers the site already states elsewhere (Sobre a Aguiar, Financiamento).
const NUMEROS = [
  { value: '15+', label: 'anos de mercado' },
  { value: '90 dias', label: 'de garantia em motor e câmbio' },
  { value: '60x', label: 'em financiamento, com bancos parceiros' },
  { value: '10+', label: 'bancos parceiros para você financiar' },
]

// One copy of the numbers is about 1400px wide. Each half of the track has two copies, so it is wider than
// any screen, and sliding exactly half the track loops without a jump.
const COPIES_PER_HALF = 2

export function FaixaDeNumeros() {
  const copies = Array.from({ length: COPIES_PER_HALF * 2 })

  return (
    <section
      aria-label="A Aguiar em números"
      className="overflow-hidden border-t border-white/10 bg-graphite py-6 text-white"
    >
      <RevealOnScroll>
        <div
          data-testid="faixa-track"
          className="flex w-max motion-safe:animate-marquee hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:px-6"
        >
          {copies.map((_, copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 0 ? undefined : true}
              className={`flex shrink-0 items-center ${copy === 0 ? '' : 'motion-reduce:hidden'}`}
            >
              {NUMEROS.map((item) => (
                <li key={item.label} className="flex items-baseline gap-3 whitespace-nowrap pl-10 pr-4 motion-reduce:pl-6">
                  <span className="text-3xl font-extrabold leading-none tracking-tight text-white md:text-4xl">{item.value}</span>
                  <span className="text-sm text-white/85 md:text-base">{item.label}</span>
                  <span className="ml-6 h-1.5 w-1.5 shrink-0 rotate-45 self-center bg-aguiar-red" aria-hidden="true" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </RevealOnScroll>
    </section>
  )
}
