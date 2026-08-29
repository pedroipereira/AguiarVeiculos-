export function formatPriceFromCents(cents: number): string {
  const reais = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(reais).replace('R$', 'R$ ').replace(/\s+/, ' ')
}

export function buildVehicleSlug(brand: string, model: string, yearModel: number, idFragment: string): string {
  const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${slugify(brand)}-${slugify(model)}-${yearModel}-${idFragment}`
}
