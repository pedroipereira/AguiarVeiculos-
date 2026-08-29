import { z } from 'zod'

export const vehicleFormSchema = z.object({
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  version: z.string().optional(),
  yearModel: z.coerce.number().int().min(1990).max(2100),
  yearFabrication: z.coerce.number().int().min(1990).max(2100),
  mileageKm: z.coerce.number().int().min(0),
  priceCents: z.coerce.number().int().min(0, 'Preço não pode ser negativo'),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  plate: z.string().optional(),
})
export type VehicleFormValues = z.infer<typeof vehicleFormSchema>

export const financingLeadSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  phone: z.string().min(8, 'Informe um telefone válido'),
  vehicleId: z.string().uuid().optional(),
  vehicleLabel: z.string().optional(),
  downPayment: z.string().optional(),
})
export type FinancingLeadValues = z.infer<typeof financingLeadSchema>

export const tradeInLeadSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  phone: z.string().min(8, 'Informe um telefone válido'),
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  year: z.coerce.number().int().min(1990).max(2100),
  mileageKm: z.coerce.number().int().min(0),
})
export type TradeInLeadValues = z.infer<typeof tradeInLeadSchema>
