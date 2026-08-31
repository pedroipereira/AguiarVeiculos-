'use client'

import { useState, type ReactNode } from 'react'
import type { VehiclePublic } from '@/lib/types'
import { VehicleFilters, type VehicleFiltersProps } from './VehicleFilters'
import { VehicleSearchSort } from './VehicleSearchSort'

interface VehicleCatalogControlsProps {
  filtersProps: Omit<VehicleFiltersProps, 'mobileOpen'>
  resultCount: number
  allVehicles: VehiclePublic[]
  allVehicleImageUrls: Record<string, string>
  children: ReactNode
}

/**
 * Shares the mobile "Filtros" open/closed state between the search/sort bar
 * (which owns the toggle button) and the filters panel (which it opens),
 * since they're siblings in the `/estoque` grid, not parent/child.
 */
export function VehicleCatalogControls({
  filtersProps,
  resultCount,
  allVehicles,
  allVehicleImageUrls,
  children,
}: VehicleCatalogControlsProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const brandNames = filtersProps.brands.map((item) => item.brand)

  return (
    <>
      <VehicleFilters {...filtersProps} mobileOpen={mobileFiltersOpen} />
      <div>
        <VehicleSearchSort
          resultCount={resultCount}
          mobileFiltersOpen={mobileFiltersOpen}
          onToggleMobileFilters={() => setMobileFiltersOpen((current) => !current)}
          allVehicles={allVehicles}
          allVehicleImageUrls={allVehicleImageUrls}
          brandNames={brandNames}
        />
        {children}
      </div>
    </>
  )
}
