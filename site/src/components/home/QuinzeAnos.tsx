import Link from 'next/link'
import { Section, type SectionTone } from '@/components/ui/Section'
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

const FALLBACK_IMAGE = '/images/showroom-fachada.jpg'

export function QuinzeAnos({ tone, imageUrl }: { tone?: SectionTone; imageUrl?: string } = {}) {
  return (
    <Section id="quinze-anos" eyebrow="Quem está por trás" title="Sobre a Aguiar Veículos" tone={tone} contained>
      <div className="flex flex-col items-start gap-10 lg:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl ?? FALLBACK_IMAGE}
          alt="Antonio Aguiar, fundador da Aguiar Veículos"
          className="w-full max-w-sm rounded-lg lg:w-1/3"
        />
        <div className="flex-1 space-y-4">
          <p className="text-support-gray">
            Na Aguiar Veículos, cada carro é escolhido com cuidado para entregar mais do que
            qualidade: entregar tranquilidade em cada quilômetro.
          </p>
          <p className="text-support-gray">
            Todos os veículos passam por seleção, revisão e higienização, permanecem em nome da
            loja até a transferência e contam com 90 dias de garantia para motor e câmbio — tudo
            para que sua escolha seja feita com tranquilidade, transparência e segurança.
          </p>
          <p className="text-support-gray">
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
                variant="outline"
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
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {RAZOES.map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="mt-2 h-px w-6 shrink-0 bg-aguiar-red" aria-hidden="true" />
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="mt-1 text-sm text-support-gray">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
