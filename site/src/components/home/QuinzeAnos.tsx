import { Section } from '@/components/ui/Section'

export function QuinzeAnos() {
  return (
    <Section eyebrow="Quem está por trás" title="15 anos realizando sonhos sobre rodas">
      <div className="flex flex-col items-center gap-8 lg:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/antonio-aguiar.jpg"
          alt="Antonio Aguiar, fundador da Aguiar Veículos"
          className="w-full max-w-sm rounded-lg lg:w-1/3"
        />
        <p className="max-w-xl text-support-gray">
          Há mais de 15 anos, Antonio Aguiar construiu a Aguiar Veículos em Presidente Dutra - MA
          com um compromisso simples: procedência, confiança e compromisso em cada venda. Hoje a
          loja atende famílias de toda a região do interior do Maranhão, sempre tratando cada carro
          vendido como um sonho realizado.
        </p>
      </div>
    </Section>
  )
}
