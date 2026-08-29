import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'

const ITEMS = [
  { title: 'Procedência garantida', text: 'Todo veículo passa por checagem de procedência antes de entrar no estoque.' },
  { title: 'Financiamento em até 60x', text: 'Parcelamos sua entrada e financiamos em até 60 vezes.' },
  { title: 'Mais de 10 bancos parceiros', text: 'Trabalhamos com mais de 10 bancos para aumentar sua chance de aprovação.' },
  { title: 'Aceita seu carro ou moto na troca', text: 'Recebemos seu usado como parte do pagamento.' },
  { title: 'Revisados e higienizados', text: 'Veículos revisados, higienizados e com garantia.' },
]

export function Diferenciais() {
  return (
    <Section eyebrow="Por que comprar com a gente" title="Diferenciais Aguiar Veículos">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ITEMS.map((item) => (
          <Card key={item.title}>
            <p className="font-bold uppercase">{item.title}</p>
            <p className="mt-2 text-sm text-support-gray">{item.text}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
