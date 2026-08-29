'use client'

import Link from 'next/link'
import { formatPriceFromCents } from '@/lib/format'
import type { Vehicle } from '@/lib/types'
import { adminDeleteVehicle, adminSetVehicleFeatured, adminSetVehicleStatus } from '@/app/actions/vehicles'

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-support-gray">
          <th className="py-2">Veículo</th>
          <th>Preço</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => (
          <tr key={vehicle.id} className="border-b border-support-gray/40">
            <td className="py-2">{vehicle.brand} {vehicle.model} {vehicle.version}</td>
            <td>{formatPriceFromCents(vehicle.price_cents)}</td>
            <td>{vehicle.status === 'sold' ? 'Vendido' : 'Disponível'}{vehicle.is_featured ? ' · Destaque' : ''}</td>
            <td className="flex gap-2 py-2">
              <Link href={`/admin/veiculos/${vehicle.id}`} className="text-aguiar-red hover:underline">Editar</Link>
              <button onClick={() => adminSetVehicleFeatured(vehicle.id, !vehicle.is_featured)}>
                {vehicle.is_featured ? 'Remover destaque' : 'Marcar como destaque'}
              </button>
              <button onClick={() => adminSetVehicleStatus(vehicle.id, vehicle.status === 'sold' ? 'available' : 'sold')}>
                {vehicle.status === 'sold' ? 'Marcar como disponível' : 'Marcar como vendido'}
              </button>
              <button
                onClick={() => { if (window.confirm('Excluir este veículo?')) adminDeleteVehicle(vehicle.id) }}
                className="text-aguiar-red"
              >
                Excluir
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
