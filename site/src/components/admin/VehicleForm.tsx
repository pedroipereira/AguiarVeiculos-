'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { uploadVehicleImage, validateImageFile, MAX_VEHICLE_IMAGES } from '@/lib/storage'
import { adminSaveVehicle } from '@/app/actions/vehicles'
import type { Vehicle, VehicleImage } from '@/lib/types'
import { Button } from '@/components/ui/Button'

interface VehicleFormProps {
  vehicle?: Vehicle
  images?: VehicleImage[]
}

const inputClass =
  'rounded-lg border border-support-gray/25 p-2.5 text-graphite transition-colors focus:border-aguiar-red focus:outline-none'
const labelClass = 'text-sm font-bold'

export function VehicleForm({ vehicle, images = [] }: VehicleFormProps) {
  const router = useRouter()
  const [imagePaths, setImagePaths] = useState<string[]>(images.map((image) => image.storage_path))
  const [error, setError] = useState<string | null>(null)
  const [brand, setBrand] = useState(vehicle?.brand ?? '')
  const [model, setModel] = useState(vehicle?.model ?? '')
  const [color, setColor] = useState(vehicle?.color ?? '')
  const [fuelType, setFuelType] = useState(vehicle?.fuel_type ?? '')
  const [plate, setPlate] = useState(vehicle?.plate ?? '')
  const [plateLookupError, setPlateLookupError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

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
    if (data.fuelType) setFuelType(data.fuelType)
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

    const client = createBrowserSupabaseClient()
    const uploaded = await Promise.all(toUpload.map((file) => uploadVehicleImage(client, file)))
    setImagePaths((current) => [...current, ...uploaded])
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImagePaths((current) => {
      const next = [...current]
      const target = index + direction
      if (target < 0 || target >= next.length) return next
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      await adminSaveVehicle({
        id: vehicle?.id,
        brand,
        model,
        version: String(formData.get('version') || ''),
        yearModel: Number(formData.get('yearModel')),
        yearFabrication: Number(formData.get('yearFabrication')),
        mileageKm: Number(formData.get('mileageKm')),
        priceCents: Math.round(Number(formData.get('priceReais')) * 100),
        fuelType,
        transmission: String(formData.get('transmission') || ''),
        color,
        description: String(formData.get('description') || ''),
        engine: String(formData.get('engine') || ''),
        fuelTankLiters: formData.get('fuelTankLiters') ? Number(formData.get('fuelTankLiters')) : undefined,
        seatingCapacity: formData.get('seatingCapacity') ? Number(formData.get('seatingCapacity')) : undefined,
        bodyType: String(formData.get('bodyType') || ''),
        doors: formData.get('doors') ? Number(formData.get('doors')) : undefined,
        horsepower: formData.get('horsepower') ? Number(formData.get('horsepower')) : undefined,
        plate,
        isFeatured: formData.get('isFeatured') === 'on',
        imagePaths,
      })
      router.push('/admin/veiculos')
    } catch {
      setError('Não foi possível salvar o veículo. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1.5 border-b border-support-gray/15 pb-6">
        <label htmlFor="plate" className={labelClass}>
          Placa (uso interno, nunca aparece no site)
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
        <p className="text-sm text-support-gray">Confira os campos abaixo antes de salvar.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="brand" className={labelClass}>Marca</label>
          <input id="brand" name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="model" className={labelClass}>Modelo</label>
          <input id="model" name="model" value={model} onChange={(e) => setModel(e.target.value)} required placeholder="Ex.: HB20" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="version" className={labelClass}>Versão</label>
          <input id="version" name="version" defaultValue={vehicle?.version ?? ''} placeholder="Ex.: Comfort" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="yearModel" className={labelClass}>Ano do modelo</label>
          <input id="yearModel" name="yearModel" type="number" defaultValue={vehicle?.year_model} required placeholder="Ex.: 2024" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="yearFabrication" className={labelClass}>Ano de fabricação</label>
          <input id="yearFabrication" name="yearFabrication" type="number" defaultValue={vehicle?.year_fabrication} required placeholder="Ex.: 2023" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mileageKm" className={labelClass}>Quilometragem</label>
          <input id="mileageKm" name="mileageKm" type="number" defaultValue={vehicle?.mileage_km} required placeholder="Ex.: 12000" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="color" className={labelClass}>Cor</label>
          <input id="color" name="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Ex.: Branco" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="priceReais" className={labelClass}>Preço (em reais)</label>
          <input id="priceReais" name="priceReais" type="number" defaultValue={vehicle ? vehicle.price_cents / 100 : ''} required placeholder="Ex.: 45900" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="transmission" className={labelClass}>Câmbio</label>
          <input id="transmission" name="transmission" defaultValue={vehicle?.transmission ?? ''} placeholder="Ex.: Manual" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fuelType" className={labelClass}>Combustível</label>
          <input id="fuelType" name="fuelType" value={fuelType} onChange={(e) => setFuelType(e.target.value)} placeholder="Ex.: Flex" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="engine" className={labelClass}>Motor</label>
          <input id="engine" name="engine" defaultValue={vehicle?.engine ?? ''} placeholder="Ex.: 1.6" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fuelTankLiters" className={labelClass}>Tanque de combustível (litros)</label>
          <input id="fuelTankLiters" name="fuelTankLiters" type="number" defaultValue={vehicle?.fuel_tank_liters ?? ''} placeholder="Ex.: 55" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="seatingCapacity" className={labelClass}>Quantidade de pessoas</label>
          <input id="seatingCapacity" name="seatingCapacity" type="number" defaultValue={vehicle?.seating_capacity ?? ''} placeholder="Ex.: 5" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bodyType" className={labelClass}>Tipo de carroceria</label>
          <input id="bodyType" name="bodyType" defaultValue={vehicle?.body_type ?? ''} placeholder="Ex.: Hatch" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="doors" className={labelClass}>Portas</label>
          <input id="doors" name="doors" type="number" defaultValue={vehicle?.doors ?? ''} placeholder="Ex.: 4" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="horsepower" className={labelClass}>Potência (hp)</label>
          <input id="horsepower" name="horsepower" type="number" defaultValue={vehicle?.horsepower ?? ''} placeholder="Ex.: 116" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className={labelClass}>Descrição</label>
        <textarea id="description" name="description" defaultValue={vehicle?.description ?? ''} rows={3} className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="isFeatured" defaultChecked={vehicle?.is_featured} className="h-4 w-4 accent-aguiar-red" />
        Destacar na Home
      </label>

      <div className="flex flex-col gap-1.5">
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
          <ul className="flex flex-col gap-1">
            {imagePaths.map((path, index) => (
              <li key={path} className="flex items-center gap-2 rounded-lg bg-support-gray/5 px-3 py-2 text-sm">
                <span className="flex-1 truncate">{path}</span>
                <button type="button" onClick={() => moveImage(index, -1)} className="text-support-gray hover:text-graphite">↑</button>
                <button type="button" onClick={() => moveImage(index, 1)} className="text-support-gray hover:text-graphite">↓</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-aguiar-red">{error}</p>}
      <Button type="submit" className="self-start">Salvar</Button>
    </form>
  )
}
