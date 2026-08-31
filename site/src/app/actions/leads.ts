'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createLead } from '@/lib/actions/leads'
import { financingLeadSchema, tradeInLeadSchema, type FinancingLeadValues, type TradeInLeadValues } from '@/lib/validation'

export async function submitFinancingLead(input: FinancingLeadValues) {
  const values = financingLeadSchema.parse(input)
  const client = await createServerSupabaseClient()
  return createLead(client, {
    type: 'financing',
    name: values.name,
    // The form no longer collects a phone number — the customer's real contact
    // reaches the dealer natively through the WhatsApp message itself.
    phone: '',
    details: {
      vehicleLabel: values.vehicleLabel,
      downPayment: values.downPayment,
      installments: values.installments,
    },
    vehicleId: values.vehicleId,
  })
}

export async function submitTradeInLead(input: TradeInLeadValues) {
  const values = tradeInLeadSchema.parse(input)
  const client = await createServerSupabaseClient()
  return createLead(client, {
    type: 'trade_in',
    name: values.name,
    // The form no longer collects a phone number — the customer's real contact
    // reaches the dealer natively through the WhatsApp message itself.
    phone: '',
    details: { model: values.model, year: values.year, mileageKm: values.mileageKm, observations: values.observations ?? null },
  })
}
