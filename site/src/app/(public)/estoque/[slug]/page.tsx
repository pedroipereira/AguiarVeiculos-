import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getVehicleBySlug } from '@/lib/queries/vehicles'
import { formatPriceFromCents } from '@/lib/format'
import { buildWhatsAppUrl, buildVehicleInterestMessage } from '@/lib/whatsapp'

interface VehicleDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { slug } = await params
  const client = await createServerSupabaseClient()
  const vehicle = await getVehicleBySlug(client, slug)

  if (!vehicle) notFound()

  return (
    <main className="px-6 py-16">
      <h1 className="text-3xl font-bold uppercase">
        {vehicle.brand} {vehicle.model} {vehicle.version}
      </h1>
      <p className="mt-2 text-2xl font-bold text-aguiar-red">{formatPriceFromCents(vehicle.price_cents)}</p>
      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div><dt className="text-support-gray">Ano</dt><dd>{vehicle.year_model}/{vehicle.year_fabrication}</dd></div>
        <div><dt className="text-support-gray">Km</dt><dd>{vehicle.mileage_km.toLocaleString('pt-BR')}</dd></div>
        <div><dt className="text-support-gray">Combustível</dt><dd>{vehicle.fuel_type ?? '—'}</dd></div>
        <div><dt className="text-support-gray">Câmbio</dt><dd>{vehicle.transmission ?? '—'}</dd></div>
        <div><dt className="text-support-gray">Cor</dt><dd>{vehicle.color ?? '—'}</dd></div>
      </dl>
      {vehicle.description && <p className="mt-6 max-w-2xl text-support-gray">{vehicle.description}</p>}
      <a
        href={buildWhatsAppUrl(buildVehicleInterestMessage(vehicle))}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex rounded bg-aguiar-red px-6 py-3 font-bold uppercase text-white hover:bg-red-700"
      >
        Tenho interesse
      </a>
    </main>
  )
}
