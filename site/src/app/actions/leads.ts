'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/actions/assert-admin'
import { createLead } from '@/lib/actions/leads'
import {
  financingLeadSchema,
  tradeInLeadSchema,
  manualLeadSchema,
  type FinancingLeadValues,
  type TradeInLeadValues,
  type ManualLeadValues,
} from '@/lib/validation'

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

export async function adminCreateManualLead(input: ManualLeadValues) {
  const values = manualLeadSchema.parse(input)
  const client = await createServerSupabaseClient()
  await assertAdmin(client)
  await createLead(client, {
    type: 'manual',
    name: values.name,
    phone: values.phone,
    details: {},
    vehicleId: values.vehicleId,
    stage: values.stage,
    firstContactAt: values.firstContactAt,
    storeVisitAt: values.storeVisitAt,
    scheduledVisitDate: values.scheduledVisitDate,
    scheduledVisitTime: values.scheduledVisitTime,
  })
  revalidatePath('/admin/leads')
}
