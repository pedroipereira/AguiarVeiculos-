import { z } from 'zod'
import { VEHICLE_OPTIONALS } from './vehicle-optionals'

export const vehicleExpenseSchema = z
  .object({
    category: z.enum(['pintura', 'lavagem_higienizacao', 'mecanica', 'documentacao', 'funilaria', 'outros']),
    description: z.string().optional(),
    amountCents: z.coerce.number().int().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.category === 'outros' && !value.description?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['description'], message: 'Descrição é obrigatória para categoria "Outros"' })
    }
  })
export type VehicleExpenseFormValues = z.infer<typeof vehicleExpenseSchema>

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
  acquisitionCostCents: z.coerce.number().int().min(0).optional(),
  minSalePriceCents: z.coerce.number().int().min(0).optional(),
  expenses: z.array(vehicleExpenseSchema).optional().default([]),
  acquiredAt: z.string().optional(),
  fipeBrandCode: z.string().optional(),
  fipeModelCode: z.string().optional(),
  fipeYearCode: z.string().optional(),
  fipeValueCents: z.coerce.number().int().min(0).optional(),
  fipeFetchedAt: z.string().optional(),
  optionals: z.array(z.enum(VEHICLE_OPTIONALS)).optional().default([]),
})
export type VehicleFormValues = z.infer<typeof vehicleFormSchema>

export const markVehicleSoldSchema = z.object({
  salePriceCents: z.coerce.number().int().min(0, 'Preço de venda não pode ser negativo'),
  soldAt: z.string().min(1, 'Informe a data da venda'),
  buyerLeadId: z.string().uuid().optional(),
})
export type MarkVehicleSoldValues = z.infer<typeof markVehicleSoldSchema>

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

export const manualLeadSchema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  phone: z.string().min(1, 'Informe o telefone'),
  vehicleId: z.string().uuid().optional(),
  stage: z.enum(['novo', 'visita_marcada', 'negociando', 'ligar_de_volta', 'vendeu', 'nao_comprou']).optional(),
  notes: z.string().optional(),
  firstContactAt: z.string().optional(),
  storeVisitAt: z.string().optional(),
  scheduledVisitDate: z.string().optional(),
  scheduledVisitTime: z.string().optional(),
  callbackAt: z.string().optional(),
  callbackTime: z.string().optional(),
})
export type ManualLeadValues = z.infer<typeof manualLeadSchema>
