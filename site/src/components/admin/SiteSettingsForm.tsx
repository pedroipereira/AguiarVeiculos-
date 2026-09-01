'use client'

import type { FormEvent } from 'react'
import { adminSetSiteSetting } from '@/app/actions/site-settings'
import { Button } from '@/components/ui/Button'

interface SiteSettingsFormProps {
  locationVideoUrl: string | null
  stockTurnoverThresholdDays: number
}

export function SiteSettingsForm({ locationVideoUrl, stockTurnoverThresholdDays }: SiteSettingsFormProps) {
  async function handleLocationVideoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await adminSetSiteSetting('location_video_url', String(formData.get('locationVideoUrl') || ''))
  }

  async function handleTurnoverThresholdSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await adminSetSiteSetting('stock_turnover_threshold_days', String(formData.get('stockTurnoverThresholdDays') || ''))
  }

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <form onSubmit={handleLocationVideoSubmit} className="flex flex-col gap-3">
        <label htmlFor="locationVideoUrl">Vídeo de localização (como chegar)</label>
        <input
          id="locationVideoUrl"
          name="locationVideoUrl"
          defaultValue={locationVideoUrl ?? ''}
          placeholder="https://..."
          className="rounded border p-2 text-graphite"
        />
        <Button type="submit">Salvar</Button>
      </form>

      <form onSubmit={handleTurnoverThresholdSubmit} className="flex flex-col gap-3">
        <label htmlFor="stockTurnoverThresholdDays">Limiar de giro de estoque (dias)</label>
        <p className="text-sm text-support-gray">
          Um veículo disponível aparece na aba &quot;Girar&quot; do Estoque a partir deste número de dias parado.
        </p>
        <input
          id="stockTurnoverThresholdDays"
          name="stockTurnoverThresholdDays"
          type="number"
          min={1}
          defaultValue={stockTurnoverThresholdDays}
          className="rounded border p-2 text-graphite"
        />
        <Button type="submit">Salvar</Button>
      </form>
    </div>
  )
}
