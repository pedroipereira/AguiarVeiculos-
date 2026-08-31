import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Section, type SectionTone } from '@/components/ui/Section'
import { buttonBase, buttonVariants } from '@/components/ui/buttonStyles'

const OPCOES = [
  {
    title: 'Simular financiamento',
    text: 'Em até 60x, com mais de 10 bancos parceiros pra encontrar a condição que cabe no seu bolso.',
    cta: 'Simular agora',
    accent: 'hover:border-t-aguiar-red',
  },
  {
    title: 'Avaliar meu usado',
    text: 'Avaliamos seu carro ou moto na hora e usamos o valor como entrada na troca.',
    cta: 'Avaliar meu carro',
    accent: 'hover:border-t-graphite',
  },
]

export function FinanciamentoTeaser({ tone }: { tone?: SectionTone } = {}) {
  return (
    <Section eyebrow="Facilitamos pra você" title="Financiamento e avaliação de usados" tone={tone} contained>
      <p className="max-w-xl text-support-gray">
        Duas formas rápidas de dar o próximo passo — sem compromisso.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {OPCOES.map((item) => (
          <Card
            key={item.title}
            className={`flex flex-col gap-3 border-t-4 border-t-transparent transition-colors ${item.accent}`}
          >
            <p className="text-lg font-bold">{item.title}</p>
            <p className="flex-1 text-sm text-support-gray">{item.text}</p>
            <Link href="/financiamento" className={`${buttonBase} ${buttonVariants.primary} self-start`}>
              {item.cta}
            </Link>
          </Card>
        ))}
      </div>
    </Section>
  )
}
