/**
 * Fixed catalog of vehicle equipment/optionals — content only, no migration
 * needed to add or rename an item. Rendered as pills in VehicleOptionalsPicker.
 */
export const VEHICLE_OPTIONALS = [
  'Ar condicionado', 'Ar digital', 'Direção elétrica', 'Direção hidráulica',
  'Vidros elétricos', 'Travas elétricas', 'Retrovisores elétricos', 'Câmera de ré',
  'Sensor de estacionamento', 'Sensor de chuva', 'Central multimídia', 'Bluetooth',
  'GPS/Navegador', 'Banco de couro', 'Bancos aquecidos', 'Teto solar', 'Teto panorâmico',
  'Rodas de liga leve', 'Airbag duplo', 'Airbag lateral', 'ABS', 'Controle de tração',
  'Controle de estabilidade', 'Piloto automático', 'Freio a disco nas 4 rodas',
  'Volante multifuncional', 'Keyless Entry/Start', 'Computador de bordo',
  'Start/Stop automático', 'Carregador wireless', 'Apple CarPlay/Android Auto',
  'Kit multimídia original', '4x4/AWD/Tração integral', 'Blindagem', 'GNV instalado',
] as const

export type VehicleOptional = (typeof VEHICLE_OPTIONALS)[number]

export function isValidOptional(value: string): value is VehicleOptional {
  return (VEHICLE_OPTIONALS as readonly string[]).includes(value)
}
