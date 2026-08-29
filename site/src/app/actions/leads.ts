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
    phone: values.phone,
    details: { vehicleLabel: values.vehicleLabel ?? null, downPayment: values.downPayment ?? null },
    vehicleId: values.vehicleId,
  })
}

export async function submitTradeInLead(input: TradeInLeadValues) {
  const values = tradeInLeadSchema.parse(input)
  const client = await createServerSupabaseClient()
  return createLead(client, {
    type: 'trade_in',
    name: values.name,
    phone: values.phone,
    details: { brand: values.brand, model: values.model, year: values.year, mileageKm: values.mileageKm },
  })
}
