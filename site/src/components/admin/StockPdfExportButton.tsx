'use client'

import { useState } from 'react'
import { buildStockPdf, type StockPdfVehicle } from '@/lib/stock-pdf'

interface StockPdfExportButtonProps {
  vehicles: StockPdfVehicle[]
  totalCostCentsByVehicleId: Record<string, number>
}

export function StockPdfExportButton({ vehicles, totalCostCentsByVehicleId }: StockPdfExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [includeDays, setIncludeDays] = useState(false)
  const [includeCost, setIncludeCost] = useState(false)
  const [includeMargin, setIncludeMargin] = useState(false)
  const [includeFipe, setIncludeFipe] = useState(false)

  function handleExport() {
    const doc = buildStockPdf(vehicles, totalCostCentsByVehicleId, { includeDays, includeCost, includeMargin, includeFipe })
    doc.save(`estoque-aguiar-veiculos-${new Date().toISOString().slice(0, 10)}.pdf`)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-support-gray/25 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-graphite transition-colors hover:border-graphite"
      >
        Exportar PDF
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-xl bg-white p-4 shadow-lg">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-support-gray">Incluir no PDF</p>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeDays} onChange={(e) => setIncludeDays(e.target.checked)} />
              Dias em estoque
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeCost} onChange={(e) => setIncludeCost(e.target.checked)} />
              Valor pago
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeMargin} onChange={(e) => setIncludeMargin(e.target.checked)} />
              Margem / Lucro
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeFipe} onChange={(e) => setIncludeFipe(e.target.checked)} />
              Valor FIPE (comparação)
            </label>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="mt-3 w-full rounded-full bg-aguiar-red px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700"
          >
            Gerar PDF
          </button>
        </div>
      )}
    </div>
  )
}
