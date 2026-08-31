'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPriceFromCents } from '@/lib/format'
import type { Vehicle, VehicleStatus } from '@/lib/types'
import { adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus } from '@/app/actions/vehicles'

const PAGE_SIZE = 10

const STATUS_TABS: { label: string; value: VehicleStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Disponível', value: 'available' },
  { label: 'Vendido', value: 'sold' },
]

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all')
  const [page, setPage] = useState(0)

  const filtered = statusFilter === 'all' ? vehicles : vehicles.filter((v) => v.status === statusFilter)
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const pageVehicles = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)

  function selectStatus(value: VehicleStatus | 'all') {
    setStatusFilter(value)
    setPage(0)
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => selectStatus(tab.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                active
                  ? 'border-graphite bg-graphite text-white'
                  : 'border-support-gray/25 text-graphite hover:border-graphite'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <ul className="flex flex-col gap-3">
        {pageVehicles.map((vehicle) => (
          <li
            key={vehicle.id}
            className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-bold">{vehicle.brand} {vehicle.model} {vehicle.version}</p>
              <p className="text-sm text-support-gray">
                {vehicle.year_model} · {vehicle.mileage_km.toLocaleString('pt-BR')} km · {formatPriceFromCents(vehicle.price_cents)} ·{' '}
                {vehicle.status === 'sold' ? 'vendido' : 'disponível'}
                {vehicle.is_featured ? ' · destaque' : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => adminSetVehicleStatus(vehicle.id, vehicle.status === 'sold' ? 'available' : 'sold')}
                className="rounded-lg border border-support-gray/25 px-4 py-2 text-sm font-bold text-graphite transition-colors hover:border-graphite"
              >
                {vehicle.status === 'sold' ? 'Marcar como disponível' : 'Marcar como vendido'}
              </button>
              <Link
                href={`/admin/veiculos/${vehicle.id}`}
                className="rounded-lg border border-support-gray/25 px-4 py-2 text-sm font-bold text-graphite transition-colors hover:border-graphite"
              >
                Editar
              </Link>
              <button
                type="button"
                onClick={() => adminSetVehicleFeatured(vehicle.id, !vehicle.is_featured)}
                className="px-2 py-2 text-sm text-support-gray transition-colors hover:text-graphite"
              >
                {vehicle.is_featured ? 'Remover destaque' : 'Marcar como destaque'}
              </button>
              <button
                type="button"
                onClick={() => { if (window.confirm('Excluir este veículo?')) adminDeleteVehicle(vehicle.id) }}
                className="px-2 py-2 text-sm text-aguiar-red transition-colors hover:underline"
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between text-sm text-support-gray">
        <p>{filtered.length} {filtered.length === 1 ? 'veículo' : 'veículos'} · página {currentPage + 1} de {pageCount}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="rounded-lg border border-support-gray/25 px-4 py-2 font-bold text-graphite transition-colors hover:border-graphite disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage >= pageCount - 1}
            className="rounded-lg border border-support-gray/25 px-4 py-2 font-bold text-graphite transition-colors hover:border-graphite disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  )
}
