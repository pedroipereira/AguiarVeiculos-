import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getVehicleBySlug, getRelatedVehicles } from '@/lib/queries/vehicles'
import { getVehicleImages, getPrimaryImageUrlsByVehicleIds, getImageCountsByVehicleIds } from '@/lib/queries/vehicle-images'
import { getPublicImageUrl } from '@/lib/storage'
import { formatPriceFromCents } from '@/lib/format'
import { resolveColorHex } from '@/lib/colors'
import { buildWhatsAppUrl, buildVehicleInterestMessage, buildVehicleLabel } from '@/lib/whatsapp'
import { buildVehicleTitle, buildVehicleDescription, buildVehicleJsonLd } from '@/lib/seo'
import { VehicleGallery } from '@/components/catalog/VehicleGallery'
import { VehicleCard } from '@/components/catalog/VehicleCard'
import { VehicleOptionalsList } from '@/components/catalog/VehicleOptionalsList'
import { VehicleTrustList } from '@/components/catalog/VehicleTrustList'
import { VehicleStickyBar } from '@/components/catalog/VehicleStickyBar'
import { JsonLd } from '@/components/seo/JsonLd'

interface VehicleDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: VehicleDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const client = await createServerSupabaseClient()
  const vehicle = await getVehicleBySlug(client, slug)
  if (!vehicle) return {}

  const imageUrls = await getPrimaryImageUrlsByVehicleIds(client, [vehicle.id])
  const imageUrl = imageUrls[vehicle.id]
  const title = buildVehicleTitle(vehicle)
  const description = buildVehicleDescription(vehicle)

  return {
    title,
    description,
    alternates: { canonical: `/estoque/${vehicle.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 900, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

/** Groups a flat list into rows of `size`, padding the last row with nulls. */
function toRows<T>(items: T[], size: number): (T | null)[][] {
  const rows: (T | null)[][] = []
  for (let i = 0; i < items.length; i += size) {
    const row = items.slice(i, i + size)
    while (row.length < size) row.push(null as unknown as T)
    rows.push(row)
  }
  return rows
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { slug } = await params
  const client = await createServerSupabaseClient()
  const vehicle = await getVehicleBySlug(client, slug)

  if (!vehicle) notFound()

  const images = await getVehicleImages(client, vehicle.id)
  const imageUrls = images.map((image) => getPublicImageUrl(client, 'vehicle-images', image.storage_path))
  const label = [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(' ')

  const relatedVehicles = await getRelatedVehicles(client, vehicle.id)
  const relatedIds = relatedVehicles.map((v) => v.id)
  const [relatedImageUrls, relatedImageCounts] = await Promise.all([
    getPrimaryImageUrlsByVehicleIds(client, relatedIds),
    getImageCountsByVehicleIds(client, relatedIds),
  ])

  const whatsappUrl = buildWhatsAppUrl(buildVehicleInterestMessage(vehicle))
  const financingHref = `/financiamento?${new URLSearchParams({ carro: buildVehicleLabel(vehicle) })}`

  const highlights = [
    {
      label: 'Ano',
      value: `${vehicle.year_model}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
    },
    {
      label: 'Quilometragem',
      value: `${vehicle.mileage_km.toLocaleString('pt-BR')} km`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path strokeLinecap="round" d="M4 15a8 8 0 1 1 16 0" />
          <path strokeLinecap="round" d="M12 15l3-4" />
        </svg>
      ),
    },
    {
      label: 'Câmbio',
      value: vehicle.transmission ?? '—',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <circle cx="12" cy="12" r="3" />
          <path
            strokeLinecap="round"
            d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
          />
        </svg>
      ),
    },
    {
      label: 'Combustível',
      value: vehicle.fuel_type ?? '—',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 22h12M4 9h10M6 4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v18H6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 13h2a2 2 0 0 1 2 2v2a1.5 1.5 0 0 0 3 0V9.8a2 2 0 0 0-.6-1.42L18 6" />
          <circle cx="8" cy="5.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      label: 'Cor',
      value: vehicle.color ?? '—',
      swatchHex: resolveColorHex(vehicle.color),
      fullWidth: true,
    },
  ]

  // Kept separate from `highlights` above so nothing appears twice on the page.
  const technicalSheet = [
    { label: 'Marca', value: vehicle.brand },
    { label: 'Modelo', value: vehicle.model },
    { label: 'Versão', value: vehicle.version ?? '—' },
    ...(vehicle.engine ? [{ label: 'Motor', value: vehicle.engine }] : []),
    ...(vehicle.fuel_tank_liters != null ? [{ label: 'Tanque de combustível', value: `${vehicle.fuel_tank_liters} L` }] : []),
    ...(vehicle.seating_capacity != null ? [{ label: 'Quantidade de pessoas', value: `${vehicle.seating_capacity}` }] : []),
    ...(vehicle.body_type ? [{ label: 'Tipo de carroceria', value: vehicle.body_type }] : []),
    ...(vehicle.doors != null ? [{ label: 'Portas', value: `${vehicle.doors}` }] : []),
    ...(vehicle.horsepower != null ? [{ label: 'Potência', value: `${vehicle.horsepower} cv` }] : []),
  ]

  return (
    <main className="bg-graphite px-6 pb-28 pt-32 text-white md:pb-16">
      <JsonLd data={buildVehicleJsonLd(vehicle, imageUrls[0])} />
      <div className="mx-auto max-w-[1156px]">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
          <VehicleGallery images={imageUrls} label={label} />

          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-aguiar-red" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/85">
                {vehicle.brand} • {vehicle.year_model}
              </p>
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">
              {vehicle.brand} {vehicle.model} {vehicle.version}
            </h1>

            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-white/85">Valor</p>
            <p className="text-4xl font-bold md:text-5xl">{formatPriceFromCents(vehicle.price_cents)}</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm text-white/90">
              {['Financiamento em até 60x', 'Aceitamos seu usado na troca'].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 shrink-0 text-aguiar-red-light" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {highlights.map((spec) => (
                <div
                  key={spec.label}
                  className={`flex min-w-0 items-center gap-2.5 rounded-2xl bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.08] sm:gap-3 sm:p-3.5 ${
                    spec.fullWidth ? 'col-span-2' : ''
                  }`}
                >
                  {spec.swatchHex ? (
                    <div
                      className="h-10 w-10 shrink-0 rounded-xl border border-white/20 sm:h-11 sm:w-11"
                      style={{ backgroundColor: spec.swatchHex }}
                      aria-hidden="true"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aguiar-red/15 text-aguiar-red-light sm:h-11 sm:w-11">
                      {spec.icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs text-white/85">{spec.label}</p>
                    <p className="break-words font-bold">{spec.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div id="vehicle-cta" className="mt-6 flex flex-col gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-aguiar-red px-6 py-3.5 text-center font-bold text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.148-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.148.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"
                />
              </svg>
                Falar com um vendedor
              </a>
              <Link
                href={financingHref}
                className="flex min-h-12 items-center justify-center rounded-full border-2 border-white/80 px-6 py-3 text-center font-bold text-white transition-colors hover:bg-white hover:text-graphite focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Simular financiamento
              </Link>
            </div>

            <VehicleTrustList />
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-10">
          <h2 className="text-2xl font-bold">Ficha técnica</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            {toRows(technicalSheet, 2).map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={`grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 ${
                  rowIndex % 2 === 0 ? 'bg-white/[0.04]' : 'bg-transparent'
                } ${rowIndex > 0 ? 'border-t border-white/10' : ''}`}
              >
                {row.map((item, cellIndex) =>
                  item ? (
                    <div key={item.label} className="flex items-center justify-between gap-4 px-4 py-3.5">
                      <dt className="text-white/85">{item.label}</dt>
                      <dd className="font-bold">{item.value}</dd>
                    </div>
                  ) : (
                    <div key={cellIndex} data-testid="ficha-empty-cell" className="hidden px-4 py-3.5 sm:block" />
                  ),
                )}
              </div>
            ))}
          </div>

          {vehicle.optionals.length > 0 && (
            <div className="mt-10">
              <h2 className="text-2xl font-bold">Equipamentos e opcionais</h2>
              <div className="mt-4">
                <VehicleOptionalsList optionals={vehicle.optionals} />
              </div>
            </div>
          )}

          {vehicle.description && (
            <div className="mt-10">
              <h2 className="text-2xl font-bold">Descrição</h2>
              <p className="mt-4 max-w-2xl whitespace-pre-line text-base leading-relaxed text-white/90 md:text-lg">{vehicle.description}</p>
            </div>
          )}
        </div>

        {relatedVehicles.length > 0 && (
          <div className="mt-14 border-t border-white/10 pt-10">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Outros carros disponíveis</h2>
              <Link
                href="/estoque"
                className="shrink-0 whitespace-nowrap rounded-full border border-white/25 px-5 py-2 text-sm font-bold transition-colors hover:border-aguiar-red hover:text-aguiar-red-light"
              >
                Ver todos
              </Link>
            </div>
            <div data-testid="related-vehicles" className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {relatedVehicles.map((related) => (
                <VehicleCard
                  key={related.id}
                  vehicle={related}
                  imageUrl={relatedImageUrls[related.id]}
                  photoCount={relatedImageCounts[related.id]}
                  surface="dark"
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <VehicleStickyBar price={formatPriceFromCents(vehicle.price_cents)} whatsappUrl={whatsappUrl} targetId="vehicle-cta" />
    </main>
  )
}
