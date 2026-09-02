'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPriceFromCents } from '@/lib/format'
import type { Vehicle, Lead } from '@/lib/types'
import { calculateEstimatedMarginCents, calculateRealizedMarginCents } from '@/lib/vehicle-costs'
import { daysInStock, hasMarginDefined } from '@/lib/vehicle-stock'
import { adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus } from '@/app/actions/vehicles'
import { VehicleSaleForm } from './VehicleSaleForm'
import { LeadQuickAddModal } from './LeadQuickAddModal'

interface VehicleSummaryPanelProps {
  vehicle: Vehicle
  imageUrls: string[]
  totalCostCents: number
  thresholdDays: number
  leads: Lead[]
}

export function VehicleSummaryPanel({ vehicle, imageUrls, totalCostCents, thresholdDays, leads }: VehicleSummaryPanelProps) {
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const days = daysInStock(vehicle)
  const isStale = vehicle.status === 'available' && days >= thresholdDays
  const marginDefined = hasMarginDefined(vehicle)
  const marginCents = vehicle.status === 'sold'
    ? calculateRealizedMarginCents(vehicle.sale_price_cents, totalCostCents)
    : calculateEstimatedMarginCents(vehicle.price_cents, totalCostCents)
  const discountCents = marginDefined ? vehicle.price_cents - vehicle.min_sale_price_cents! : 0

  return (
    <div>
      <Link href="/admin/veiculos" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-graphite hover:underline">
        ← Voltar ao estoque
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold uppercase">{vehicle.brand} {vehicle.model} {vehicle.version}</h1>
          <p className="text-sm text-support-gray">
            {vehicle.year_model} · {vehicle.mileage_km.toLocaleString('pt-BR')} km · {vehicle.color} · {vehicle.transmission} · {vehicle.fuel_type}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${isStale ? 'bg-aguiar-red text-white' : 'bg-card-gray text-graphite'}`}>
          {days} {days === 1 ? 'dia' : 'dias'} no estoque
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-support-gray/10">
            {imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrls[0]} alt={`${vehicle.brand} ${vehicle.model}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-support-gray">Sem foto</div>
            )}
          </div>

          {imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {imageUrls.slice(1).map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
              ))}
            </div>
          )}

          {vehicle.optionals.length > 0 && (
            <section className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-support-gray">Opcionais</h2>
              <div className="flex flex-wrap gap-2">
                {vehicle.optionals.map((optional) => (
                  <span key={optional} className="rounded-full bg-card-gray px-3 py-1 text-sm text-graphite">
                    {optional}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wide text-support-gray">Preço de tabela</span>
              <span className="text-xl font-bold">{formatPriceFromCents(vehicle.price_cents)}</span>
            </div>

            {marginDefined ? (
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-green-700">Preço mínimo de venda</p>
                <p className="text-2xl font-bold text-green-700">{formatPriceFromCents(vehicle.min_sale_price_cents!)}</p>
                <p className="mt-1 text-xs text-support-gray">
                  Até {formatPriceFromCents(discountCents)} de desconto. Não feche abaixo sem aprovação.
                </p>
              </div>
            ) : (
              <p className="rounded-lg bg-yellow-100 p-3 text-sm font-bold text-yellow-800">Margem ainda não definida</p>
            )}

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-support-gray">Visão do administrador</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-card-gray p-2">
                  <p className="text-xs text-support-gray">Desconto</p>
                  <p className="font-bold">{formatPriceFromCents(discountCents)}</p>
                </div>
                <div className="rounded-lg bg-card-gray p-2">
                  <p className="text-xs text-support-gray">Custo</p>
                  <p className="font-bold">{formatPriceFromCents(totalCostCents)}</p>
                </div>
                <div className="rounded-lg bg-card-gray p-2">
                  <p className="text-xs text-support-gray">{vehicle.status === 'sold' ? 'Lucro realizado' : 'Lucro'}</p>
                  <p className="font-bold text-green-700">{formatPriceFromCents(marginCents ?? 0)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/admin/veiculos/${vehicle.id}/editar#custos`}
                className="rounded-lg border border-support-gray/25 px-4 py-2.5 text-center text-sm font-bold text-graphite transition-colors hover:border-graphite"
              >
                Editar margem
              </Link>
              <Link
                href={`/admin/veiculos/${vehicle.id}/editar`}
                className="rounded-lg border border-support-gray/25 px-4 py-2.5 text-center text-sm font-bold text-graphite transition-colors hover:border-graphite"
              >
                Editar carro/foto
              </Link>
            </div>

            {vehicle.status !== 'sold' && (
              <button
                type="button"
                onClick={() => setShowLeadModal(true)}
                className="rounded-lg bg-aguiar-red px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                Registrar cliente / negociação
              </button>
            )}

            {showLeadModal && (
              <LeadQuickAddModal
                vehicles={[{
                  id: vehicle.id, brand: vehicle.brand, model: vehicle.model, version: vehicle.version,
                  status: vehicle.status, price_cents: vehicle.price_cents,
                }]}
                defaultVehicleId={vehicle.id}
                defaultStage="negociando"
                title="Registrar cliente / negociação"
                onClose={() => setShowLeadModal(false)}
              />
            )}

            {showSaleForm && (
              <VehicleSaleForm
                vehicleId={vehicle.id}
                leads={leads}
                onCancel={() => setShowSaleForm(false)}
                onSaved={() => setShowSaleForm(false)}
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              {vehicle.status === 'sold' ? (
                <button
                  type="button"
                  onClick={() => adminSetVehicleStatus(vehicle.id, 'available')}
                  className="rounded-lg bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 transition-colors hover:bg-green-100"
                >
                  Marcar como disponível
                </button>
              ) : (
                !showSaleForm && (
                  <button
                    type="button"
                    onClick={() => setShowSaleForm(true)}
                    className="rounded-lg bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 transition-colors hover:bg-green-100"
                  >
                    Marcar como vendido
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => { if (window.confirm('Excluir este veículo?')) adminDeleteVehicle(vehicle.id) }}
                className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-aguiar-red transition-colors hover:bg-red-100"
              >
                Remover carro
              </button>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-sm">
            {vehicle.status === 'available' && (
              <button type="button" onClick={() => adminSetVehicleStatus(vehicle.id, 'preparing')} className="text-support-gray hover:text-graphite">
                Marcar em preparação
              </button>
            )}
            {vehicle.status === 'preparing' && (
              <button type="button" onClick={() => adminSetVehicleStatus(vehicle.id, 'available')} className="text-support-gray hover:text-graphite">
                Marcar disponível
              </button>
            )}
            <button type="button" onClick={() => adminSetVehicleFeatured(vehicle.id, !vehicle.is_featured)} className="text-support-gray hover:text-graphite">
              {vehicle.is_featured ? 'Remover destaque' : 'Destacar no site'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
