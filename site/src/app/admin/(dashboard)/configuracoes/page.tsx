import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { parseTurnoverThreshold } from '@/lib/vehicle-stock'
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm'

export default async function AdminConfiguracoesPage() {
  const client = await createServerSupabaseClient()
  const locationVideoUrl = await getSiteSetting(client, 'location_video_url')
  const stockTurnoverThresholdDays = parseTurnoverThreshold(await getSiteSetting(client, 'stock_turnover_threshold_days'))

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Configurações</h1>
      <SiteSettingsForm locationVideoUrl={locationVideoUrl} stockTurnoverThresholdDays={stockTurnoverThresholdDays} />
    </div>
  )
}
