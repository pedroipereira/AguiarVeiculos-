'use client'

import { useState, type FormEvent } from 'react'
import { submitFinancingLead, submitTradeInLead } from '@/app/actions/leads'
import { buildWhatsAppUrl, buildFinancingMessage, buildTradeInMessage } from '@/lib/whatsapp'
import { financingLeadSchema, tradeInLeadSchema } from '@/lib/validation'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function FinanciamentoAvaliacao() {
  const [financingError, setFinancingError] = useState<string | null>(null)
  const [tradeInError, setTradeInError] = useState<string | null>(null)

  async function handleFinancingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const parsed = financingLeadSchema.safeParse({
      name: formData.get('name'),
      phone: formData.get('phone'),
      downPayment: formData.get('downPayment') || undefined,
    })
    if (!parsed.success) {
      setFinancingError('Preencha nome e telefone para simular.')
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
      phone: formData.get('phone'),
      brand: formData.get('brand'),
      model: formData.get('model'),
      year: formData.get('year'),
      mileageKm: formData.get('mileageKm'),
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
    <Section eyebrow="Facilita pra você" title="Financiamento e avaliação">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={handleFinancingSubmit} className="flex flex-col gap-3">
            <h3 className="font-bold uppercase">Simular financiamento</h3>
            <label htmlFor="financing-name">Nome (financiamento)</label>
            <input id="financing-name" name="name" className="rounded border p-2" />
            <label htmlFor="financing-phone">Telefone (financiamento)</label>
            <input id="financing-phone" name="phone" className="rounded border p-2" />
            <label htmlFor="financing-down-payment">Entrada disponível (opcional)</label>
            <input id="financing-down-payment" name="downPayment" className="rounded border p-2" />
            {financingError && <p className="text-aguiar-red">{financingError}</p>}
            <Button type="submit">Simular financiamento</Button>
          </form>
        </Card>
        <Card>
          <form onSubmit={handleTradeInSubmit} className="flex flex-col gap-3">
            <h3 className="font-bold uppercase">Avaliar meu carro para troca</h3>
            <label htmlFor="trade-in-name">Nome (avaliação)</label>
            <input id="trade-in-name" name="name" className="rounded border p-2" />
            <label htmlFor="trade-in-phone">Telefone (avaliação)</label>
            <input id="trade-in-phone" name="phone" className="rounded border p-2" />
            <label htmlFor="trade-in-brand">Marca do seu carro</label>
            <input id="trade-in-brand" name="brand" className="rounded border p-2" />
            <label htmlFor="trade-in-model">Modelo do seu carro</label>
            <input id="trade-in-model" name="model" className="rounded border p-2" />
            <label htmlFor="trade-in-year">Ano do seu carro</label>
            <input id="trade-in-year" name="year" type="number" className="rounded border p-2" />
            <label htmlFor="trade-in-mileage">Km rodados</label>
            <input id="trade-in-mileage" name="mileageKm" type="number" className="rounded border p-2" />
            {tradeInError && <p className="text-aguiar-red">{tradeInError}</p>}
            <Button type="submit">Avaliar meu carro</Button>
          </form>
        </Card>
      </div>
    </Section>
  )
}
