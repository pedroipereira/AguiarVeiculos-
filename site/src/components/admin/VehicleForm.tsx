'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { uploadVehicleImage } from '@/lib/storage'
import { adminSaveVehicle } from '@/app/actions/vehicles'
import type { Vehicle, VehicleImage } from '@/lib/types'
import { Button } from '@/components/ui/Button'

interface VehicleFormProps {
  vehicle?: Vehicle
  images?: VehicleImage[]
}

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
    const client = createBrowserSupabaseClient()
    const uploaded = await Promise.all(files.map((file) => uploadVehicleImage(client, file)))
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
        plate,
        imagePaths,
      })
      router.push('/admin/veiculos')
    } catch {
      setError('Não foi possível salvar o veículo. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-3">
      <label htmlFor="brand">Marca</label>
      <input id="brand" name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required className="rounded border p-2 text-graphite" />
      <label htmlFor="model">Modelo</label>
      <input id="model" name="model" value={model} onChange={(e) => setModel(e.target.value)} required className="rounded border p-2 text-graphite" />
      <label htmlFor="version">Versão</label>
      <input id="version" name="version" defaultValue={vehicle?.version ?? ''} className="rounded border p-2 text-graphite" />
      <label htmlFor="yearModel">Ano do modelo</label>
      <input id="yearModel" name="yearModel" type="number" defaultValue={vehicle?.year_model} required className="rounded border p-2 text-graphite" />
      <label htmlFor="yearFabrication">Ano de fabricação</label>
      <input id="yearFabrication" name="yearFabrication" type="number" defaultValue={vehicle?.year_fabrication} required className="rounded border p-2 text-graphite" />
      <label htmlFor="mileageKm">Quilometragem</label>
      <input id="mileageKm" name="mileageKm" type="number" defaultValue={vehicle?.mileage_km} required className="rounded border p-2 text-graphite" />
      <label htmlFor="priceReais">Preço (em reais)</label>
      <input id="priceReais" name="priceReais" type="number" defaultValue={vehicle ? vehicle.price_cents / 100 : ''} required className="rounded border p-2 text-graphite" />
      <label htmlFor="fuelType">Combustível</label>
      <input id="fuelType" name="fuelType" value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="rounded border p-2 text-graphite" />
      <label htmlFor="transmission">Câmbio</label>
      <input id="transmission" name="transmission" defaultValue={vehicle?.transmission ?? ''} className="rounded border p-2 text-graphite" />
      <label htmlFor="color">Cor</label>
      <input id="color" name="color" value={color} onChange={(e) => setColor(e.target.value)} className="rounded border p-2 text-graphite" />
      <label htmlFor="description">Descrição</label>
      <textarea id="description" name="description" defaultValue={vehicle?.description ?? ''} className="rounded border p-2 text-graphite" />
      <label htmlFor="plate">Placa (uso interno, nunca aparece no site)</label>
      <div className="flex gap-2">
        <input id="plate" name="plate" value={plate} onChange={(e) => setPlate(e.target.value)} className="rounded border p-2 text-graphite" />
        <button type="button" onClick={handlePlateLookup} className="rounded border px-3 py-2 font-bold uppercase">
          Buscar dados
        </button>
      </div>
      {plateLookupError && <p className="text-aguiar-red">{plateLookupError}</p>}

      <label htmlFor="images">Fotos</label>
      <input id="images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFilesSelected} />
      <ul className="flex flex-col gap-1">
        {imagePaths.map((path, index) => (
          <li key={path} className="flex items-center gap-2 text-sm">
            {path}
            <button type="button" onClick={() => moveImage(index, -1)}>↑</button>
            <button type="button" onClick={() => moveImage(index, 1)}>↓</button>
          </li>
        ))}
      </ul>

      {error && <p className="text-aguiar-red">{error}</p>}
      <Button type="submit">Salvar veículo</Button>
    </form>
  )
}
