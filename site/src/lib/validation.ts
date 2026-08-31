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
  engine: z.string().optional(),
  fuelTankLiters: z.coerce.number().int().min(0).optional(),
  seatingCapacity: z.coerce.number().int().min(0).optional(),
  bodyType: z.string().optional(),
  doors: z.coerce.number().int().min(0).optional(),
  horsepower: z.coerce.number().int().min(0).optional(),
  plate: z.string().optional(),
  isFeatured: z.boolean().optional(),
})
export type VehicleFormValues = z.infer<typeof vehicleFormSchema>

export const financingLeadSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  vehicleId: z.string().uuid().optional(),
  vehicleLabel: z.string().min(1, 'Informe o carro de interesse'),
  downPayment: z.string().min(1, 'Informe o valor de entrada'),
  installments: z.coerce.number().int().min(1, 'Informe o número de parcelas'),
})
export type FinancingLeadValues = z.infer<typeof financingLeadSchema>

export const tradeInLeadSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  year: z.coerce.number().int().min(1990).max(2100),
  mileageKm: z.coerce.number().int().min(0),
  observations: z.string().optional(),
})
export type TradeInLeadValues = z.infer<typeof tradeInLeadSchema>
