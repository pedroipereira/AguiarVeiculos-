'use client'

import { useState, type FormEvent } from 'react'
import { adminSetSiteSetting } from '@/app/actions/site-settings'
import { Button } from '@/components/ui/Button'

interface LocationVideoFormProps {
  locationVideoUrl: string | null
}

export function LocationVideoForm({ locationVideoUrl }: LocationVideoFormProps) {
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setSaving(true)
    try {
      await adminSetSiteSetting('location_video_url', String(formData.get('locationVideoUrl') || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">Vídeo de localização</h2>
        <p className="text-sm text-support-gray">Vídeo de "como chegar" exibido na seção de contato da Home.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-3">
        <label htmlFor="locationVideoUrl" className="text-sm font-bold">
          Link do vídeo
        </label>
        <input
          id="locationVideoUrl"
          name="locationVideoUrl"
          defaultValue={locationVideoUrl ?? ''}
          placeholder="https://..."
          className="rounded-lg border border-support-gray/25 p-2.5 text-sm text-graphite transition-colors focus:border-aguiar-red focus:outline-none"
        />
        <Button type="submit" disabled={saving} className="self-start">
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </section>
  )
}
