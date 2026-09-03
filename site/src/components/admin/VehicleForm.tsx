'use client'

import { useMemo, useState, type DragEvent, type FormEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { uploadVehicleImage, validateImageFile, getPublicImageUrl, MAX_VEHICLE_IMAGES } from '@/lib/storage'
import { adminSaveVehicle } from '@/app/actions/vehicles'
import type { Vehicle, VehicleImage, VehicleExpense } from '@/lib/types'
import { TRANSMISSION_OPTIONS, FUEL_TYPE_OPTIONS, normalizeFuelType, withCurrentValue } from '@/lib/normalize'
import { VehicleExpensesEditor, type DraftVehicleExpense } from './VehicleExpensesEditor'
import { VehicleFipeSection, type FipeSelection } from './VehicleFipeSection'
import { VehicleOptionalsPicker } from './VehicleOptionalsPicker'
import { VehicleDatePicker } from './VehicleDatePicker'
import { isValidOptional, type VehicleOptional } from '@/lib/vehicle-optionals'
import { calculateTotalCostCents, calculateEstimatedMarginCents, calculateRealizedMarginCents } from '@/lib/vehicle-costs'
import { formatPriceFromCents } from '@/lib/format'
import { Button } from '@/components/ui/Button'

interface VehicleFormProps {
  vehicle?: Vehicle
  images?: VehicleImage[]
  expenses?: VehicleExpense[]
}

const inputClass =
  'h-11 rounded-lg border border-support-gray/25 p-2.5 text-graphite transition-colors focus:border-aguiar-red focus:outline-none'
const labelClass = 'text-sm font-bold'
// "Dados do carro" only: reserves 2 lines of height for every label in that
// grid, so a wrapping one (e.g. "Tanque de combustível (litros)") doesn't
// push its own input down relative to single-line siblings in the same row.
const carDataLabelClass = `${labelClass} min-h-10`

export function VehicleForm({ vehicle, images = [], expenses: initialExpenses = [] }: VehicleFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [imagePaths, setImagePaths] = useState<string[]>(images.map((image) => image.storage_path))
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [brand, setBrand] = useState(vehicle?.brand ?? '')
  const [model, setModel] = useState(vehicle?.model ?? '')
  const [color, setColor] = useState(vehicle?.color ?? '')
  const [fuelType, setFuelType] = useState(vehicle?.fuel_type ?? '')
  const [transmission, setTransmission] = useState(vehicle?.transmission ?? '')
  const [yearModel, setYearModel] = useState(vehicle?.year_model != null ? String(vehicle.year_model) : '')
  const [yearFabrication, setYearFabrication] = useState(
    vehicle?.year_fabrication != null ? String(vehicle.year_fabrication) : '',
  )
  const [engine, setEngine] = useState(vehicle?.engine ?? '')
  const [seatingCapacity, setSeatingCapacity] = useState(
    vehicle?.seating_capacity != null ? String(vehicle.seating_capacity) : '',
  )
  const [bodyType, setBodyType] = useState(vehicle?.body_type ?? '')
  const [horsepower, setHorsepower] = useState(vehicle?.horsepower != null ? String(vehicle.horsepower) : '')
  const [plate, setPlate] = useState(vehicle?.plate ?? '')
  const [plateLookupError, setPlateLookupError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [priceReais, setPriceReais] = useState(vehicle ? String(vehicle.price_cents / 100) : '')
  const [acquisitionCostReais, setAcquisitionCostReais] = useState(
    vehicle?.acquisition_cost_cents != null ? String(vehicle.acquisition_cost_cents / 100) : '',
  )
  const [minSalePriceReais, setMinSalePriceReais] = useState(
    vehicle?.min_sale_price_cents != null ? String(vehicle.min_sale_price_cents / 100) : '',
  )
  const [acquiredAt, setAcquiredAt] = useState(vehicle?.acquired_at ?? '')
  const [expenses, setExpenses] = useState<DraftVehicleExpense[]>(
    initialExpenses.map((expense) => ({
      category: expense.category,
      description: expense.description ?? '',
      amountReais: String(expense.amount_cents / 100),
    })),
  )
  const [fipeSelection, setFipeSelection] = useState<FipeSelection | null>(null)
  // vehicle.optionals is plain string[] (the DB column is just text[]), so it's
  // filtered through the VehicleOptional type guard before seeding state typed
  // to the fixed catalog that adminSaveVehicle's payload requires.
  const [optionals, setOptionals] = useState<VehicleOptional[]>((vehicle?.optionals ?? []).filter(isValidOptional))

  async function handlePlateLookup() {
    setPlateLookupError(null)
    const response = await fetch(`/api/admin/placas?plate=${encodeURIComponent(plate)}`)
    const data = await response.json()
    if (!response.ok) {
      setPlateLookupError(data.error ?? 'Não foi possível buscar os dados da placa.')
      return
    }
    setBrand(data.brand)
    setModel(data.model)
    if (data.color) setColor(data.color)
    if (data.fuelType) {
      const normalized = normalizeFuelType(data.fuelType)
      // Only auto-select when the lookup value actually matches one of the
      // fixed dropdown options — an unrecognized value (e.g. "Indeterminado")
      // would otherwise sit in state but render as if nothing were selected.
      if (normalized && (FUEL_TYPE_OPTIONS as string[]).includes(normalized)) setFuelType(normalized)
    }
    if (data.yearModel) setYearModel(String(data.yearModel))
    if (data.yearFabrication) setYearFabrication(String(data.yearFabrication))
    if (data.horsepower) setHorsepower(String(data.horsepower))
    if (data.seatingCapacity) setSeatingCapacity(String(data.seatingCapacity))
    if (data.engine) setEngine(data.engine)
    if (data.bodyType) setBodyType(data.bodyType)
  }

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    setImageError(null)

    const remainingSlots = MAX_VEHICLE_IMAGES - imagePaths.length
    if (remainingSlots <= 0) {
      setImageError(`Você já atingiu o limite de ${MAX_VEHICLE_IMAGES} fotos por veículo.`)
      event.target.value = ''
      return
    }

    const accepted: File[] = []
    const rejections: string[] = []
    for (const file of files) {
      const problem = validateImageFile(file)
      if (problem) rejections.push(problem)
      else accepted.push(file)
    }

    const toUpload = accepted.slice(0, remainingSlots)
    if (accepted.length > remainingSlots) {
      rejections.push(
        `Limite de ${MAX_VEHICLE_IMAGES} fotos por veículo: só foi possível adicionar mais ${remainingSlots} ${remainingSlots === 1 ? 'foto' : 'fotos'}.`,
      )
    }
    if (rejections.length > 0) setImageError(rejections.join(' '))
    event.target.value = ''
    if (toUpload.length === 0) return

    const uploaded = await Promise.all(toUpload.map((file) => uploadVehicleImage(supabase, file)))
    setImagePaths((current) => [...current, ...uploaded])
  }

  // VehicleOptionalsPicker's onChange is typed as plain string[] (Task 15), so
  // its output is re-filtered through the same type guard before it's stored.
  function handleOptionalsChange(next: string[]) {
    setOptionals(next.filter(isValidOptional))
  }

  function handleRemoveImage(index: number) {
    setImagePaths((current) => current.filter((_, i) => i !== index))
  }

  function handleImageDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleImageDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
  }

  function handleImageDrop(index: number) {
    setImagePaths((current) => {
      if (draggedIndex === null || draggedIndex === index) return current
      const next = [...current]
      const [moved] = next.splice(draggedIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDraggedIndex(null)
  }

  const totalCostCents = calculateTotalCostCents(
    acquisitionCostReais.trim() ? Math.round(Number(acquisitionCostReais) * 100) : null,
    expenses.map((expense) => ({ amount_cents: Math.round((Number(expense.amountReais) || 0) * 100) })),
  )
  const priceCentsForMargin = Math.round((Number(priceReais) || 0) * 100)
  const showRealizedMargin = vehicle?.status === 'sold' && vehicle.sale_price_cents != null
  const marginCents = showRealizedMargin
    ? calculateRealizedMarginCents(vehicle!.sale_price_cents, totalCostCents)
    : calculateEstimatedMarginCents(priceCentsForMargin, totalCostCents)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      await adminSaveVehicle({
        id: vehicle?.id,
        brand,
        model,
        version: String(formData.get('version') || ''),
        yearModel: Number(yearModel),
        yearFabrication: Number(yearFabrication),
        mileageKm: Number(formData.get('mileageKm')),
        priceCents: Math.round(Number(priceReais) * 100),
        fuelType,
        transmission,
        color,
        description: String(formData.get('description') || ''),
        engine,
        fuelTankLiters: formData.get('fuelTankLiters') ? Number(formData.get('fuelTankLiters')) : undefined,
        seatingCapacity: seatingCapacity ? Number(seatingCapacity) : undefined,
        bodyType,
        doors: formData.get('doors') ? Number(formData.get('doors')) : undefined,
        horsepower: horsepower ? Number(horsepower) : undefined,
        plate,
        isFeatured: formData.get('isFeatured') === 'on',
        imagePaths,
        acquisitionCostCents: acquisitionCostReais.trim() ? Math.round(Number(acquisitionCostReais) * 100) : undefined,
        minSalePriceCents: minSalePriceReais.trim() ? Math.round(Number(minSalePriceReais) * 100) : undefined,
        acquiredAt: acquiredAt || undefined,
        expenses: expenses
          .filter((expense) => expense.amountReais.trim() !== '')
          .map((expense) => ({
            category: expense.category,
            description: expense.description || undefined,
            amountCents: Math.round(Number(expense.amountReais) * 100),
          })),
        // Seeded from the vehicle's already-saved FIPE data whenever the FIPE
        // section itself wasn't touched, so an unrelated edit never wipes it.
        fipeBrandCode: fipeSelection?.brandCode ?? vehicle?.fipe_brand_code ?? undefined,
        fipeModelCode: fipeSelection?.modelCode ?? vehicle?.fipe_model_code ?? undefined,
        fipeYearCode: fipeSelection?.yearCode ?? vehicle?.fipe_year_code ?? undefined,
        fipeValueCents: fipeSelection?.valueCents ?? vehicle?.fipe_value_cents ?? undefined,
        fipeFetchedAt: fipeSelection?.fetchedAt ?? vehicle?.fipe_fetched_at ?? undefined,
        optionals,
      })
      router.push('/admin/veiculos')
    } catch {
      setError('Não foi possível salvar o veículo. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-[1600px] flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1.5 border-b border-support-gray/15 pb-6">
        <label htmlFor="images" className={labelClass}>Fotos do veículo (até {MAX_VEHICLE_IMAGES})</label>
        <input
          id="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={imagePaths.length >= MAX_VEHICLE_IMAGES}
          onChange={handleFilesSelected}
          className="rounded-lg border border-support-gray/25 p-2.5 text-sm text-graphite disabled:cursor-not-allowed disabled:opacity-50"
        />
        {imageError && <p className="text-sm text-aguiar-red">{imageError}</p>}
        {imagePaths.length > 0 && (
          <>
            <p className="text-xs text-support-gray">Arraste as fotos para reordenar. A primeira é a capa do anúncio.</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {imagePaths.map((path, index) => (
                <div
                  key={path}
                  draggable
                  onDragStart={() => handleImageDragStart(index)}
                  onDragOver={handleImageDragOver}
                  onDrop={() => handleImageDrop(index)}
                  className="group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-support-gray/25 bg-support-gray/5 active:cursor-grabbing"
                >
                  <img
                    src={getPublicImageUrl(supabase, 'vehicle-images', path)}
                    alt={`Foto ${index + 1} do veículo`}
                    className="h-full w-full object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-aguiar-red px-1.5 py-0.5 text-xs font-bold text-white">
                      Capa
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    aria-label={`Remover foto ${index + 1}`}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-graphite/70 text-xs leading-none text-white opacity-0 transition-opacity hover:bg-aguiar-red group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-b border-support-gray/15 pb-6">
        <label htmlFor="plate" className={labelClass}>
          Placa
        </label>
        <div className="flex gap-2">
          <input
            id="plate"
            name="plate"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="Ex.: ABC1D23"
            className={`flex-1 ${inputClass}`}
          />
          <button
            type="button"
            onClick={handlePlateLookup}
            className="rounded-lg bg-graphite px-4 py-2 font-bold text-white transition-colors hover:bg-graphite/80"
          >
            Buscar dados
          </button>
        </div>
        {plateLookupError && <p className="text-sm text-aguiar-red">{plateLookupError}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl bg-card-gray p-6">
          <h2 className="text-lg font-bold">Dados do carro</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="brand" className={carDataLabelClass}>Marca</label>
              <input id="brand" name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required placeholder="Ex.: Fiat" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="model" className={carDataLabelClass}>Modelo</label>
              <input id="model" name="model" value={model} onChange={(e) => setModel(e.target.value)} required placeholder="Ex.: HB20" className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="version" className={carDataLabelClass}>Versão</label>
              <input id="version" name="version" defaultValue={vehicle?.version ?? ''} placeholder="Ex.: Comfort" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="yearModel" className={carDataLabelClass}>Ano do modelo</label>
              <input id="yearModel" name="yearModel" type="number" value={yearModel} onChange={(e) => setYearModel(e.target.value)} required placeholder="Ex.: 2024" className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="yearFabrication" className={carDataLabelClass}>Ano de fabricação</label>
              <input id="yearFabrication" name="yearFabrication" type="number" value={yearFabrication} onChange={(e) => setYearFabrication(e.target.value)} required placeholder="Ex.: 2023" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mileageKm" className={carDataLabelClass}>Quilometragem</label>
              <input id="mileageKm" name="mileageKm" type="number" defaultValue={vehicle?.mileage_km} required placeholder="Ex.: 12000" className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="color" className={carDataLabelClass}>Cor</label>
              <input id="color" name="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Ex.: Branco" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transmission" className={carDataLabelClass}>Câmbio</label>
              <select id="transmission" name="transmission" value={transmission} onChange={(e) => setTransmission(e.target.value)} className={inputClass}>
                <option value="">Selecione</option>
                {withCurrentValue(TRANSMISSION_OPTIONS, vehicle?.transmission).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="fuelType" className={carDataLabelClass}>Combustível</label>
              <select id="fuelType" name="fuelType" value={fuelType} onChange={(e) => setFuelType(e.target.value)} className={inputClass}>
                <option value="">Selecione</option>
                {withCurrentValue(FUEL_TYPE_OPTIONS, vehicle?.fuel_type).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="engine" className={carDataLabelClass}>Motor</label>
              <input id="engine" name="engine" value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="Ex.: 1.6" className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="fuelTankLiters" className={carDataLabelClass}>Tanque de combustível (litros)</label>
              <input id="fuelTankLiters" name="fuelTankLiters" type="number" defaultValue={vehicle?.fuel_tank_liters ?? ''} placeholder="Ex.: 55" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="seatingCapacity" className={carDataLabelClass}>Quantidade de pessoas</label>
              <input id="seatingCapacity" name="seatingCapacity" type="number" value={seatingCapacity} onChange={(e) => setSeatingCapacity(e.target.value)} placeholder="Ex.: 5" className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bodyType" className={carDataLabelClass}>Tipo de carroceria</label>
              <input id="bodyType" name="bodyType" value={bodyType} onChange={(e) => setBodyType(e.target.value)} placeholder="Ex.: Hatch" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="doors" className={carDataLabelClass}>Portas</label>
              <input id="doors" name="doors" type="number" defaultValue={vehicle?.doors ?? ''} placeholder="Ex.: 4" className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="horsepower" className={carDataLabelClass}>Potência (cv)</label>
              <input id="horsepower" name="horsepower" type="number" value={horsepower} onChange={(e) => setHorsepower(e.target.value)} placeholder="Ex.: 116" className={inputClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className={labelClass}>Descrição</label>
            <textarea id="description" name="description" defaultValue={vehicle?.description ?? ''} rows={4} className="rounded-lg border border-support-gray/25 p-2.5 text-graphite transition-colors focus:border-aguiar-red focus:outline-none" />
          </div>
        </div>

        <div id="custos" className="flex flex-col gap-4 rounded-xl bg-card-gray p-6">
          <h2 className="text-lg font-bold">Valores e custos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="priceReais" className={labelClass}>Preço</label>
              <input id="priceReais" name="priceReais" type="number" value={priceReais} onChange={(e) => setPriceReais(e.target.value)} required placeholder="Ex.: 45900" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="acquisitionCostReais" className={labelClass}>Custo de aquisição</label>
              <input id="acquisitionCostReais" type="number" value={acquisitionCostReais} onChange={(e) => setAcquisitionCostReais(e.target.value)} placeholder="Ex.: 40000" className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="minSalePriceReais" className={labelClass}>Preço mínimo de venda</label>
              <input id="minSalePriceReais" type="number" value={minSalePriceReais} onChange={(e) => setMinSalePriceReais(e.target.value)} placeholder="Ex.: 42000" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="acquiredAt" className={labelClass}>Data de aquisição</label>
              <VehicleDatePicker id="acquiredAt" value={acquiredAt} onChange={setAcquiredAt} />
            </div>
          </div>

          <VehicleExpensesEditor expenses={expenses} onChange={setExpenses} />
          <p className="text-sm font-bold text-graphite">
            {showRealizedMargin ? 'Margem realizada' : 'Margem estimada'}: {formatPriceFromCents(marginCents ?? 0)}
          </p>

          <VehicleFipeSection
            initialValueCents={vehicle?.fipe_value_cents}
            initialFetchedAt={vehicle?.fipe_fetched_at}
            onSelect={setFipeSelection}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="isFeatured" defaultChecked={vehicle?.is_featured} className="h-4 w-4 accent-aguiar-red" />
        Destacar na Home
      </label>

      <div className="flex flex-col gap-3 border-t border-support-gray/15 pt-6">
        <h2 className="text-lg font-bold">Opcionais</h2>
        <VehicleOptionalsPicker selected={optionals} onChange={handleOptionalsChange} />
      </div>

      {error && <p className="text-sm text-aguiar-red">{error}</p>}
      <Button type="submit" className="self-start">Salvar</Button>
    </form>
  )
}
