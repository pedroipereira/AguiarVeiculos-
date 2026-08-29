'use client'

import type { FormEvent } from 'react'
import { adminSetSiteSetting } from '@/app/actions/site-settings'
import { Button } from '@/components/ui/Button'

export function SiteSettingsForm({ locationVideoUrl }: { locationVideoUrl: string | null }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await adminSetSiteSetting('location_video_url', String(formData.get('locationVideoUrl') || ''))
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-3">
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
  )
}
