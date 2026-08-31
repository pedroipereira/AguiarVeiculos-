'use client'

import { useState, type FormEvent } from 'react'
import { submitFinancingLead, submitTradeInLead } from '@/app/actions/leads'
import { buildWhatsAppUrl, buildFinancingMessage, buildTradeInMessage } from '@/lib/whatsapp'
import { financingLeadSchema, tradeInLeadSchema } from '@/lib/validation'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const inputClass =
  'rounded-md border border-support-gray/25 p-2.5 text-graphite transition-colors focus:border-aguiar-red focus:outline-none'
const numberInputClass = `${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`
const labelClass = 'text-sm font-bold'

export function FinanciamentoAvaliacao() {
  const [financingError, setFinancingError] = useState<string | null>(null)
  const [tradeInError, setTradeInError] = useState<string | null>(null)

  async function handleFinancingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const parsed = financingLeadSchema.safeParse({
      name: formData.get('name'),
      vehicleLabel: formData.get('vehicleLabel'),
      downPayment: formData.get('downPayment'),
      installments: formData.get('installments'),
    })
    if (!parsed.success) {
      setFinancingError('Preencha todos os campos para simular.')
      return
    }
    setFinancingError(null)
    await submitFinancingLead(parsed.data)
    window.location.href = buildWhatsAppUrl(buildFinancingMessage(parsed.data))
  }

  async function handleTradeInSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const parsed = tradeInLeadSchema.safeParse({
      name: formData.get('name'),
      model: formData.get('model'),
      year: formData.get('year'),
      mileageKm: formData.get('mileageKm'),
      observations: formData.get('observations') || undefined,
    })
    if (!parsed.success) {
      setTradeInError('Preencha todos os campos para avaliar seu carro.')
      return
    }
    setTradeInError(null)
    await submitTradeInLead(parsed.data)
    window.location.href = buildWhatsAppUrl(buildTradeInMessage(parsed.data))
  }

  return (
    <Section eyebrow="Facilitamos pra você" title="Financiamento e avaliação" tone="light" contained>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border border-support-gray/15 p-6 shadow-sm">
          <form onSubmit={handleFinancingSubmit} className="flex flex-col gap-4">
            <h3 className="text-lg font-bold">Simular financiamento</h3>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="financing-name" className={labelClass}>
                Nome
              </label>
              <input id="financing-name" name="name" placeholder="Ex: Maria Silva" className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="financing-vehicle-label" className={labelClass}>
                Carro de interesse
              </label>
              <input
                id="financing-vehicle-label"
                name="vehicleLabel"
                placeholder="Ex: Fiat Argo 2023"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="financing-down-payment" className={labelClass}>
                  Valor de entrada
                </label>
                <input
                  id="financing-down-payment"
                  name="downPayment"
                  placeholder="Ex: R$ 5.000"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="financing-installments" className={labelClass}>
                  Nº de parcelas
                </label>
                <input
                  id="financing-installments"
                  name="installments"
                  type="number"
                  placeholder="Ex: 48"
                  className={numberInputClass}
                />
              </div>
            </div>

            {financingError && <p className="text-sm text-aguiar-red">{financingError}</p>}
            <Button type="submit" className="mt-2 w-full">
              Simular financiamento
            </Button>
          </form>
        </Card>

        <Card className="rounded-xl border border-support-gray/15 p-6 shadow-sm">
          <form onSubmit={handleTradeInSubmit} className="flex flex-col gap-4">
            <h3 className="text-lg font-bold">Avaliar meu carro para troca</h3>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="trade-in-name" className={labelClass}>
                Nome
              </label>
              <input id="trade-in-name" name="name" placeholder="Ex: João Souza" className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="trade-in-model" className={labelClass}>
                Modelo do seu carro
              </label>
              <input id="trade-in-model" name="model" placeholder="Ex: Onix, HB20, Corolla..." className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="trade-in-year" className={labelClass}>
                  Ano do seu carro
                </label>
                <input
                  id="trade-in-year"
                  name="year"
                  type="number"
                  placeholder="Ex: 2019"
                  className={numberInputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="trade-in-mileage" className={labelClass}>
                  Km rodados
                </label>
                <input
                  id="trade-in-mileage"
                  name="mileageKm"
                  type="number"
                  placeholder="Ex: 60000"
                  className={numberInputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="trade-in-observations" className={labelClass}>
                Observações (opcional)
              </label>
              <textarea
                id="trade-in-observations"
                name="observations"
                placeholder="Ex: Único dono, revisões em dia, sem detalhes"
                rows={3}
                className={inputClass}
              />
            </div>

            {tradeInError && <p className="text-sm text-aguiar-red">{tradeInError}</p>}
            <Button type="submit" className="mt-2 w-full">
              Avaliar meu carro
            </Button>
          </form>
        </Card>
      </div>
    </Section>
  )
}
