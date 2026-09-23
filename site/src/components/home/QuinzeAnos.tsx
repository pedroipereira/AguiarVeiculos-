import Link from 'next/link'
import { Section, isLightTone, mutedTextClass, type SectionTone } from '@/components/ui/Section'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { buttonBase, buttonVariants } from '@/components/ui/buttonStyles'

const RAZOES = [
  {
    title: 'Maior estoque da região',
    text: 'Mais opções de carros e motos pra você escolher.',
  },
  {
    title: 'Garantia de 90 dias',
    text: 'Cobertura em motor e câmbio em todos os veículos.',
  },
  {
    title: 'Procedência clara',
    text: 'O veículo fica no nome da loja até a transferência pra você.',
  },
  {
    title: 'Financiamos em até 60x',
    text: 'Com mais de 10 bancos parceiros pra encontrar a melhor condição.',
  },
  {
    title: 'Aceitamos seu veículo',
    text: 'Carro ou moto como parte do pagamento, com entrada parcelável.',
  },
  {
    title: 'Toda a região do Maranhão',
    text: 'Atendemos além de Presidente Dutra.',
  },
]

// While the pointer is over the grid every panel dims; the one under it lifts, lights its border and keeps full color.
const SELECTABLE_PANEL =
  'group/item rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-300 group-hover:opacity-60 hover:!opacity-100 hover:-translate-y-1 hover:border-aguiar-red/60 hover:bg-white/[0.08] motion-reduce:transition-none motion-reduce:hover:translate-y-0'

const FALLBACK_IMAGE = '/images/fotos/showroom-fachada.jpg'

export function QuinzeAnos({ tone = 'dark', imageUrl }: { tone?: SectionTone; imageUrl?: string } = {}) {
  const muted = mutedTextClass(tone)
  return (
    <Section id="quinze-anos" eyebrow="Quem está por trás" title="Sobre a Aguiar Veículos" tone={tone} contained>
      <div className="flex flex-col items-start gap-10 lg:flex-row">
        {/* Photo comes from the CMS at an unknown size/crop, so next/image (which needs a real
            width+height or would force a crop via `fill`) doesn't fit without either guessing
            wrong or losing the "never distort/crop a photo" rule — plain <img> is the safe choice. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl ?? FALLBACK_IMAGE}
          alt="Antonio Aguiar, fundador da Aguiar Veículos"
          loading="lazy"
          decoding="async"
          className="w-full max-w-md rounded-2xl lg:w-5/12"
        />
        <div className="flex-1 space-y-4">
          <p className={muted}>
            Na Aguiar Veículos, cada carro é escolhido com cuidado para entregar mais do que
            qualidade: entregar tranquilidade em cada quilômetro.
          </p>
          <p className={muted}>
            Todos os veículos passam por seleção, revisão e higienização, permanecem em nome da
            loja até a transferência e contam com 90 dias de garantia para motor e câmbio — tudo
            para que sua escolha seja feita com tranquilidade, transparência e segurança.
          </p>
          <p className={muted}>
            Há mais de 15 anos no mesmo endereço em Presidente Dutra - MA, nossa trajetória é
            construída sobre transparência, atendimento próximo e veículos de procedência. Já
            fomos reconhecidos com diversos prêmios de melhor concessionária da região.
          </p>
          <p className="border-l-2 border-aguiar-red pl-4 text-lg font-bold italic">
            Seu próximo veículo merece uma escolha à altura.
          </p>
          <div className="pt-2">
            <div className="flex flex-wrap gap-4">
              <Link href="/estoque" className={`${buttonBase} ${buttonVariants.primary}`}>
                Ver estoque
              </Link>
              <WhatsAppButton
                variant={isLightTone(tone) ? 'outlineOnLight' : 'outline'}
                message="Olá! Vim pelo site da Aguiar Veículos e quero falar com vocês."
              >
                Fale conosco
              </WhatsAppButton>
            </div>
          </div>
        </div>
      </div>

      <div id="diferenciais" className="mt-14 scroll-mt-24">
        <h3 className="mb-6 text-2xl font-bold">Diferenciais</h3>
        <div className="group grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {RAZOES.map((item) => (
            <div
              key={item.title}
              data-testid="diferencial"
              className={`flex gap-3 ${tone === 'dark' ? SELECTABLE_PANEL : ''}`}
            >
              <span
                className={`mt-2 h-px shrink-0 bg-aguiar-red ${tone === 'dark' ? 'w-6 transition-all group-hover/item:w-10' : 'w-6'}`}
                aria-hidden="true"
              />
              <div>
                <p className="font-bold">{item.title}</p>
                <p className={`mt-1 text-sm ${muted}`}>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
