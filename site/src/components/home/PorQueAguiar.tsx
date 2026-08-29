import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'

const PILLARS = [
  { title: 'Procedência e transparência', text: 'Nunca escondemos a história do veículo — você compra sabendo exatamente o que está levando.' },
  { title: 'Financiamento facilitado', text: 'Parceria com mais de 10 bancos pra você sair de carro novo sem enrolação.' },
  { title: 'Clientes que voltam', text: 'A maior parte da nossa clientela chega por indicação de quem já comprou com a gente.' },
]

export function PorQueAguiar() {
  return (
    <Section eyebrow="Nossa essência" title="Por que a Aguiar Veículos">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <Card key={pillar.title}>
            <p className="font-bold uppercase">{pillar.title}</p>
            <p className="mt-2 text-sm text-support-gray">{pillar.text}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
